"use client";

import { useState, use, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, User, Sparkles, BookOpen, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import { useSearchParams } from "next/navigation";

interface PracticeQuestion {
    id: string;
    difficulty: string;
    question: string;
    answer: string;
    solutionSteps: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function StudySession({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const docId = searchParams.get('doc');

    const [level, setLevel] = useState("intermediate");
    const [showPractice, setShowPractice] = useState(false);
    const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
    const [practiceLoading, setPracticeLoading] = useState(false);
    const [practiceError, setPracticeError] = useState("");
    const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());
    const [documents, setDocuments] = useState<{ id: string; name: string }[]>([]);
    const [selectedDocId, setSelectedDocId] = useState(docId || "");

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Fetch user's documents for the dropdown
    useEffect(() => {
        fetch("/api/files")
            .then(res => res.json())
            .then(data => {
                if (data.documents) {
                    setDocuments(data.documents.filter((d: any) => d.status === 'ready'));
                    if (docId && !selectedDocId) {
                        setSelectedDocId(docId);
                    }
                }
            })
            .catch(console.error);
    }, [docId, selectedDocId]);

    // Generate practice questions
    const handleGeneratePractice = async () => {
        if (!selectedDocId) {
            setPracticeError("Please select a document first.");
            return;
        }

        setPracticeLoading(true);
        setPracticeError("");
        setShowPractice(true);

        try {
            const res = await fetch("/api/practice/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId: selectedDocId, count: 5 }),
            });

            if (res.ok) {
                const data = await res.json();
                setPracticeQuestions(data.questions);
                setRevealedAnswers(new Set());
            } else {
                const err = await res.json();
                setPracticeError(err.error || "Failed to generate questions");
            }
        } catch (err) {
            setPracticeError("Something went wrong. Please try again.");
        } finally {
            setPracticeLoading(false);
        }
    };

    const toggleAnswer = (qId: string) => {
        setRevealedAnswers(prev => {
            const next = new Set(prev);
            if (next.has(qId)) next.delete(qId);
            else next.add(qId);
            return next;
        });
    };

    const difficultyColors: Record<string, string> = {
        beginner: "bg-neo-green",
        intermediate: "bg-neo-yellow",
        advanced: "bg-neo-coral",
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        
        try {
            const res = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                    documentId: selectedDocId || undefined,
                    level
                })
            });
            
            if (!res.ok) {
                let errorMsg = 'Failed to get response';
                try {
                    const errData = await res.json();
                    errorMsg = errData.error || errorMsg;
                } catch {}
                const errorId = (Date.now() + 1).toString();
                setMessages(prev => [...prev, { id: errorId, role: 'assistant', content: `⚠️ **Error:** ${errorMsg}\n\nPlease try again.` }]);
                return;
            }
            
            const reader = res.body?.getReader();
            if (!reader) throw new Error('No response body');
            
            let assistantContent = '';
            const assistantId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = new TextDecoder().decode(value);
                assistantContent += chunk;
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m));
            }

            // If nothing was received, show a message
            if (!assistantContent.trim()) {
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: '⚠️ No response received. Please try again.' } : m));
            }
        } catch (err: any) {
            console.error('Chat error:', err);
            const errorId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, { id: errorId, role: 'assistant', content: `⚠️ **Connection error:** ${err.message || 'Something went wrong'}. Please try again.` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden text-neo-black"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative">
                {/* Header */}
                <header className="h-auto min-h-[64px] flex flex-wrap items-center justify-between px-4 md:px-6 py-3 gap-3 sticky top-0 z-10 bg-neo-bg"
                    style={{ borderBottom: '3px solid #1a1a1a' }}
                >
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center hover:bg-neo-bg-dark transition-colors"
                            style={{ border: '2px solid #1a1a1a' }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="font-bold text-sm">Study Session</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={selectedDocId}
                            onChange={(e) => setSelectedDocId(e.target.value)}
                            className="neo-input py-1.5 px-3 text-xs font-bold w-40"
                            style={{ boxShadow: '2px 2px 0px #1a1a1a' }}
                        >
                            <option value="">All Documents</option>
                            {documents.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.name}</option>
                            ))}
                        </select>

                        <div className="flex" style={{ border: '2px solid #1a1a1a' }}>
                            {['beginner', 'intermediate', 'advanced'].map(lvl => (
                                <button
                                    key={lvl}
                                    onClick={() => setLevel(lvl)}
                                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${level === lvl
                                        ? "bg-neo-purple text-white"
                                        : "bg-neo-bg text-neo-black/50 hover:bg-neo-bg-dark"
                                        }`}
                                    style={{ borderRight: lvl !== 'advanced' ? '2px solid #1a1a1a' : 'none' }}
                                >
                                    {lvl.slice(0, 3)}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleGeneratePractice}
                            disabled={practiceLoading}
                            className="neo-btn neo-btn-yellow text-[10px] py-1.5 px-3 disabled:opacity-50"
                            style={{ boxShadow: '2px 2px 0px #1a1a1a' }}
                        >
                            {practiceLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                            )}
                            Practice
                        </button>
                    </div>
                </header>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-3xl mx-auto flex gap-4 w-full"
                        >
                            <div className="w-10 h-10 bg-neo-purple flex items-center justify-center shrink-0"
                                style={{ border: '2px solid #1a1a1a', boxShadow: '2px 2px 0px #1a1a1a' }}
                            >
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div className="neo-card p-4 flex-1">
                                <p className="font-medium text-sm leading-relaxed">
                                    <strong>Hi there!</strong> I&apos;m SmartStudy AI. I can help you understand your uploaded materials.
                                    {selectedDocId ? " I&apos;ll focus on the selected document." : " Select a document or ask me anything across all your notes."}
                                </p>
                                <p className="text-xs text-neo-black/40 mt-2 font-mono">
                                    Level: {level} &bull; {selectedDocId ? "Focused mode" : "All documents"}
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        messages.map(m => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`max-w-3xl mx-auto flex gap-3 w-full ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                {m.role === 'user' ? (
                                    <div className="w-9 h-9 bg-neo-blue flex items-center justify-center shrink-0"
                                        style={{ border: '2px solid #1a1a1a', boxShadow: '2px 2px 0px #1a1a1a' }}
                                    >
                                        <User className="w-4 h-4 text-neo-black" />
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 bg-neo-purple flex items-center justify-center shrink-0"
                                        style={{ border: '2px solid #1a1a1a', boxShadow: '2px 2px 0px #1a1a1a' }}
                                    >
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                )}

                                <div className={`flex-1 max-w-2xl ${m.role === 'user' ? "bg-neo-blue p-4 text-sm font-medium" : "neo-card p-4"}`}
                                    style={{
                                        border: '2px solid #1a1a1a',
                                        boxShadow: m.role === 'user' ? '3px 3px 0px #1a1a1a' : '4px 4px 0px #1a1a1a',
                                    }}
                                >
                                    {m.role === 'user' ? (
                                        <div className="text-neo-black font-medium">{m.content}</div>
                                    ) : (
                                        <div className="prose prose-sm max-w-none text-neo-black leading-relaxed">
                                            <ReactMarkdown>{m.content}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}

                    {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto flex gap-3 w-full">
                            <div className="w-9 h-9 bg-neo-purple flex items-center justify-center shrink-0 animate-pulse"
                                style={{ border: '2px solid #1a1a1a', boxShadow: '2px 2px 0px #1a1a1a' }}
                            >
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="neo-card p-4 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-neo-purple" />
                                <span className="font-bold text-sm text-neo-purple">Thinking...</span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Input Bar */}
                <div className="p-4 bg-neo-bg" style={{ borderTop: '3px solid #1a1a1a' }}>
                    <form onSubmit={handleChatSubmit} className="max-w-3xl mx-auto relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={`Ask a question... (Level: ${level})`}
                            className="neo-input pr-14 min-h-[52px] max-h-[200px] resize-none text-sm"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-neo-purple flex items-center justify-center text-white disabled:opacity-50 transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
                            style={{ border: '2px solid #1a1a1a', boxShadow: '2px 2px 0px #1a1a1a' }}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <div className="max-w-3xl mx-auto mt-2 text-center">
                        <span className="text-[10px] text-neo-black/30 uppercase tracking-widest font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            Grounded in your uploaded documents
                        </span>
                    </div>
                </div>
            </div>

            {/* Practice Questions Panel */}
            <AnimatePresence>
                {showPractice && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 380, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="h-full bg-neo-bg-dark flex flex-col shrink-0 overflow-hidden"
                        style={{ borderLeft: '3px solid #1a1a1a' }}
                    >
                        <div className="h-16 px-4 flex items-center justify-between"
                            style={{ borderBottom: '3px solid #1a1a1a' }}
                        >
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                <h2 className="font-bold text-sm">Practice Questions</h2>
                            </div>
                            <button
                                onClick={() => setShowPractice(false)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-neo-coral transition-colors"
                                style={{ border: '2px solid #1a1a1a' }}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {practiceLoading && (
                                <div className="text-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-neo-purple" />
                                    <p className="font-bold text-sm text-neo-black/50">Generating questions...</p>
                                </div>
                            )}

                            {practiceError && (
                                <div className="p-3 bg-neo-coral text-neo-black font-bold text-sm"
                                    style={{ border: '2px solid #1a1a1a', boxShadow: '2px 2px 0px #1a1a1a' }}
                                >
                                    {practiceError}
                                </div>
                            )}

                            {practiceQuestions.map((q, i) => (
                                <div key={q.id || i} className="neo-card p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-bold text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                            Q{i + 1}
                                        </span>
                                        <span className={`neo-badge ${difficultyColors[q.difficulty] || 'bg-neo-yellow'} text-[9px]`}>
                                            {q.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium mb-3 leading-relaxed">{q.question}</p>
                                    <button
                                        onClick={() => toggleAnswer(q.id || String(i))}
                                        className="neo-btn neo-btn-white text-[10px] py-1 px-2 w-full"
                                        style={{ boxShadow: '2px 2px 0px #1a1a1a' }}
                                    >
                                        {revealedAnswers.has(q.id || String(i)) ? (
                                            <><ChevronUp className="w-3 h-3" /> Hide Answer</>
                                        ) : (
                                            <><ChevronDown className="w-3 h-3" /> Reveal Answer</>
                                        )}
                                    </button>
                                    <AnimatePresence>
                                        {revealedAnswers.has(q.id || String(i)) && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-3 p-3 bg-neo-yellow/30 text-sm"
                                                    style={{ border: '2px solid #1a1a1a' }}
                                                >
                                                    <p className="font-bold mb-2">Answer:</p>
                                                    <p className="mb-3">{q.answer}</p>
                                                    <p className="font-bold mb-1 text-xs uppercase tracking-wider">Solution:</p>
                                                    <div className="prose prose-sm max-w-none text-xs">
                                                        <ReactMarkdown>{q.solutionSteps}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}

                            {!practiceLoading && !practiceError && practiceQuestions.length === 0 && (
                                <p className="text-xs text-neo-black/40 italic text-center mt-8 font-medium">
                                    Click &quot;Practice&quot; to generate questions from your document.
                                </p>
                            )}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    );
}
