import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/smartstudy';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting database seed...\n');

    // Create demo user
    const demoPassword = await bcrypt.hash('demo123', 10);
    
    const demoUser = await prisma.user.upsert({
        where: { email: 'demo@smartstudy.ai' },
        update: {},
        create: {
            id: 'demo_user_001',
            name: 'Demo Student',
            email: 'demo@smartstudy.ai',
            passwordHash: demoPassword,
            levelPref: 'intermediate',
        },
    });
    console.log('✅ Demo user created:', demoUser.email);

    // Create sample document
    const sampleDoc = await prisma.document.upsert({
        where: { id: 'demo_doc_001' },
        update: {},
        create: {
            id: 'demo_doc_001',
            userId: demoUser.id,
            name: 'Introduction to Machine Learning.pdf',
            status: 'ready',
            storagePath: '/uploads/demo/ml-intro.pdf',
        },
    });
    console.log('✅ Sample document created:', sampleDoc.name);

    // Create sample chunks for RAG
    const sampleChunks = [
        {
            id: 'chunk_001',
            documentId: sampleDoc.id,
            userId: demoUser.id,
            page: 1,
            chunkIndex: 0,
            content: 'Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed. The three main types of machine learning are supervised learning, unsupervised learning, and reinforcement learning.',
            embedding: JSON.stringify(Array(384).fill(0).map(() => Math.random() * 2 - 1)),
        },
        {
            id: 'chunk_002',
            documentId: sampleDoc.id,
            userId: demoUser.id,
            page: 1,
            chunkIndex: 1,
            content: 'Supervised learning involves training a model on labeled data, where the input data is paired with the correct output. Common algorithms include linear regression, logistic regression, decision trees, and neural networks.',
            embedding: JSON.stringify(Array(384).fill(0).map(() => Math.random() * 2 - 1)),
        },
        {
            id: 'chunk_003',
            documentId: sampleDoc.id,
            userId: demoUser.id,
            page: 2,
            chunkIndex: 2,
            content: 'Unsupervised learning finds patterns in unlabeled data. Clustering algorithms like K-means and hierarchical clustering group similar data points together. Dimensionality reduction techniques like PCA help visualize high-dimensional data.',
            embedding: JSON.stringify(Array(384).fill(0).map(() => Math.random() * 2 - 1)),
        },
        {
            id: 'chunk_004',
            documentId: sampleDoc.id,
            userId: demoUser.id,
            page: 3,
            chunkIndex: 3,
            content: 'Reinforcement learning is about training agents to make sequences of decisions by rewarding desired behaviors and punishing undesired ones. Applications include game playing, robotics, and autonomous vehicles.',
            embedding: JSON.stringify(Array(384).fill(0).map(() => Math.random() * 2 - 1)),
        },
    ];

    for (const chunk of sampleChunks) {
        await prisma.chunk.upsert({
            where: { id: chunk.id },
            update: {},
            create: chunk,
        });
    }
    console.log('✅ Sample chunks created:', sampleChunks.length);

    // Create sample practice questions
    const sampleQuestions = [
        {
            id: 'pq_001',
            userId: demoUser.id,
            documentId: sampleDoc.id,
            difficulty: 'beginner',
            question: 'What are the three main types of machine learning?',
            answer: 'Supervised learning, unsupervised learning, and reinforcement learning.',
            solutionSteps: '1. Recall the main categories of machine learning\n2. Supervised: learns from labeled data\n3. Unsupervised: finds patterns in unlabeled data\n4. Reinforcement: learns through rewards and penalties',
        },
        {
            id: 'pq_002',
            userId: demoUser.id,
            documentId: sampleDoc.id,
            difficulty: 'intermediate',
            question: 'Explain the difference between supervised and unsupervised learning.',
            answer: 'Supervised learning uses labeled data (input-output pairs) to train models, while unsupervised learning works with unlabeled data to discover hidden patterns and structures.',
            solutionSteps: '1. Supervised learning requires ground truth labels\n2. Examples: classification, regression\n3. Unsupervised learning finds structure without labels\n4. Examples: clustering, dimensionality reduction',
        },
        {
            id: 'pq_003',
            userId: demoUser.id,
            documentId: sampleDoc.id,
            difficulty: 'advanced',
            question: 'How does reinforcement learning differ from other ML types, and what are its key challenges?',
            answer: 'Reinforcement learning involves sequential decision-making through trial and error, using rewards/penalties. Key challenges include the credit assignment problem, exploration vs exploitation trade-off, and sample inefficiency.',
            solutionSteps: '1. RL is interactive and goal-oriented\n2. Agent learns from environment feedback\n3. Challenges: delayed rewards, large state spaces\n4. Applications: robotics, games, navigation',
        },
    ];

    for (const q of sampleQuestions) {
        await prisma.practiceQuestion.upsert({
            where: { id: q.id },
            update: {},
            create: q,
        });
    }
    console.log('✅ Sample practice questions created:', sampleQuestions.length);

    // Create sample study session
    const sampleSession = await prisma.studySession.upsert({
        where: { id: 'demo_session_001' },
        update: {},
        create: {
            id: 'demo_session_001',
            userId: demoUser.id,
            title: 'ML Fundamentals Review',
            turns: JSON.stringify([
                {
                    role: 'user',
                    content: 'What is machine learning?',
                    timestamp: new Date().toISOString(),
                },
                {
                    role: 'assistant',
                    content: 'Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed. [Source 1: "Introduction to Machine Learning.pdf", Page 1]',
                    timestamp: new Date().toISOString(),
                },
            ]),
        },
    });
    console.log('✅ Sample study session created:', sampleSession.title);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\nDemo credentials:');
    console.log('  Email: demo@smartstudy.ai');
    console.log('  Password: demo123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
