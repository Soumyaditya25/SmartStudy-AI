import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

        const quizzes = await prisma.quiz.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                document: { select: { name: true } },
                _count: { select: { questions: true } },
                attempts: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        return NextResponse.json({ quizzes }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
    }
}
