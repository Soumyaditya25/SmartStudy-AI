"use client";

import { useState, useEffect } from "react";
import { Loader2, Brain, Check, Clock, Plus, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface QuizAttempt {
    id: string;
    score: number;
    timeSpent: number;
    createdAt: string;
}

interface Quiz {
    id: string;
    title: string;
    timeLimit: number | null;
    createdAt: string;
    document: { name: string };
    _count: { questions: number };
    attempts: QuizAttempt[];
}

export default function QuizzesDashboard() {
    const router = useRouter();
    const [documents, setDocuments] = useState<{ id: string; name: string }[]>([]);
    const [selectedDocId, setSelectedDocId] = useState("");
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        // Fetch documents
        fetch("/api/files")
            .then(res => res.json())
            .then(data => {
                if (data.documents) {
                    setDocuments(data.documents.filter((d: any) => d.status === 'ready'));
                }
            })
            .catch(console.error);

        // Fetch quizzes
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/quizzes");
            if (res.ok) {
                const data = await res.json();
                setQuizzes(data.quizzes || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedDocId) return alert("Select a document first to generate a quiz.");
        setGenerating(true);
        try {
            const res = await fetch("/api/quizzes/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId: selectedDocId, count: 5, timeLimit: 300 }), // 5 mins
            });
            if (res.ok) {
                const data = await res.json();
                router.push(`/quiz/${data.quiz.id}`);
            } else {
                const err = await res.json();
                alert(err.error || "Failed to generate quiz");
                setGenerating(false);
            }
        } catch (err) {
            alert("Something went wrong");
            setGenerating(false);
        }
    };

    if (loading && documents.length === 0) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neo-purple" /></div>;
    }

    return (
        <div className="h-full p-6 max-w-5xl mx-auto flex flex-col overflow-y-auto">
            <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Quizzes</h1>
                    <p className="text-neo-black/60 font-medium">Test your knowledge with timed challenges</p>
                </div>
                
                <div className="flex gap-3">
                    <select
                        value={selectedDocId}
                        onChange={(e) => setSelectedDocId(e.target.value)}
                        className="neo-input py-2 px-3 text-sm font-bold w-48"
                    >
                        <option value="">Select Document...</option>
                        {documents.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.name}</option>
                        ))}
                    </select>
                    
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !selectedDocId}
                        className="neo-btn neo-btn-yellow whitespace-nowrap"
                    >
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Generate Quiz
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.length === 0 && !loading && (
                    <div className="col-span-full neo-card bg-neo-bg p-8 text-center border-dashed">
                        <Brain className="w-12 h-12 text-neo-black/20 mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">No quizzes yet</h3>
                        <p className="text-neo-black/60 font-medium mb-4">Select a document above and generate your first quiz!</p>
                    </div>
                )}

                {quizzes.map(quiz => {
                    const lastAttempt = quiz.attempts[0];
                    return (
                        <div key={quiz.id} className="neo-card p-5 flex flex-col hover:-translate-y-1 transition-transform">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg leading-tight line-clamp-2" title={quiz.title}>
                                    {quiz.title}
                                </h3>
                                {lastAttempt && (
                                    <div className="bg-neo-green/20 px-2 py-1 flex items-center gap-1 font-mono text-xs font-bold" style={{ border: '2px solid #1a1a1a' }}>
                                        <Trophy className="w-3 h-3 text-neo-green" />
                                        {Math.round((lastAttempt.score / quiz._count.questions) * 100)}%
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col gap-2 mb-6 text-sm font-medium text-neo-black/70">
                                <div className="flex items-center gap-2">
                                    <Brain className="w-4 h-4" />
                                    <span className="truncate">{quiz.document.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    <span>{quiz._count.questions} questions</span>
                                </div>
                                {quiz.timeLimit && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span>{Math.floor(quiz.timeLimit / 60)} mins limit</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-auto">
                                <Link href={`/quiz/${quiz.id}`} className="neo-btn neo-btn-white w-full text-center block">
                                    {lastAttempt ? "Retake Quiz" : "Start Quiz"}
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
