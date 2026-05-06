import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const GET = auth(async function GET(req) {
    if (!req.auth?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = req.auth.user.id;
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    const difficulty = searchParams.get("difficulty") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    try {
        const questions = await prisma.practiceQuestion.findMany({
            where: {
                userId,
                ...(documentId && { documentId }),
                ...(difficulty && { difficulty }),
            },
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                document: {
                    select: { name: true },
                },
            },
        });

        // Transform to flashcard format with SRS data
        const flashcards = questions.map((q) => ({
            id: q.id,
            question: q.question,
            answer: q.answer,
            solutionSteps: JSON.parse(q.solutionSteps || "[]"),
            difficulty: q.difficulty,
            documentName: q.document.name,
            // SRS fields
            srs: {
                interval: 0, // days until next review
                repetitions: 0, // times reviewed
                easeFactor: 2.5, // ease factor (SM-2 algorithm)
                nextReview: new Date().toISOString(),
                lastReviewed: null,
            },
        }));

        return NextResponse.json({ flashcards });
    } catch (error) {
        console.error("Flashcards fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch flashcards" },
            { status: 500 }
        );
    }
});
