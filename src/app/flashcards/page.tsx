"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
    Brain, 
    ChevronLeft, 
    ChevronRight, 
    RotateCcw, 
    ThumbsUp, 
    ThumbsDown,
    Clock,
    BookOpen,
    Zap,
    BarChart3,
    Sparkles,
    Loader2,
    Upload
} from "lucide-react";
import Link from "next/link";
import { ExportButton } from "@/components/ExportButton";

interface Flashcard {
    id: string;
    question: string;
    answer: string;
    solutionSteps: string[];
    difficulty: string;
    documentName: string;
    srs: {
        interval: number;
        repetitions: number;
        easeFactor: number;
        nextReview: string;
        lastReviewed: string | null;
    };
}

// SM-2 Spaced Repetition Algorithm
function calculateNextReview(
    quality: number, // 0-5 rating of how well user knew the answer
    repetitions: number,
    easeFactor: number,
    interval: number
): { interval: number; repetitions: number; easeFactor: number } {
    // quality: 0=complete blackout, 5=perfect response
    let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEaseFactor < 1.3) newEaseFactor = 1.3;

    let newInterval: number;
    let newRepetitions: number;

    if (quality < 3) {
        // Failed - reset repetitions
        newRepetitions = 0;
        newInterval = 1;
    } else {
        newRepetitions = repetitions + 1;
        if (newRepetitions === 1) {
            newInterval = 1;
        } else if (newRepetitions === 2) {
            newInterval = 6;
        } else {
            newInterval = Math.round(interval * newEaseFactor);
        }
    }

    return {
        interval: newInterval,
        repetitions: newRepetitions,
        easeFactor: newEaseFactor,
    };
}

export default function FlashcardsPage() {
    const { status } = useSession();
    const router = useRouter();
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sessionStats, setSessionStats] = useState({
        reviewed: 0,
        correct: 0,
        streak: 0,
    });
    const [showStats, setShowStats] = useState(false);
    const [documents, setDocuments] = useState<{id: string, name: string}[]>([]);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
            return;
        }
        if (status === "authenticated") {
            fetchFlashcards();
            fetchDocuments();
        }
    }, [status, router]);

    const fetchDocuments = async () => {
        try {
            const res = await fetch('/api/files');
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error);
        }
    };

    const generateQuestions = async () => {
        if (documents.length === 0) return;
        setGenerating(true);
        try {
            const doc = documents[0];
            const res = await fetch('/api/practice/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    documentId: doc.id, 
                    count: 10 
                }),
            });
            if (res.ok) {
                await fetchFlashcards();
            }
        } catch (error) {
            console.error("Failed to generate questions:", error);
        } finally {
            setGenerating(false);
        }
    };

    const fetchFlashcards = async () => {
        try {
            const res = await fetch("/api/flashcards?limit=20");
            if (res.ok) {
                const data = await res.json();
                setFlashcards(data.flashcards || []);
            }
        } catch (error) {
            console.error("Failed to fetch flashcards:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFlip = () => setIsFlipped(!isFlipped);

    const handleRating = useCallback((quality: number) => {
        const current = flashcards[currentIndex];
        if (!current) return;

        // Update SRS data
        const srsUpdate = calculateNextReview(
            quality,
            current.srs.repetitions,
            current.srs.easeFactor,
            current.srs.interval
        );

        // Update local state
        const updated = [...flashcards];
        updated[currentIndex] = {
            ...current,
            srs: {
                ...current.srs,
                ...srsUpdate,
                lastReviewed: new Date().toISOString(),
                nextReview: new Date(Date.now() + srsUpdate.interval * 24 * 60 * 60 * 1000).toISOString(),
            },
        };
        setFlashcards(updated);

        // Update session stats
        setSessionStats(prev => ({
            reviewed: prev.reviewed + 1,
            correct: prev.correct + (quality >= 3 ? 1 : 0),
            streak: quality >= 3 ? prev.streak + 1 : 0,
        }));

        // Move to next card
        setIsFlipped(false);
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setShowStats(true);
        }
    }, [flashcards, currentIndex]);

    const handleNext = () => {
        setIsFlipped(false);
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        setIsFlipped(false);
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setIsFlipped(false);
        setShowStats(false);
        setSessionStats({ reviewed: 0, correct: 0, streak: 0 });
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="neo-card p-8 text-center">
                    <Brain className="w-8 h-8 animate-pulse text-neo-purple mx-auto mb-4" />
                    <p className="font-bold">Loading flashcards...</p>
                </div>
            </div>
        );
    }

    if (flashcards.length === 0) {
        // No documents uploaded
        if (documents.length === 0) {
            return (
                <div className="min-h-screen pt-24 pb-12 px-4">
                    <div className="max-w-2xl mx-auto">
                        <div className="neo-card p-8 text-center">
                            <BookOpen className="w-16 h-16 mx-auto text-neo-purple mb-4" />
                            <h1 className="text-2xl font-bold mb-4">No Documents Uploaded</h1>
                            <p className="text-neo-black/70 mb-6">
                                Upload documents to generate flashcards.
                            </p>
                            <Link href="/dashboard" className="neo-btn neo-btn-purple">
                                <Upload className="w-4 h-4" />
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        // No questions generated yet
        return (
            <div className="min-h-screen pt-24 pb-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="neo-card p-8 text-center">
                        <BookOpen className="w-16 h-16 mx-auto text-neo-purple mb-4" />
                        <h1 className="text-2xl font-bold mb-4">No Flashcards Yet</h1>
                        <p className="text-neo-black/70 mb-6">
                            Generate practice questions from your documents to create flashcards.
                        </p>
                        <button 
                            onClick={generateQuestions} 
                            disabled={generating}
                            className="neo-btn neo-btn-purple"
                        >
                            {generating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            {generating ? "Generating..." : "Generate Flashcards"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showStats) {
        const accuracy = sessionStats.reviewed > 0 
            ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) 
            : 0;

        return (
            <div className="min-h-screen pt-24 pb-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="neo-card p-8 text-center">
                        <BarChart3 className="w-16 h-16 mx-auto text-neo-green mb-4" />
                        <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
                        <p className="text-neo-black/70 mb-8">Great job reviewing your flashcards</p>
                        
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-neo-bg-dark p-4 border-[3px] border-neo-black">
                                <div className="text-3xl font-bold text-neo-purple">{sessionStats.reviewed}</div>
                                <div className="text-xs uppercase tracking-wider">Reviewed</div>
                            </div>
                            <div className="bg-neo-bg-dark p-4 border-[3px] border-neo-black">
                                <div className="text-3xl font-bold text-neo-green">{accuracy}%</div>
                                <div className="text-xs uppercase tracking-wider">Accuracy</div>
                            </div>
                            <div className="bg-neo-bg-dark p-4 border-[3px] border-neo-black">
                                <div className="text-3xl font-bold text-neo-yellow">{sessionStats.streak}</div>
                                <div className="text-xs uppercase tracking-wider">Best Streak</div>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center flex-wrap">
                            <ExportButton 
                                data={{
                                    type: "flashcards",
                                    flashcards: flashcards.slice(0, sessionStats.reviewed),
                                }}
                            />
                            <button onClick={handleRestart} className="neo-btn neo-btn-blue">
                                <RotateCcw className="w-4 h-4" />
                                Review Again
                            </button>
                            <Link href="/dashboard" className="neo-btn neo-btn-white">
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const current = flashcards[currentIndex];
    const progress = ((currentIndex + 1) / flashcards.length) * 100;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Zap className="w-6 h-6 text-neo-yellow" />
                            Flashcards
                        </h1>
                        <p className="text-sm text-neo-black/60">
                            {current.documentName} • {current.difficulty}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm font-bold">{currentIndex + 1} / {flashcards.length}</div>
                            <div className="text-xs text-neo-black/60">Card</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold">{sessionStats.streak}</div>
                            <div className="text-xs text-neo-black/60">Streak</div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-neo-bg-dark border-[2px] border-neo-black mb-8">
                    <div 
                        className="h-full bg-neo-purple transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Flashcard */}
                <div className="relative h-96 mb-8" style={{ perspective: "1000px" }}>
                    <div
                        onClick={handleFlip}
                        className={`
                            relative w-full h-full cursor-pointer transition-transform duration-500
                            ${isFlipped ? "[transform:rotateY(180deg)]" : ""}
                        `}
                        style={{ transformStyle: "preserve-3d" }}
                    >
                        {/* Front - Question */}
                        <div 
                            className="absolute inset-0 neo-card flex flex-col items-center justify-center p-8 text-center"
                            style={{ backfaceVisibility: "hidden" }}
                        >
                            <div className="text-xs uppercase tracking-wider text-neo-purple mb-4">
                                Question
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold leading-relaxed">
                                {current.question}
                            </h2>
                            <div className="mt-8 text-sm text-neo-black/60">
                                Click to reveal answer
                            </div>
                        </div>

                        {/* Back - Answer */}
                        <div 
                            className="absolute inset-0 neo-card flex flex-col p-8 overflow-auto"
                            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        >
                            <div className="text-xs uppercase tracking-wider text-neo-green mb-4">
                                Answer
                            </div>
                            <div className="text-lg leading-relaxed mb-6">
                                {current.answer}
                            </div>
                            {current.solutionSteps.length > 0 && (
                                <div className="mt-auto">
                                    <div className="text-xs uppercase tracking-wider text-neo-blue mb-2">
                                        Solution Steps
                                    </div>
                                    <ol className="list-decimal list-inside text-sm space-y-1 text-neo-black/80">
                                        {current.solutionSteps.map((step, i) => (
                                            <li key={i}>{step}</li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rating Buttons (shown after flip) */}
                {isFlipped ? (
                    <div className="grid grid-cols-4 gap-3 mb-6">
                        <button
                            onClick={() => handleRating(1)}
                            className="neo-btn neo-btn-coral text-xs py-3"
                        >
                            <ThumbsDown className="w-4 h-4" />
                            Again
                        </button>
                        <button
                            onClick={() => handleRating(3)}
                            className="neo-btn neo-btn-yellow text-xs py-3"
                        >
                            <Clock className="w-4 h-4" />
                            Hard
                        </button>
                        <button
                            onClick={() => handleRating(4)}
                            className="neo-btn neo-btn-blue text-xs py-3"
                        >
                            <ThumbsUp className="w-4 h-4" />
                            Good
                        </button>
                        <button
                            onClick={() => handleRating(5)}
                            className="neo-btn neo-btn-green text-xs py-3"
                        >
                            <Zap className="w-4 h-4" />
                            Easy
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-center mb-6">
                        <button
                            onClick={handleFlip}
                            className="neo-btn neo-btn-purple"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Flip Card
                        </button>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="neo-btn neo-btn-white text-xs disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>
                    
                    <Link href="/dashboard" className="text-sm text-neo-black/60 hover:text-neo-black">
                        Exit Review
                    </Link>

                    <button
                        onClick={handleNext}
                        disabled={currentIndex === flashcards.length - 1}
                        className="neo-btn neo-btn-white text-xs disabled:opacity-50"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
