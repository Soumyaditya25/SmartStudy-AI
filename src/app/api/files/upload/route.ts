import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import fs from 'fs';
import path from 'path';
import PDFParser from 'pdf2json';
import prisma from '@/lib/prisma';

// Local embedding model - dynamic import to avoid bundler issues
let embeddingPipeline: any = null;

async function getLocalEmbeddings(texts: string[]): Promise<number[][]> {
    try {
        if (!embeddingPipeline) {
            const { pipeline } = await import('@xenova/transformers');
            embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }
        
        const embeddings: number[][] = [];
        for (const text of texts) {
            const result = await embeddingPipeline(text, { pooling: 'mean', normalize: true });
            embeddings.push(Array.from(result.data));
        }
        return embeddings;
    } catch (error) {
        console.warn('Local embedding generation failed:', error);
        throw error;
    }
}

// Helper to extract text from PDF using pdf2json
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
                                    if (r.T) {
                                        // Decode URI-encoded text
                                        text += decodeURIComponent(r.T) + ' ';
                                    }
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

const ALLOWED_TYPES = [
    'application/pdf',
    'text/plain',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Helper to chunk text
function chunkText(text: string, maxTokens: number = 500, overlap: number = 100): string[] {
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

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File too large. Maximum size is 20MB.' }, { status: 400 });
        }

        // Validate file type
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        const isTxt = file.type === 'text/plain' || file.name.endsWith('.txt');

        if (!isPdf && !isTxt) {
            return NextResponse.json({ error: 'Unsupported file type. Please upload PDF or TXT files.' }, { status: 400 });
        }

        // 1. Save file locally
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
        const filePath = path.join(uploadDir, fileName);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        fs.writeFileSync(filePath, buffer);

        // 2. Create Document record
        const docRecord = await prisma.document.create({
            data: {
                userId: session.user.id,
                name: file.name,
                status: 'processing',
                storagePath: `/uploads/${fileName}`,
            }
        });

        // 3. Process Text
        let textContent = '';
        if (isPdf) {
            textContent = await extractPdfText(buffer);
        } else {
            textContent = buffer.toString('utf-8');
        }

        // 4. Chunk & Embed
        if (!textContent.trim()) {
            await prisma.document.update({ where: { id: docRecord.id }, data: { status: 'failed' } });
            return NextResponse.json({ error: 'No text could be extracted from the file' }, { status: 400 });
        }

        const chunks = chunkText(textContent, 400, 50);

        // Get LOCAL embeddings (no API needed)
        let embeddings: number[][] = [];
        
        try {
            embeddings = await getLocalEmbeddings(chunks);
            console.log(`Generated ${embeddings.length} embeddings locally`);
        } catch (embedError) {
            console.warn("Local embedding failed, storing without embeddings:", embedError);
            embeddings = chunks.map(() => []);
        }

        const userId = session.user.id;

        // 5. Store chunks in SQLite
        const chunkRecords = chunks.map((chunk, index) => ({
            documentId: docRecord.id,
            userId: userId,
            chunkIndex: index,
            content: chunk,
            embedding: JSON.stringify(embeddings[index] || []),
        }));

        await prisma.chunk.createMany({
            data: chunkRecords,
        });

        // Mark as ready (even if embeddings failed, we can still do keyword search)
        await prisma.document.update({ where: { id: docRecord.id }, data: { status: 'ready' } });

        return NextResponse.json({
            success: true,
            documentId: docRecord.id,
            name: file.name,
            chunkCount: chunks.length,
        }, { status: 201 });

    } catch (error: any) {
        console.error("Upload error:", error);
        // Mark document as failed if we have a docRecord
        try {
            const docRecord = (await prisma.document.findFirst({ 
                where: { userId: (await auth())?.user?.id }, 
                orderBy: { createdAt: 'desc' }
            }));
            if (docRecord && docRecord.status === 'processing') {
                await prisma.document.update({ 
                    where: { id: docRecord.id }, 
                    data: { status: 'failed' } 
                });
            }
        } catch (e) {
            // Ignore cleanup errors
        }
        return NextResponse.json({ error: error.message || 'Internal error during upload' }, { status: 500 });
    }
}
