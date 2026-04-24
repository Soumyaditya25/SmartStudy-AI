import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

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

        const document = await prisma.document.findUnique({
            where: { id, userId: session.user.id },
            select: {
                id: true,
                name: true,
                status: true,
                storagePath: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { chunks: true, practiceQs: true } }
            }
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json({
            document: {
                id: document.id,
                name: document.name,
                status: document.status,
                createdAt: document.createdAt.toISOString(),
                updatedAt: document.updatedAt.toISOString(),
                chunkCount: document._count.chunks,
                practiceQuestionCount: document._count.practiceQs,
            }
        }, { status: 200 });
    } catch (error: any) {
        console.error("Get file error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const document = await prisma.document.findUnique({
            where: { id, userId: session.user.id },
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Delete chunks first (cascade should handle, but being explicit)
        await prisma.chunk.deleteMany({ where: { documentId: id } });

        // Delete practice questions
        await prisma.practiceQuestion.deleteMany({ where: { documentId: id } });

        // Delete the document record
        await prisma.document.delete({ where: { id } });

        // Delete the physical file
        try {
            const filePath = path.join(process.cwd(), 'public', document.storagePath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (fsError) {
            console.warn("Could not delete physical file:", fsError);
        }

        return NextResponse.json({ success: true, message: 'Document and associated data deleted' }, { status: 200 });
    } catch (error: any) {
        console.error("Delete file error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
