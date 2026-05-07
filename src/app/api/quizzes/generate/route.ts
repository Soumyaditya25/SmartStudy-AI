import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

async function generateWithGoogle(prompt: string): Promise<string> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error('No Google API key');

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
                            maxOutputTokens: 3000,
                            responseMimeType: 'application/json',
                        }
                    }),
                }
            );

            if (res.ok) {
                const data = await res.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }

            lastErr = `${model}: ${res.status}`;
            if (res.status !== 429) break;
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
            return await provider.fn(prompt);
        } catch (err: any) {
            lastError = err.message;
            console.warn(`${provider.name} failed:`, err.message);
        }
    }
    throw new Error(`All AI providers failed. Last error: ${lastError}`);
}

function extractJSON(text: string): any {
    try { return JSON.parse(text.trim()); } catch {}
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/```\n?([\s\S]*?)\n?```/);
    if (jsonMatch) { try { return JSON.parse(jsonMatch[1].trim()); } catch {} }
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) { try { return JSON.parse(braceMatch[0]); } catch {} }
    throw new Error('Could not extract valid JSON from AI response');
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

        const { documentId, title, count = 5, timeLimit = 300 } = await req.json(); // default 5 mins

        if (!documentId) return NextResponse.json({ error: 'documentId is required' }, { status: 400 });

        const doc = await prisma.document.findUnique({
            where: { id: documentId, userId: session.user.id },
            select: { id: true, name: true }
        });
        if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

        const chunks = await prisma.chunk.findMany({
            where: { documentId, userId: session.user.id },
            select: { content: true }
        });

        if (chunks.length === 0) {
            return NextResponse.json({ error: 'No content available for this document.' }, { status: 400 });
        }

        const contextStr = chunks.slice(0, 15).map(c => c.content).join('\n---\n');

        const prompt = `You are an expert quiz creator. Given the following course material, generate a ${count}-question multiple-choice quiz.
        
Context:
${contextStr}

Return ONLY a JSON object with this exact structure (no markdown, just raw JSON):
{
  "questions": [
    {
      "question": "What is...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 2, // The index of the correct option (0-3)
      "explanation": "Option C is correct because..."
    }
  ]
}`;

        const responseText = await generateText(prompt);
        
        let parsedResult;
        try {
            parsedResult = extractJSON(responseText);
        } catch {
            return NextResponse.json({ error: 'Failed to parse quiz. Please try again.' }, { status: 500 });
        }

        if (!parsedResult.questions || !Array.isArray(parsedResult.questions)) {
            return NextResponse.json({ error: 'AI returned invalid format.' }, { status: 500 });
        }

        const quiz = await prisma.quiz.create({
            data: {
                userId: session.user.id,
                documentId,
                title: title || `${doc.name} Quiz`,
                timeLimit,
                questions: {
                    create: parsedResult.questions.map((q: any) => ({
                        question: q.question,
                        options: JSON.stringify(q.options),
                        correctOption: q.correctOption,
                        explanation: q.explanation
                    }))
                }
            }
        });

        return NextResponse.json({ quiz }, { status: 200 });

    } catch (error: any) {
        console.error("Quiz Gen API Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to generate quiz' }, { status: 500 });
    }
}
