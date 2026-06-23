import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// ---- Embedding via Google Gemini API (free, no model download) ----
async function getGeminiEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not set');

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: { parts: [{ text: text.slice(0, 2048) }] },
            }),
        }
    );
    if (!res.ok) throw new Error(`Gemini embedding failed: ${res.status}`);
    const data = await res.json();
    return data.embedding?.values ?? [];
}

function cosineSimilarity(A: number[], B: number[]) {
    let dotproduct = 0;
    let mA = 0;
    let mB = 0;
    for (let i = 0; i < A.length; i++) {
        dotproduct += (A[i] * B[i]);
        mA += (A[i] * A[i]);
        mB += (B[i] * B[i]);
    }
    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    return Math.abs(mA) < 1e-9 || Math.abs(mB) < 1e-9 ? 0 : dotproduct / (mA * mB);
}

// ---- Provider-agnostic LLM calling with SSE parsing ----

interface LLMProvider {
    name: string;
    available: () => boolean;
    streamChat: (systemPrompt: string, messages: any[], userMessage: string) => Promise<ReadableStream<Uint8Array>>;
}

// Provider 1: Google AI Studio (Free tier - tries multiple models)
function googleProvider(): LLMProvider {
    return {
        name: 'Google Gemini',
        available: () => !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        streamChat: async (systemPrompt, messages, userMessage) => {
            const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

            const contents = [];
            for (const m of messages.slice(0, -1)) {
                contents.push({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                });
            }
            contents.push({ role: 'user', parts: [{ text: userMessage }] });

            // Try multiple models in case one has exhausted quota
            const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash'];
            let lastErr = '';

            for (const model of models) {
                try {
                    const res = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                system_instruction: { parts: [{ text: systemPrompt }] },
                                contents,
                                generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
                            }),
                        }
                    );

                    if (res.ok) {
                        console.log(`  → Google ${model} OK`);
                        return transformSSEStream(res.body!, (data: string) => {
                            try {
                                const parsed = JSON.parse(data);
                                return parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            } catch { return ''; }
                        });
                    }

                    const errText = await res.text();
                    lastErr = `${model}: ${res.status}`;
                    console.warn(`  → Google ${model} failed (${res.status})`);

                    // If it's NOT a rate limit, don't bother trying other models
                    if (res.status !== 429) break;
                } catch (e: any) {
                    lastErr = e.message;
                }
            }
            throw new Error(`Google API failed: ${lastErr}`);
        }
    };
}

// Provider 2: Groq (generous free tier - 30 RPM, 14400 RPD)
function groqProvider(): LLMProvider {
    return {
        name: 'Groq Free',
        available: () => !!process.env.GROQ_API_KEY,
        streamChat: async (systemPrompt, messages, userMessage) => {
            const apiKey = process.env.GROQ_API_KEY!;

            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages.slice(0, -1).map((m: any) => ({ role: m.role, content: m.content })),
                        { role: 'user', content: userMessage }
                    ],
                    stream: true,
                }),
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
            }

            return transformSSEStream(res.body!, (data: string) => {
                if (data === '[DONE]') return '';
                try {
                    const parsed = JSON.parse(data);
                    return parsed.choices?.[0]?.delta?.content || '';
                } catch { return ''; }
            });
        }
    };
}

/**
 * Transforms an SSE stream (data: {...}) into a plain text stream.
 * The extractContent function pulls text from each SSE event's JSON.
 */
function transformSSEStream(
    body: ReadableStream<Uint8Array>,
    extractContent: (data: string) => string
): ReadableStream<Uint8Array> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = '';

    return new ReadableStream<Uint8Array>({
        async pull(controller) {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    if (buffer.trim()) {
                        for (const line of buffer.split('\n')) {
                            if (line.startsWith('data: ')) {
                                const text = extractContent(line.slice(6).trim());
                                if (text) controller.enqueue(encoder.encode(text));
                            }
                        }
                    }
                    controller.close();
                    return;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('data: ')) {
                        const text = extractContent(trimmed.slice(6).trim());
                        if (text) controller.enqueue(encoder.encode(text));
                    }
                }
            }
        },
        cancel() { reader.cancel(); }
    });
}

// ---- Level instructions ----
const LEVEL_INSTRUCTIONS: Record<string, string> = {
    beginner: "Explain concepts in simple, clear language. Use analogies and avoid jargon.",
    intermediate: "Provide balanced explanations with some technical terminology.",
    advanced: "Give thorough, technical explanations with precise terminology and nuances.",
};

// ---- Main handler ----
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { messages, documentId, level = 'intermediate' } = await req.json();
        const latestMessage = messages[messages.length - 1];

        // 1. Fetch chunks
        const whereClause = documentId
            ? { documentId, userId: session.user.id }
            : { userId: session.user.id };

        const chunks = await prisma.chunk.findMany({
            where: whereClause,
            select: {
                id: true, content: true, embedding: true,
                page: true, chunkIndex: true,
                document: { select: { name: true, id: true } }
            }
        });

        // 2. Score chunks
        let scoredChunks: any[] = [];
        try {
            const queryEmbedding = await getGeminiEmbedding(latestMessage.content);
            scoredChunks = chunks.map(chunk => {
                const chunkVector = JSON.parse(chunk.embedding || '[]');
                const score = chunkVector.length > 0 ? cosineSimilarity(queryEmbedding, chunkVector) : 0;
                return { ...chunk, score };
            });
        } catch {
            // Keyword fallback
            const queryWords = latestMessage.content.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
            scoredChunks = chunks.map(chunk => {
                const content = chunk.content.toLowerCase();
                let score = 0;
                for (const word of queryWords) { if (content.includes(word)) score += 1; }
                return { ...chunk, score: score / Math.max(1, Math.sqrt(content.length / 100)) };
            });
        }

        scoredChunks.sort((a, b) => b.score - a.score);
        const topK = scoredChunks.slice(0, 4);

        const contextStr = topK.map((c, i) =>
            `[Source ${i + 1}: "${c.document.name}", Chunk ${c.chunkIndex}]\n${c.content}`
        ).join('\n\n');

        const levelInstruction = LEVEL_INSTRUCTIONS[level] || LEVEL_INSTRUCTIONS.intermediate;

        const systemPrompt = `You are SmartStudy AI, a helpful tutor.

LEVEL: ${level.toUpperCase()} — ${levelInstruction}

RULES:
- Answer based strictly on the context below.
- If not found, say "I can't find that in your materials."
- Cite sources as [Source N].
- Use headings, bullet points, and code blocks as appropriate.

CONTEXT:
${contextStr}
`;

        // 3. Try providers in priority order
        // Groq primary (generous free tier), Google as fallback
        const providers: LLMProvider[] = [
            groqProvider(),
            googleProvider(),
        ];

        let lastError = '';
        for (const provider of providers) {
            if (!provider.available()) continue;

            try {
                console.log(`Trying ${provider.name}...`);
                const stream = await provider.streamChat(systemPrompt, messages, latestMessage.content);
                return new Response(stream, {
                    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }
                });
            } catch (error: any) {
                lastError = error.message;
                console.warn(`${provider.name} failed:`, error.message);
            }
        }

        return NextResponse.json({
            error: `All AI providers failed. ${lastError}.\n\nFix: Add a free API key in .env:\n• https://console.groq.com → GROQ_API_KEY (recommended, 14400 free req/day)\n• https://aistudio.google.com → GOOGLE_GENERATIVE_AI_API_KEY`
        }, { status: 503 });

    } catch (error: any) {
        console.error("Query API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
