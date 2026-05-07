import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

        const { searchParams } = new URL(req.url);
        const docId = searchParams.get('docId');

        const where: any = {
            userId: session.user.id,
            nextReview: { lte: new Date() } // Only due cards
        };

        if (docId) {
            where.documentId = docId;
        }

        const dueCards = await prisma.flashcard.findMany({
            where,
            orderBy: { nextReview: 'asc' }, // Most overdue first
            take: 30 // Max 30 cards per session
        });

        return NextResponse.json({ flashcards: dueCards }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 });
    }
}
