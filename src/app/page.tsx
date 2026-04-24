"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap, Star, ArrowRight, Brain, Upload, MessageSquare, BookOpen } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function Home() {
    const { status } = useSession();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isAuthenticated = mounted && status === 'authenticated';

    return (
        <div className="min-h-screen text-neo-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-28 pb-16 overflow-hidden neo-grid">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Badge */}
                        <div className="flex justify-center mb-8">
                            <div className="neo-badge neo-badge-pink">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>AI-Powered Study Companion</span>
                            </div>
                        </div>

                        {/* Heading */}
                        <h1 className="text-center text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tighter leading-[0.9] mb-8">
                            Study{" "}
                            <span className="inline-block bg-neo-yellow px-3 py-1" style={{ border: '3px solid #1a1a1a', boxShadow: '4px 4px 0px #1a1a1a', transform: 'rotate(-1deg)' }}>
                                Smarter
                            </span>
                            <br />
                            Not{" "}
                            <span className="inline-block bg-neo-coral px-3 py-1 mt-2" style={{ border: '3px solid #1a1a1a', boxShadow: '4px 4px 0px #1a1a1a', transform: 'rotate(1deg)' }}>
                                Harder
                            </span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-center text-lg md:text-xl text-neo-black/60 leading-relaxed mb-10 font-medium">
                            Upload your PDFs, notes, or slides. Ask questions and get instant,{" "}
                            <span className="font-bold text-neo-black underline decoration-neo-purple decoration-3 underline-offset-4">
                                grounded answers
                            </span>{" "}
                            from your own materials. No hallucinations.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                            {isAuthenticated ? (
                                <Link href="/dashboard" className="neo-btn neo-btn-purple text-sm">
                                    Go to Dashboard
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            ) : (
                                <>
                                    <Link href="/auth/signup" className="neo-btn neo-btn-purple text-sm">
                                        Get Started for Free
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                    <Link href="/dashboard" className="neo-btn neo-btn-white text-sm">
                                        Open Dashboard
                                    </Link>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* Hero Visual — Brutalist App Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="bg-neo-bg-dark p-6 md:p-8" style={{ border: '3px solid #1a1a1a', boxShadow: '8px 8px 0px #1a1a1a' }}>
                            {/* Mock window bar */}
                            <div className="flex items-center gap-2 mb-4 pb-4" style={{ borderBottom: '2px solid #1a1a1a' }}>
                                <div className="w-3 h-3 bg-neo-coral" style={{ border: '2px solid #1a1a1a' }} />
                                <div className="w-3 h-3 bg-neo-yellow" style={{ border: '2px solid #1a1a1a' }} />
                                <div className="w-3 h-3 bg-neo-green" style={{ border: '2px solid #1a1a1a' }} />
                                <span className="ml-3 text-xs font-mono font-bold text-neo-black/40">smartstudy.ai/study</span>
                            </div>
                            {/* Mock chat */}
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 bg-neo-blue flex items-center justify-center shrink-0" style={{ border: '2px solid #1a1a1a' }}>
                                        <span className="text-xs font-bold">U</span>
                                    </div>
                                    <div className="bg-neo-bg p-3 text-sm font-medium max-w-md" style={{ border: '2px solid #1a1a1a', boxShadow: '3px 3px 0px #1a1a1a' }}>
                                        Explain thermodynamics step-by-step from my Physics notes
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 bg-neo-purple flex items-center justify-center shrink-0" style={{ border: '2px solid #1a1a1a' }}>
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-neo-yellow p-3 text-sm font-medium max-w-md" style={{ border: '2px solid #1a1a1a', boxShadow: '3px 3px 0px #1a1a1a' }}>
                                        <strong>Based on your Physics Ch.4 notes:</strong><br />
                                        1. The First Law states energy cannot be created or destroyed...<br />
                                        <span className="text-neo-black/50 text-xs font-mono mt-1 inline-block">[Source: physics_notes.pdf, p.12]</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 neo-grid" style={{ borderTop: '3px solid #1a1a1a', borderBottom: '3px solid #1a1a1a' }}>
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-0">
                    {[
                        { label: "Questions Solved", value: "2M+", color: "bg-neo-yellow" },
                        { label: "Docs Processed", value: "100K+", color: "bg-neo-pink" },
                        { label: "User Rating", value: "4.9/5", color: "bg-neo-blue" },
                        { label: "Time Saved", value: "40%", color: "bg-neo-coral" }
                    ].map((stat, i) => (
                        <div key={i} className={`text-center py-6 px-4 ${stat.color}`}
                            style={{
                                borderRight: i < 3 ? '3px solid #1a1a1a' : 'none',
                            }}
                        >
                            <div className="text-3xl md:text-4xl font-extrabold mb-1">{stat.value}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-neo-black/60" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 relative neo-grid">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                            Everything you need to{" "}
                            <span className="inline-block bg-neo-blue px-2" style={{ border: '2px solid #1a1a1a' }}>ace your exams</span>
                        </h2>
                        <p className="text-neo-black/50 max-w-lg mx-auto font-medium">
                            Powered by Retrieval-Augmented Generation — your AI tutor never makes things up.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Sparkles className="w-6 h-6" />,
                                title: "Grounded Q&A",
                                desc: "Your AI tutor only answers based on YOUR uploaded materials. No generic fluff — just facts from your lecture notes.",
                                color: "bg-neo-yellow",
                                borderColor: "#FFE156",
                            },
                            {
                                icon: <Zap className="w-6 h-6" />,
                                title: "Instant Practice",
                                desc: "Generate quizzes and practice problems in one click. Mixed difficulty levels automatically adapted to your content.",
                                color: "bg-neo-pink",
                                borderColor: "#FF6B9D",
                            },
                            {
                                icon: <Star className="w-6 h-6" />,
                                title: "Smart Insights",
                                desc: "Track which topics you struggle with most. Get suggestions on which parts of your documents to review next.",
                                color: "bg-neo-blue",
                                borderColor: "#4ECDC4",
                            }
                        ].map((feat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="neo-card p-8 group cursor-default"
                            >
                                <div className={`w-14 h-14 ${feat.color} flex items-center justify-center mb-6`}
                                    style={{ border: '3px solid #1a1a1a', boxShadow: '3px 3px 0px #1a1a1a' }}
                                >
                                    {feat.icon}
                                </div>
                                <h3 className="text-xl font-extrabold mb-3">{feat.title}</h3>
                                <p className="text-neo-black/50 text-sm leading-relaxed font-medium">{feat.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 bg-neo-bg-dark neo-grid" style={{ borderTop: '3px solid #1a1a1a', borderBottom: '3px solid #1a1a1a' }}>
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center mb-16">
                        How It{" "}
                        <span className="inline-block bg-neo-yellow px-2" style={{ border: '2px solid #1a1a1a' }}>Works</span>
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "01",
                                icon: <Upload className="w-8 h-8" />,
                                title: "Upload Your Notes",
                                desc: "Drop your PDFs, lecture slides, or text files. We'll process and index every page.",
                                color: "bg-neo-coral",
                            },
                            {
                                step: "02",
                                icon: <MessageSquare className="w-8 h-8" />,
                                title: "Ask Questions",
                                desc: "Chat with your AI tutor. It reads your actual materials and gives you grounded explanations.",
                                color: "bg-neo-purple",
                            },
                            {
                                step: "03",
                                icon: <BookOpen className="w-8 h-8" />,
                                title: "Practice & Ace",
                                desc: "Generate practice questions from your docs. Study smarter with targeted quizzes and solutions.",
                                color: "bg-neo-green",
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="relative"
                            >
                                <div className="text-7xl font-extrabold text-neo-black/[0.06] absolute -top-4 -left-2 select-none"
                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                    {item.step}
                                </div>
                                <div className="neo-card p-8 relative z-10">
                                    <div className={`w-16 h-16 ${item.color} flex items-center justify-center mb-6 ${item.color === 'bg-neo-purple' ? 'text-white' : 'text-neo-black'}`}
                                        style={{ border: '3px solid #1a1a1a', boxShadow: '4px 4px 0px #1a1a1a' }}
                                    >
                                        {item.icon}
                                    </div>
                                    <h3 className="text-xl font-extrabold mb-3">{item.title}</h3>
                                    <p className="text-neo-black/50 text-sm leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-neo-yellow neo-grid" style={{ borderBottom: '3px solid #1a1a1a' }}>
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                        Ready to transform your study routine?
                    </h2>
                    <p className="text-neo-black/60 font-medium text-lg mb-10 max-w-lg mx-auto">
                        Join thousands of students who ace their exams with AI-grounded study tools.
                    </p>
                    <Link href={isAuthenticated ? "/dashboard" : "/auth/signup"} className="neo-btn neo-btn-black text-base px-10 py-4">
                        {isAuthenticated ? "Go to Dashboard" : "Start Free Trial Now"}
                        <ArrowRight className="w-6 h-6" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 bg-neo-bg neo-grid">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2.5 font-bold text-lg text-neo-black/50">
                            <Brain className="w-5 h-5" />
                            SmartStudyAI
                        </div>
                        <div className="flex gap-6 text-sm font-bold text-neo-black/40 uppercase tracking-wider">
                            <a href="#" className="hover:text-neo-black transition-colors">Privacy</a>
                            <a href="#" className="hover:text-neo-black transition-colors">Terms</a>
                            <a href="#" className="hover:text-neo-black transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
}
