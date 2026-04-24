import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const documents = await prisma.document.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: { chunks: true }
                }
            }
        });

        const result = documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            status: doc.status,
            createdAt: doc.createdAt.toISOString(),
            updatedAt: doc.updatedAt.toISOString(),
            chunkCount: doc._count.chunks,
        }));

        return NextResponse.json({ documents: result }, { status: 200 });
    } catch (error: any) {
        console.error("List files error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
