import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// SM-2 Spaced Repetition Algorithm Implementation
function calculateNextReview(quality: number, repetitions: number, previousInterval: number, previousEaseFactor: number) {
    let nextInterval = 0;
    let nextRepetitions = repetitions;
    let nextEaseFactor = previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    if (nextEaseFactor < 1.3) nextEaseFactor = 1.3;

    if (quality < 3) {
        // Failed / Hard -> reset repetitions
        nextRepetitions = 0;
        nextInterval = 1; // Review tomorrow
    } else {
        // Passed
        if (repetitions === 0) {
            nextInterval = 1;
        } else if (repetitions === 1) {
            nextInterval = 6;
        } else {
            nextInterval = Math.round(previousInterval * previousEaseFactor);
        }
        nextRepetitions++;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

    return { nextInterval, nextRepetitions, nextEaseFactor, nextReviewDate };
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

        const { id } = await params;
        const { quality } = await req.json(); // Quality: 0-5 (0=Blackout, 1=Wrong, 2=Hard, 3=Good, 4=Easy, 5=Perfect)

        if (quality === undefined || quality < 0 || quality > 5) {
            return NextResponse.json({ error: 'Invalid quality rating. Must be 0-5.' }, { status: 400 });
        }

        const card = await prisma.flashcard.findUnique({
            where: { id, userId: session.user.id }
        });

        if (!card) return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });

        const { nextInterval, nextRepetitions, nextEaseFactor, nextReviewDate } = calculateNextReview(
            quality,
            card.repetitions,
            card.interval,
            card.easeFactor
        );

        const updatedCard = await prisma.flashcard.update({
            where: { id },
            data: {
                interval: nextInterval,
                repetitions: nextRepetitions,
                easeFactor: nextEaseFactor,
                nextReview: nextReviewDate
            }
        });

        return NextResponse.json({ flashcard: updatedCard }, { status: 200 });

    } catch (error: any) {
        console.error("Flashcard Review API Error:", error);
        return NextResponse.json({ error: 'Failed to update flashcard review' }, { status: 500 });
    }
}
