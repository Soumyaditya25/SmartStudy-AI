"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Brain, Check, X, RotateCcw } from "lucide-react";
import Link from "next/link";

interface Flashcard {
    id: string;
    front: string;
    back: string;
    nextReview: string;
}

export default function FlashcardsPage() {
    const [documents, setDocuments] = useState<{ id: string; name: string }[]>([]);
    const [selectedDocId, setSelectedDocId] = useState("");
    const [dueCards, setDueCards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    
    // Study session state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);

    useEffect(() => {
        fetch("/api/files")
            .then(res => res.json())
            .then(data => {
                if (data.documents) {
                    setDocuments(data.documents.filter((d: any) => d.status === 'ready'));
                }
            })
            .catch(console.error);
    }, []);

    const fetchDueCards = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/flashcards?docId=${selectedDocId}`);
            if (res.ok) {
                const data = await res.json();
                setDueCards(data.flashcards || []);
                setCurrentIndex(0);
                setIsFlipped(false);
                setSessionComplete(data.flashcards?.length === 0);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDueCards();
    }, [selectedDocId]);

    const handleGenerate = async () => {
        if (!selectedDocId) return alert("Select a document first to generate flashcards.");
        setGenerating(true);
        try {
            const res = await fetch("/api/flashcards/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId: selectedDocId, count: 5 }),
            });
            if (res.ok) {
                fetchDueCards();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to generate flashcards");
            }
        } catch (err) {
            alert("Something went wrong");
        } finally {
            setGenerating(false);
        }
    };

    const handleReview = async (quality: number) => {
        const cardId = dueCards[currentIndex].id;
        
        // Move to next card in UI immediately
        if (currentIndex < dueCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        } else {
            setSessionComplete(true);
        }

        // Send review to backend in background
        try {
            await fetch(`/api/flashcards/${cardId}/review`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quality })
            });
        } catch (err) {
            console.error("Failed to submit review", err);
        }
    };

    if (loading && documents.length === 0) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neo-purple" /></div>;
    }

    const currentCard = dueCards[currentIndex];

    return (
        <div className="h-full p-6 max-w-4xl mx-auto flex flex-col">
            <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Flashcards</h1>
                    <p className="text-neo-black/60 font-medium">Spaced repetition for long-term memory</p>
                </div>
                
                <div className="flex gap-3">
                    <select
                        value={selectedDocId}
                        onChange={(e) => setSelectedDocId(e.target.value)}
                        className="neo-input py-2 px-3 text-sm font-bold w-48"
                    >
                        <option value="">All Documents</option>
                        {documents.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.name}</option>
                        ))}
                    </select>
                    
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !selectedDocId}
                        className="neo-btn neo-btn-yellow"
                    >
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                        Generate More
                    </button>
                </div>
            </header>

            {!loading && sessionComplete ? (
                <div className="flex-1 flex flex-col items-center justify-center neo-card bg-neo-green/10">
                    <div className="w-16 h-16 bg-neo-green flex items-center justify-center mb-4" style={{ border: '3px solid #1a1a1a', boxShadow: '4px 4px 0px #1a1a1a' }}>
                        <Check className="w-8 h-8 text-neo-black" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">You&apos;re all caught up!</h2>
                    <p className="text-neo-black/70 mb-6 font-medium">No more due flashcards for {selectedDocId ? 'this document' : 'any documents'}.</p>
                    <button onClick={fetchDueCards} className="neo-btn neo-btn-white">
                        <RotateCcw className="w-4 h-4" /> Check Again
                    </button>
                </div>
            ) : !loading && currentCard ? (
                <div className="flex-1 flex flex-col items-center max-w-2xl mx-auto w-full">
                    <div className="w-full mb-4 flex justify-between font-bold text-sm tracking-wider font-mono">
                        <span>Card {currentIndex + 1} of {dueCards.length}</span>
                    </div>

                    <div 
                        className="w-full aspect-[4/3] sm:aspect-video relative perspective-1000 cursor-pointer group"
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <motion.div
                            className="w-full h-full preserve-3d relative"
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
                        >
                            {/* Front */}
                            <div className="absolute inset-0 backface-hidden neo-card bg-neo-bg flex items-center justify-center p-8 text-center"
                                style={{ border: '4px solid #1a1a1a', boxShadow: '8px 8px 0px #1a1a1a' }}
                            >
                                <h3 className="text-2xl sm:text-3xl font-bold">{currentCard.front}</h3>
                                <div className="absolute bottom-4 left-0 w-full text-center text-xs font-bold text-neo-black/30 tracking-widest uppercase">
                                    Click to flip
                                </div>
                            </div>

                            {/* Back */}
                            <div className="absolute inset-0 backface-hidden neo-card bg-neo-yellow/30 flex items-center justify-center p-8 text-center"
                                style={{ border: '4px solid #1a1a1a', boxShadow: '8px 8px 0px #1a1a1a', transform: "rotateY(180deg)" }}
                            >
                                <p className="text-xl sm:text-2xl font-medium leading-relaxed">{currentCard.back}</p>
                            </div>
                        </motion.div>
                    </div>

                    <AnimatePresence>
                        {isFlipped && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full"
                            >
                                <button onClick={() => handleReview(1)} className="neo-btn bg-neo-coral hover:bg-red-500 text-white flex-col gap-1 py-3">
                                    <span className="font-bold">Again</span>
                                    <span className="text-[10px] opacity-80">Forgot</span>
                                </button>
                                <button onClick={() => handleReview(3)} className="neo-btn bg-orange-400 hover:bg-orange-500 text-white flex-col gap-1 py-3">
                                    <span className="font-bold">Hard</span>
                                    <span className="text-[10px] opacity-80">Recalled with effort</span>
                                </button>
                                <button onClick={() => handleReview(4)} className="neo-btn bg-neo-green hover:bg-green-500 text-neo-black flex-col gap-1 py-3">
                                    <span className="font-bold">Good</span>
                                    <span className="text-[10px] opacity-80">Recalled easily</span>
                                </button>
                                <button onClick={() => handleReview(5)} className="neo-btn bg-neo-blue hover:bg-blue-500 text-neo-black flex-col gap-1 py-3">
                                    <span className="font-bold">Easy</span>
                                    <span className="text-[10px] opacity-80">Perfect recall</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : null}
        </div>
    );
}
