import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

        const { id } = await params;
        const { score, timeSpent } = await req.json();

        if (score === undefined || timeSpent === undefined) {
            return NextResponse.json({ error: 'Missing score or timeSpent' }, { status: 400 });
        }

        const quiz = await prisma.quiz.findUnique({
            where: { id, userId: session.user.id }
        });

        if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

        const attempt = await prisma.quizAttempt.create({
            data: {
                quizId: id,
                userId: session.user.id,
                score,
                timeSpent
            }
        });

        return NextResponse.json({ attempt }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to submit quiz attempt' }, { status: 500 });
    }
}
