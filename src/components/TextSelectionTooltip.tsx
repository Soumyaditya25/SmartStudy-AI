"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface TooltipPosition {
    x: number;
    y: number;
}

export function TextSelectionTooltip() {
    const [selectedText, setSelectedText] = useState("");
    const [position, setPosition] = useState<TooltipPosition | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [explanation, setExplanation] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSelection = useCallback(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (text && text.length > 3 && text.length < 500) {
            const range = selection?.getRangeAt(0);
            const rect = range?.getBoundingClientRect();

            if (rect) {
                setSelectedText(text);
                setPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10,
                });
            }
        } else {
            if (!showExplanation) {
                setPosition(null);
            }
        }
    }, [showExplanation]);

    useEffect(() => {
        document.addEventListener("selectionchange", handleSelection);
        document.addEventListener("mouseup", handleSelection);

        return () => {
            document.removeEventListener("selectionchange", handleSelection);
            document.removeEventListener("mouseup", handleSelection);
        };
    }, [handleSelection]);

    const handleExplain = async () => {
        if (!selectedText) return;

        setLoading(true);
        setShowExplanation(true);
        setPosition(null);

        try {
            const res = await fetch("/api/explain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: selectedText }),
            });

            if (res.ok) {
                const data = await res.json();
                setExplanation(data.explanation);
            } else {
                setExplanation("Sorry, I couldn't generate an explanation. Please try again.");
            }
        } catch (error) {
            setExplanation("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShowExplanation(false);
        setExplanation("");
        setSelectedText("");
        window.getSelection()?.removeAllRanges();
    };

    if (showExplanation) {
        return (
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neo-black/50"
                onClick={(e) => e.target === e.currentTarget && handleClose()}
            >
                <div className="neo-card max-w-lg w-full max-h-[70vh] overflow-auto">
                    <div className="flex items-center justify-between p-4 border-b-[3px] border-neo-black bg-neo-yellow">
                        <h3 className="font-bold flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            AI Explanation
                        </h3>
                        <button 
                            onClick={handleClose}
                            className="neo-btn neo-btn-white p-1"
                            aria-label="Close explanation"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="mb-4 p-3 bg-neo-bg-dark border-[2px] border-neo-black">
                            <p className="text-sm font-bold text-neo-black/60 uppercase tracking-wider mb-1">Selected Text</p>
                            <p className="text-sm italic">&ldquo;{selectedText}&rdquo;</p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-neo-purple" />
                            </div>
                        ) : (
                            <div className="prose prose-sm max-w-none">
                                <ReactMarkdown>{explanation}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!position) return null;

    return (
        <div
            className="fixed z-50 neo-card p-2 flex items-center gap-2 animate-in fade-in zoom-in duration-150"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: "translate(-50%, -100%) translateY(-8px)",
            }}
        >
            <button
                onClick={handleExplain}
                className="neo-btn neo-btn-purple text-xs py-1.5 px-3"
            >
                <Sparkles className="w-3.5 h-3.5" />
                Explain
            </button>
            <button
                onClick={() => setPosition(null)}
                className="neo-btn neo-btn-white text-xs py-1.5 px-2"
                aria-label="Dismiss"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
