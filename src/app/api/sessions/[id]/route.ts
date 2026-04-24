import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const studySession = await prisma.studySession.findUnique({
            where: { id, userId: session.user.id },
        });

        if (!studySession) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({
            session: {
                id: studySession.id,
                title: studySession.title,
                turns: JSON.parse(studySession.turns),
                createdAt: studySession.createdAt.toISOString(),
                updatedAt: studySession.updatedAt.toISOString(),
            }
        }, { status: 200 });
    } catch (error: any) {
        console.error("Get session error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { title, turns } = await req.json();

        // Verify ownership
        const existing = await prisma.studySession.findUnique({
            where: { id, userId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const updated = await prisma.studySession.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(turns && { turns: JSON.stringify(turns) }),
            },
            select: { id: true, title: true, updatedAt: true }
        });

        return NextResponse.json({ session: updated }, { status: 200 });
    } catch (error: any) {
        console.error("Update session error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
