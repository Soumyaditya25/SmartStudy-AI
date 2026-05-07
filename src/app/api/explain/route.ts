import { NextResponse } from "next/server";
import { auth } from "@/auth";

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
                            maxOutputTokens: 1000,
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

export const POST = auth(async function POST(req) {
    if (!req.auth?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { text } = await req.json();

        if (!text || typeof text !== "string" || text.length > 500) {
            return NextResponse.json(
                { error: "Invalid text provided" },
                { status: 400 }
            );
        }

        const prompt = `You are a helpful study assistant. Explain the following concept clearly and concisely. Use simple language suitable for a student. Keep the explanation under 150 words.

Concept to explain: "${text}"`;

        const explanation = await generateText(prompt);

        return NextResponse.json({ explanation });
    } catch (error) {
        console.error("Explain route error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
});
