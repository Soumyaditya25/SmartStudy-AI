"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
    Trophy, 
    Timer, 
    ChevronRight, 
    RotateCcw,
    CheckCircle,
    XCircle,
    BarChart3,
    Target,
    Zap,
    AlertCircle,
    Brain,
    BookOpen,
    Upload
} from "lucide-react";
import Link from "next/link";
import { ExportButton } from "@/components/ExportButton";

interface QuizQuestion {
    id: string;
    question: string;
    answer: string;
    solutionSteps: string[];
    difficulty: string;
    documentName: string;
    options: string[];
}

interface QuizResult {
    questionId: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
}

const TIME_PER_QUESTION = 60; // seconds

export default function QuizPage() {
    const { status } = useSession();
    const router = useRouter();
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
    const [loading, setLoading] = useState(true);
    const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
    const [quizState, setQuizState] = useState<"idle" | "running" | "finished">("idle");
    const [quizConfig, setQuizConfig] = useState({
        questionCount: 10,
        difficulty: "mixed", // beginner, intermediate, advanced, mixed
        timePerQuestion: TIME_PER_QUESTION,
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
            return;
        }
    }, [status, router]);

    useEffect(() => {
        if (quizState === "running" && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else if (quizState === "running" && timeLeft === 0) {
            handleTimeUp();
        }
    }, [quizState, timeLeft]);

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`/api/flashcards?limit=${quizConfig.questionCount}`);
            if (res.ok) {
                const data = await res.json();
                // Generate multiple choice options for each question
                const quizQuestions = data.flashcards.map((q: QuizQuestion) => {
                    const options = generateOptions(q.answer, data.flashcards);
                    return { ...q, options };
                });
                setQuestions(quizQuestions);
            } else {
                console.error("Failed to fetch questions:", res.status);
                setQuestions([]);
            }
        } catch (error) {
            console.error("Failed to fetch questions:", error);
            setQuestions([]);
        }
    };

    // Initial load to check if questions exist
    useEffect(() => {
        if (status === "authenticated") {
            fetch(`/api/flashcards?limit=1`)
                .then(res => res.ok ? res.json() : { flashcards: [] })
                .then(data => {
                    if (!data.flashcards || data.flashcards.length === 0) {
                        setQuestions([]);
                    }
                })
                .catch(() => setQuestions([]))
                .finally(() => setLoading(false));
        }
    }, [status]);

    const generateOptions = (correctAnswer: string, allQuestions: QuizQuestion[]): string[] => {
        const options = [correctAnswer];
        const wrongAnswers = allQuestions
            .filter(q => q.answer !== correctAnswer)
            .map(q => q.answer)
            .slice(0, 3);
        options.push(...wrongAnswers);
        // Shuffle
        return options.sort(() => Math.random() - 0.5);
    };

    const startQuiz = async () => {
        setQuizState("running");
        setCurrentIndex(0);
        setQuizResults([]);
        setTimeLeft(quizConfig.timePerQuestion);
        setLoading(true);
        await fetchQuestions();
        // Small delay to ensure state updates
        setTimeout(() => setLoading(false), 100);
    };

    const handleAnswerSelect = (answer: string) => {
        if (showResult) return;
        setSelectedAnswer(answer);
    };

    const handleSubmit = () => {
        if (!selectedAnswer) return;

        const current = questions[currentIndex];
        const isCorrect = selectedAnswer === current.answer;
        const timeSpent = quizConfig.timePerQuestion - timeLeft;

        setQuizResults(prev => [...prev, {
            questionId: current.id,
            userAnswer: selectedAnswer,
            correctAnswer: current.answer,
            isCorrect,
            timeSpent,
        }]);

        setShowResult(true);
    };

    const handleTimeUp = () => {
        const current = questions[currentIndex];
        setQuizResults(prev => [...prev, {
            questionId: current.id,
            userAnswer: "Time's up!",
            correctAnswer: current.answer,
            isCorrect: false,
            timeSpent: quizConfig.timePerQuestion,
        }]);
        setShowResult(true);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setShowResult(false);
            setTimeLeft(quizConfig.timePerQuestion);
        } else {
            setQuizState("finished");
        }
    };

    const handleRestart = () => {
        setQuizState("idle");
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setQuizResults([]);
        setTimeLeft(quizConfig.timePerQuestion);
    };

    // Calculate stats
    const correctCount = quizResults.filter(r => r.isCorrect).length;
    const totalTime = quizResults.reduce((sum, r) => sum + r.timeSpent, 0);
    const avgTime = quizResults.length > 0 ? Math.round(totalTime / quizResults.length) : 0;
    const accuracy = quizResults.length > 0 ? Math.round((correctCount / quizResults.length) * 100) : 0;

    // Difficulty-based score multiplier
    const getDifficultyMultiplier = (diff: string) => {
        switch (diff) {
            case "beginner": return 1;
            case "intermediate": return 1.5;
            case "advanced": return 2;
            default: return 1;
        }
    };

    const totalScore = quizResults.reduce((score, result, idx) => {
        if (!result.isCorrect) return score;
        const question = questions[idx];
        const basePoints = 100;
        const timeBonus = Math.max(0, quizConfig.timePerQuestion - result.timeSpent);
        const difficultyMult = getDifficultyMultiplier(question?.difficulty || "beginner");
        return score + Math.round((basePoints + timeBonus) * difficultyMult);
    }, 0);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="neo-card p-8 text-center">
                    <Brain className="w-12 h-12 animate-pulse text-neo-purple mx-auto mb-4" />
                    <p className="font-bold">Loading Quiz...</p>
                </div>
            </div>
        );
    }

    // No questions available state
    if (quizState === "running" && questions.length === 0) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="neo-card p-8 text-center">
                        <BookOpen className="w-16 h-16 mx-auto text-neo-purple mb-4" />
                        <h1 className="text-2xl font-bold mb-4">No Questions Available</h1>
                        <p className="text-neo-black/70 mb-2">
                            You need to generate practice questions first.
                        </p>
                        <p className="text-sm text-neo-black/50 mb-6">
                            1. Go to Dashboard → Click "Study" on a document<br/>
                            2. Click "Practice" button to generate questions<br/>
                            3. Then return here to take the quiz
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/dashboard" className="neo-btn neo-btn-purple">
                                <Upload className="w-4 h-4" />
                                Go to Dashboard
                            </Link>
                            <button onClick={() => setQuizState("idle")} className="neo-btn neo-btn-white">
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (quizState === "idle") {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="neo-card p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-neo-purple flex items-center justify-center"
                                style={{ border: '3px solid #1a1a1a', boxShadow: '3px 3px 0px #1a1a1a' }}
                            >
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Quiz Mode</h1>
                                <p className="text-neo-black/60 text-sm">Test your knowledge with timed questions</p>
                            </div>
                        </div>

                        <div className="space-y-6 mb-8">
                            <div>
                                <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Questions</label>
                                <div className="flex gap-2">
                                    {[5, 10, 15, 20].map(count => (
                                        <button
                                            key={count}
                                            onClick={() => setQuizConfig(prev => ({ ...prev, questionCount: count }))}
                                            className={`neo-btn text-xs py-2 px-4 ${
                                                quizConfig.questionCount === count ? 'neo-btn-purple' : 'neo-btn-white'
                                            }`}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Time Per Question</label>
                                <div className="flex gap-2">
                                    {[30, 60, 90, 120].map(sec => (
                                        <button
                                            key={sec}
                                            onClick={() => setQuizConfig(prev => ({ ...prev, timePerQuestion: sec }))}
                                            className={`neo-btn text-xs py-2 px-4 ${
                                                quizConfig.timePerQuestion === sec ? 'neo-btn-blue' : 'neo-btn-white'
                                            }`}
                                        >
                                            {sec}s
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={startQuiz}
                            className="neo-btn neo-btn-green w-full justify-center text-lg"
                        >
                            <Zap className="w-5 h-5" />
                            Start Quiz
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (quizState === "finished") {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="neo-card p-8 text-center">
                        <div className="w-20 h-20 bg-neo-yellow flex items-center justify-center mx-auto mb-6"
                            style={{ border: '3px solid #1a1a1a', boxShadow: '4px 4px 0px #1a1a1a' }}
                        >
                            <Trophy className="w-10 h-10 text-neo-black" />
                        </div>
                        
                        <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
                        <p className="text-neo-black/60 mb-8">Here&apos;s how you performed</p>

                        <div className="text-5xl font-bold text-neo-purple mb-8">
                            {totalScore.toLocaleString()}
                            <span className="text-lg text-neo-black/60 font-normal ml-2">points</span>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-8">
                            <div className="bg-neo-bg-dark p-4 border-[3px] border-neo-black">
                                <div className="text-2xl font-bold text-neo-green">{correctCount}/{quizResults.length}</div>
                                <div className="text-xs uppercase tracking-wider">Correct</div>
                            </div>
                            <div className="bg-neo-bg-dark p-4 border-[3px] border-neo-black">
                                <div className="text-2xl font-bold text-neo-blue">{accuracy}%</div>
                                <div className="text-xs uppercase tracking-wider">Accuracy</div>
                            </div>
                            <div className="bg-neo-bg-dark p-4 border-[3px] border-neo-black">
                                <div className="text-2xl font-bold text-neo-yellow">{avgTime}s</div>
                                <div className="text-xs uppercase tracking-wider">Avg Time</div>
                            </div>
                            <div className="bg-neo-bg-dark p-4 border-[3px] border-neo-black">
                                <div className="text-2xl font-bold text-neo-purple">{totalTime}s</div>
                                <div className="text-xs uppercase tracking-wider">Total Time</div>
                            </div>
                        </div>

                        {/* Question Review */}
                        <div className="text-left mb-8">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Question Review
                            </h3>
                            <div className="space-y-3">
                                {quizResults.map((result, idx) => (
                                    <div 
                                        key={result.questionId}
                                        className={`p-4 border-[3px] ${result.isCorrect ? 'border-neo-green bg-neo-green/10' : 'border-neo-coral bg-neo-coral/10'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                {result.isCorrect ? (
                                                    <CheckCircle className="w-5 h-5 text-neo-green" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-neo-coral" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm mb-1">Q{idx + 1}: {questions[idx]?.question}</p>
                                                {!result.isCorrect && (
                                                    <p className="text-sm text-neo-coral">
                                                        Your answer: {result.userAnswer}
                                                    </p>
                                                )}
                                                <p className="text-sm text-neo-green">
                                                    Correct: {result.correctAnswer}
                                                </p>
                                                <p className="text-xs text-neo-black/60 mt-1">
                                                    Time: {result.timeSpent}s
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center flex-wrap">
                            <ExportButton 
                                data={{
                                    type: "quiz",
                                    quizResults,
                                }}
                            />
                            <button onClick={handleRestart} className="neo-btn neo-btn-blue">
                                <RotateCcw className="w-4 h-4" />
                                Try Again
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

    // Quiz Running State
    const current = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const timerColor = timeLeft > 10 ? 'bg-neo-green' : timeLeft > 5 ? 'bg-neo-yellow' : 'bg-neo-coral';

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Target className="w-6 h-6 text-neo-purple" />
                            Quiz
                        </h1>
                        <p className="text-sm text-neo-black/60">
                            Question {currentIndex + 1} of {questions.length}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Timer */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-neo-bg-dark border-[3px] border-neo-black">
                            <Timer className={`w-5 h-5 ${timeLeft <= 5 ? 'text-neo-coral animate-pulse' : ''}`} />
                            <span className={`font-mono font-bold text-lg ${timeLeft <= 5 ? 'text-neo-coral' : ''}`}>
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-neo-bg-dark border-[3px] border-neo-black mb-8">
                    <div 
                        className="h-full bg-neo-purple transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Timer Progress */}
                <div className="w-full h-1 bg-neo-bg-dark mb-8">
                    <div 
                        className={`h-full ${timerColor} transition-all duration-1000`}
                        style={{ width: `${(timeLeft / quizConfig.timePerQuestion) * 100}%` }}
                    />
                </div>

                {/* Question Card */}
                <div className="neo-card p-8 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className={`neo-badge ${
                            current?.difficulty === 'beginner' ? 'neo-badge-green' :
                            current?.difficulty === 'intermediate' ? 'neo-badge-yellow' :
                            'neo-badge-coral'
                        } text-[10px]`}>
                            {current?.difficulty}
                        </span>
                        <span className="text-xs text-neo-black/60">
                            {current?.documentName}
                        </span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold mb-8 leading-relaxed">
                        {current?.question}
                    </h2>

                    {/* Options */}
                    <div className="space-y-3">
                        {current?.options.map((option, idx) => {
                            const isSelected = selectedAnswer === option;
                            const isCorrect = showResult && option === current.answer;
                            const isWrong = showResult && isSelected && option !== current.answer;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswerSelect(option)}
                                    disabled={showResult}
                                    className={`
                                        w-full p-4 text-left border-[3px] transition-all
                                        ${isWrong ? 'border-neo-coral bg-neo-coral/10' : ''}
                                        ${isCorrect ? 'border-neo-green bg-neo-green/10' : ''}
                                        ${isSelected && !showResult ? 'border-neo-purple bg-neo-purple/10' : ''}
                                        ${!isSelected && !showResult ? 'border-neo-black hover:bg-neo-bg-dark' : ''}
                                        ${showResult && !isCorrect && !isWrong ? 'border-neo-black/30 opacity-50' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-6 h-6 border-[3px] flex items-center justify-center
                                            ${isSelected ? 'border-neo-purple bg-neo-purple' : 'border-neo-black'}
                                        `}>
                                            {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className="font-medium">{option}</span>
                                        {isCorrect && <CheckCircle className="w-5 h-5 text-neo-green ml-auto" />}
                                        {isWrong && <XCircle className="w-5 h-5 text-neo-coral ml-auto" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Time Warning */}
                    {timeLeft <= 5 && !showResult && (
                        <div className="mt-6 flex items-center gap-2 text-neo-coral animate-pulse">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-bold">Hurry up! Time running out!</span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                    <Link href="/dashboard" className="neo-btn neo-btn-white text-xs">
                        Exit Quiz
                    </Link>

                    {!showResult ? (
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedAnswer}
                            className="neo-btn neo-btn-purple disabled:opacity-50"
                        >
                            Submit Answer
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="neo-btn neo-btn-green"
                        >
                            {currentIndex < questions.length - 1 ? (
                                <>
                                    Next Question
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Finish Quiz
                                    <Trophy className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
