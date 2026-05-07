"use client";

import { useState, useEffect, use } from "react";
import { Loader2, Clock, ArrowRight, ArrowLeft, Trophy, Check, X, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface QuizQuestion {
    id: string;
    question: string;
    options: string;
    correctOption: number;
    explanation: string;
}

interface Quiz {
    id: string;
    title: string;
    timeLimit: number | null;
    questions: QuizQuestion[];
}

export default function ActiveQuizPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Quiz state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetch(`/api/quizzes/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.quiz) {
                    setQuiz(data.quiz);
                    if (data.quiz.timeLimit) setTimeLeft(data.quiz.timeLimit);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (timeLeft === null || isComplete) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isComplete]);

    const handleSelectOption = (optionIndex: number) => {
        if (isComplete) return;
        setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
    };

    const handleSubmit = async () => {
        if (!quiz || isComplete) return;
        setIsComplete(true);
        setSubmitting(true);

        const timeSpent = quiz.timeLimit ? quiz.timeLimit - (timeLeft || 0) : 0;
        let score = 0;
        quiz.questions.forEach((q, i) => {
            if (answers[i] === q.correctOption) score++;
        });

        try {
            await fetch(`/api/quizzes/${quiz.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score, timeSpent })
            });
        } catch (err) {
            console.error("Failed to submit score", err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !quiz) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neo-purple" /></div>;
    }

    const currentQuestion = quiz.questions[currentIndex];
    const options = JSON.parse(currentQuestion.options);
    const score = Object.keys(answers).filter(i => answers[parseInt(i)] === quiz.questions[parseInt(i)].correctOption).length;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (isComplete) {
        return (
            <div className="h-full p-6 max-w-3xl mx-auto flex flex-col items-center justify-center overflow-y-auto">
                <div className="neo-card w-full p-8 text-center mb-8 bg-neo-bg">
                    <div className="w-20 h-20 bg-neo-yellow flex items-center justify-center mx-auto mb-6 rounded-full" style={{ border: '4px solid #1a1a1a', boxShadow: '4px 4px 0px #1a1a1a' }}>
                        <Trophy className="w-10 h-10 text-neo-black" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Quiz Complete!</h1>
                    <div className="flex items-center justify-center gap-8 mb-8">
                        <div>
                            <p className="text-sm font-bold text-neo-black/60 uppercase tracking-widest mb-1">Score</p>
                            <p className="text-4xl font-black text-neo-purple">{score}<span className="text-2xl text-neo-black/40">/{quiz.questions.length}</span></p>
                        </div>
                        {quiz.timeLimit && (
                            <div>
                                <p className="text-sm font-bold text-neo-black/60 uppercase tracking-widest mb-1">Time</p>
                                <p className="text-2xl font-black font-mono mt-2">{formatTime(quiz.timeLimit - (timeLeft || 0))}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-center gap-4">
                        <Link href="/quiz" className="neo-btn neo-btn-white">
                            Back to Quizzes
                        </Link>
                        <button onClick={() => window.location.reload()} className="neo-btn neo-btn-blue">
                            <RotateCcw className="w-4 h-4" /> Retake
                        </button>
                    </div>
                </div>

                {/* Review Answers */}
                <div className="w-full space-y-6 pb-20">
                    <h2 className="text-2xl font-bold mb-4">Review Answers</h2>
                    {quiz.questions.map((q, i) => {
                        const isCorrect = answers[i] === q.correctOption;
                        const wasAnswered = answers[i] !== undefined;
                        const opts = JSON.parse(q.options);
                        
                        return (
                            <div key={q.id} className="neo-card p-6 relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-2 h-full ${!wasAnswered ? 'bg-neo-black/20' : isCorrect ? 'bg-neo-green' : 'bg-neo-coral'}`} />
                                <div className="flex gap-4 mb-4">
                                    <div className="w-8 h-8 shrink-0 flex items-center justify-center font-bold font-mono bg-neo-bg-dark" style={{ border: '2px solid #1a1a1a' }}>
                                        {i + 1}
                                    </div>
                                    <p className="font-medium text-lg leading-relaxed">{q.question}</p>
                                </div>
                                <div className="space-y-3 pl-12 mb-4">
                                    {opts.map((opt: string, optIdx: number) => {
                                        const isSelected = answers[i] === optIdx;
                                        const isActualCorrect = q.correctOption === optIdx;
                                        
                                        let bgClass = "bg-neo-bg";
                                        if (isActualCorrect) bgClass = "bg-neo-green text-neo-black border-[2px] border-neo-black shadow-[2px_2px_0px_#1a1a1a]";
                                        else if (isSelected && !isActualCorrect) bgClass = "bg-neo-coral text-white border-[2px] border-neo-black";

                                        return (
                                            <div key={optIdx} className={`p-3 text-sm font-medium transition-all ${bgClass} ${(!isActualCorrect && !isSelected) ? "opacity-50" : ""}`}>
                                                {opt}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="pl-12">
                                    <div className="p-4 bg-neo-yellow/20 text-sm font-medium" style={{ border: '2px solid #1a1a1a' }}>
                                        <strong className="block mb-1">Explanation:</strong>
                                        {q.explanation}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-neo-bg-dark">
            {/* Quiz Header */}
            <header className="h-16 px-6 flex items-center justify-between bg-neo-bg" style={{ borderBottom: '3px solid #1a1a1a' }}>
                <div className="flex items-center gap-4">
                    <Link href="/quiz" className="w-8 h-8 flex items-center justify-center hover:bg-neo-bg-dark transition-colors" style={{ border: '2px solid #1a1a1a' }}>
                        <X className="w-4 h-4" />
                    </Link>
                    <h1 className="font-bold truncate max-w-[200px] sm:max-w-md">{quiz.title}</h1>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="font-mono font-bold text-sm">
                        {currentIndex + 1} / {quiz.questions.length}
                    </div>
                    {timeLeft !== null && (
                        <div className={`flex items-center gap-2 font-mono font-bold px-3 py-1 ${timeLeft < 60 ? 'bg-neo-coral text-white' : 'bg-neo-yellow text-neo-black'}`} style={{ border: '2px solid #1a1a1a', boxShadow: '2px 2px 0px #1a1a1a' }}>
                            <Clock className="w-4 h-4" />
                            {formatTime(timeLeft)}
                        </div>
                    )}
                </div>
            </header>

            {/* Quiz Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
                <div className="w-full max-w-3xl">
                    <div className="neo-card p-8 mb-6 bg-neo-bg">
                        <h2 className="text-2xl font-bold mb-8 leading-relaxed">{currentQuestion.question}</h2>
                        
                        <div className="space-y-4">
                            {options.map((opt: string, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => handleSelectOption(i)}
                                    className={`w-full text-left p-4 font-medium transition-all focus:outline-none flex gap-4 ${answers[currentIndex] === i ? 'bg-neo-purple text-white' : 'bg-neo-bg hover:bg-neo-yellow/20'}`}
                                    style={{ border: '3px solid #1a1a1a', boxShadow: answers[currentIndex] === i ? '4px 4px 0px #1a1a1a' : '2px 2px 0px #1a1a1a' }}
                                >
                                    <div className={`w-6 h-6 shrink-0 flex items-center justify-center font-mono font-bold text-xs ${answers[currentIndex] === i ? 'bg-white text-neo-purple' : 'bg-neo-black text-white'}`}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => setCurrentIndex(prev => prev - 1)}
                            disabled={currentIndex === 0}
                            className="neo-btn neo-btn-white disabled:opacity-50"
                        >
                            <ArrowLeft className="w-4 h-4" /> Previous
                        </button>

                        {currentIndex === quiz.questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || Object.keys(answers).length < quiz.questions.length}
                                className="neo-btn neo-btn-green disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Submit Quiz
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentIndex(prev => prev + 1)}
                                className="neo-btn neo-btn-yellow"
                            >
                                Next <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
