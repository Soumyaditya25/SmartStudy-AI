import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// ---- Multi-provider text generation (non-streaming) ----

async function generateWithGoogle(prompt: string): Promise<string> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error('No Google API key');

    // Try multiple models (each has separate quota)
    const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastErr = '';

    for (const model of models) {
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 4096,
                            responseMimeType: 'application/json',
                        }
                    }),
                }
            );

            if (res.ok) {
                const data = await res.json();
                console.log(`  → Google ${model} OK`);
                return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }

            lastErr = `${model}: ${res.status}`;
            if (res.status !== 429) break; // Only retry on rate limit
        } catch (e: any) {
            lastErr = e.message;
        }
    }
    throw new Error(`Google API failed: ${lastErr}`);
}

async function generateWithGroq(prompt: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('No Groq API key');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        }),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

async function generateText(prompt: string): Promise<string> {
    const providers = [
        { name: 'Groq', fn: generateWithGroq, available: !!process.env.GROQ_API_KEY },
        { name: 'Google Gemini', fn: generateWithGoogle, available: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY },
    ];

    let lastError = '';
    for (const provider of providers) {
        if (!provider.available) continue;
        try {
            console.log(`Practice gen: trying ${provider.name}...`);
            return await provider.fn(prompt);
        } catch (err: any) {
            lastError = err.message;
            console.warn(`${provider.name} failed:`, err.message);
        }
    }
    throw new Error(`All AI providers failed. Last error: ${lastError}`);
}

// ---- JSON extraction ----
function extractJSON(text: string): any {
    try { return JSON.parse(text.trim()); } catch {}
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/```\n?([\s\S]*?)\n?```/);
    if (jsonMatch) { try { return JSON.parse(jsonMatch[1].trim()); } catch {} }
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) { try { return JSON.parse(braceMatch[0]); } catch {} }
    throw new Error('Could not extract valid JSON from AI response');
}

// ---- Main handler ----
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { documentId, topic, count = 5 } = await req.json();

        if (!documentId) {
            return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
        }

        const doc = await prisma.document.findUnique({
            where: { id: documentId, userId: session.user.id },
            select: { id: true, name: true }
        });

        if (!doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const chunks = await prisma.chunk.findMany({
            where: { documentId, userId: session.user.id },
            select: { content: true }
        });

        if (chunks.length === 0) {
            return NextResponse.json({ error: 'No content available for this document.' }, { status: 400 });
        }

        const contextStr = chunks.slice(0, 10).map(c => c.content).join('\n---\n');

        const prompt = `You are a strict teacher. Given the following course material, generate exactly ${count} practice questions${topic ? ` focused on the topic: ${topic}` : ''}.

Distribution: 2 beginner, 2 intermediate, 1 advanced difficulty.

Context:
${contextStr}

Return ONLY a JSON object with this exact structure (no markdown, just raw JSON):
{"questions": [{"difficulty": "beginner", "question": "...", "answer": "...", "solutionSteps": "..."}, ...]}`;

        const responseText = await generateText(prompt);

        let parsedResult;
        try {
            parsedResult = extractJSON(responseText);
        } catch {
            console.error("Failed to parse AI response:", responseText.slice(0, 500));
            return NextResponse.json({ error: 'Failed to parse practice questions. Please try again.' }, { status: 500 });
        }

        if (!parsedResult.questions || !Array.isArray(parsedResult.questions)) {
            return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 500 });
        }

        const createdQs = await prisma.$transaction(
            parsedResult.questions.map((q: any) =>
                prisma.practiceQuestion.create({
                    data: {
                        userId: session.user!.id as string,
                        documentId,
                        difficulty: q.difficulty || 'intermediate',
                        question: q.question || '',
                        answer: q.answer || '',
                        solutionSteps: q.solutionSteps || q.solution || '',
                    }
                })
            )
        );

        return NextResponse.json({ questions: createdQs }, { status: 200 });

    } catch (error: any) {
        console.error("Practice Gen API Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to generate questions' }, { status: 500 });
    }
}
