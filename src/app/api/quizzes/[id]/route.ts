import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

        const { id } = await params;

        const quiz = await prisma.quiz.findUnique({
            where: { id, userId: session.user.id },
            include: { questions: true }
        });

        if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

        return NextResponse.json({ quiz }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
    }
}
