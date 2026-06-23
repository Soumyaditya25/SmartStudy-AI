import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import PDFParser from 'pdf2json';
import prisma from '@/lib/prisma';

// ---- Embedding via Google Gemini API (free, no model download) ----
async function getGeminiEmbeddings(texts: string[]): Promise<number[][]> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not set');

    const embeddings: number[][] = [];
    for (const text of texts) {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'models/text-embedding-004',
                    content: { parts: [{ text: text.slice(0, 2048) }] },
                }),
            }
        );
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Gemini embedding failed (${res.status}): ${err.slice(0, 200)}`);
        }
        const data = await res.json();
        embeddings.push(data.embedding?.values ?? []);
    }
    return embeddings;
}

// ---- Extract PDF text from a Buffer (no disk I/O needed) ----
async function extractPdfText(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on('pdfParser_dataError', (errData: any) => {
            reject(new Error(errData.parserError?.message || 'PDF parsing failed'));
        });

        pdfParser.on('pdfParser_dataReady', (pdfData) => {
            let text = '';
            if (pdfData.Pages) {
                for (const page of pdfData.Pages) {
                    if (page.Texts) {
                        for (const textItem of page.Texts) {
                            if (textItem.R) {
                                for (const r of textItem.R) {
                                    if (r.T) text += decodeURIComponent(r.T) + ' ';
                                }
                            }
                        }
                    }
                    text += '\n';
                }
            }
            resolve(text);
        });

        pdfParser.parseBuffer(buffer);
    });
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function chunkText(text: string, maxTokens: number = 400, overlap: number = 50): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let i = 0;
    while (i < words.length) {
        const chunk = words.slice(i, i + maxTokens).join(' ');
        if (chunk.trim()) chunks.push(chunk);
        i += maxTokens - overlap;
    }
    return chunks;
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File too large. Maximum size is 20MB.' }, { status: 400 });
        }

        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        const isTxt = file.type === 'text/plain' || file.name.endsWith('.txt');

        if (!isPdf && !isTxt) {
            return NextResponse.json(
                { error: 'Unsupported file type. Please upload PDF or TXT files.' },
                { status: 400 }
            );
        }

        // Read file into memory buffer — no disk I/O (Vercel is serverless/read-only FS)
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create Document record immediately
        const docRecord = await prisma.document.create({
            data: {
                userId: session.user.id,
                name: file.name,
                status: 'processing',
                storagePath: `memory:${file.name}`, // No persistent storage — content lives in DB chunks
            },
        });

        // Extract text
        let textContent = '';
        if (isPdf) {
            textContent = await extractPdfText(buffer);
        } else {
            textContent = buffer.toString('utf-8');
        }

        if (!textContent.trim()) {
            await prisma.document.update({ where: { id: docRecord.id }, data: { status: 'failed' } });
            return NextResponse.json({ error: 'No text could be extracted from the file' }, { status: 400 });
        }

        const chunks = chunkText(textContent, 400, 50);

        // Generate embeddings via Gemini API — no model download, instant, free
        let embeddings: number[][] = [];
        try {
            embeddings = await getGeminiEmbeddings(chunks);
            console.log(`Generated ${embeddings.length} Gemini embeddings`);
        } catch (embedError) {
            console.warn('Gemini embedding failed, storing empty embeddings (keyword search will still work):', embedError);
            embeddings = chunks.map(() => []);
        }

        const userId = session.user.id;
        const chunkRecords = chunks.map((chunk, index) => ({
            documentId: docRecord.id,
            userId,
            chunkIndex: index,
            content: chunk,
            embedding: JSON.stringify(embeddings[index] || []),
        }));

        await prisma.chunk.createMany({ data: chunkRecords });

        await prisma.document.update({ where: { id: docRecord.id }, data: { status: 'ready' } });

        return NextResponse.json(
            {
                success: true,
                documentId: docRecord.id,
                name: file.name,
                chunkCount: chunks.length,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Upload error:', error);
        // Best-effort: mark the latest processing doc as failed
        try {
            const session = await auth();
            if (session?.user?.id) {
                const docRecord = await prisma.document.findFirst({
                    where: { userId: session.user.id, status: 'processing' },
                    orderBy: { createdAt: 'desc' },
                });
                if (docRecord) {
                    await prisma.document.update({ where: { id: docRecord.id }, data: { status: 'failed' } });
                }
            }
        } catch (_) { /* ignore cleanup errors */ }

        return NextResponse.json({ error: error.message || 'Internal error during upload' }, { status: 500 });
    }
}
