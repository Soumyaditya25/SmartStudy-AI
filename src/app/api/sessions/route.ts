import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const studySession = await prisma.studySession.create({
            data: {
                userId: session.user.id,
                title: 'New Session',
                turns: JSON.stringify([]),
            },
            select: { id: true, title: true, createdAt: true }
        });

        return NextResponse.json({ session: studySession }, { status: 201 });
    } catch (error: any) {
        console.error("Create session error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sessions = await prisma.studySession.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        return NextResponse.json({ sessions }, { status: 200 });
    } catch (error: any) {
        console.error("List sessions error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
