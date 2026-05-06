import { NextResponse } from "next/server";
import { auth } from "@/auth";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

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

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://smartstudy.ai",
                "X-Title": "SmartStudy AI",
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct:free",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful study assistant. Explain concepts clearly and concisely. Use simple language suitable for a student. Keep explanations under 150 words."
                    },
                    {
                        role: "user",
                        content: `Explain this in simple terms: "${text}"`
                    }
                ],
                max_tokens: 300,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("OpenRouter API error:", error);
            return NextResponse.json(
                { error: "Failed to get explanation" },
                { status: 500 }
            );
        }

        const data = await response.json();
        const explanation = data.choices?.[0]?.message?.content || "No explanation available.";

        return NextResponse.json({ explanation });
    } catch (error) {
        console.error("Explain route error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
});
