"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
                        <div className="w-12 h-12 bg-neo-yellow flex items-center justify-center"
                            style={{ border: '3px solid #1a1a1a', boxShadow: '4px 4px 0px #1a1a1a' }}
                        >
                            <Brain className="w-6 h-6 text-neo-black" />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-extrabold tracking-tight mb-1">
                        Welcome Back
                    </h1>
                    <p className="text-neo-black/50 font-medium">
                        Sign in to continue your learning journey
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-neo-bg p-8"
                    style={{ border: '3px solid #1a1a1a', boxShadow: '8px 8px 0px #1a1a1a' }}
                >
                    {error && (
                        <div className="mb-6 p-3 bg-neo-coral text-neo-black text-sm font-bold"
                            style={{ border: '2px solid #1a1a1a', boxShadow: '3px 3px 0px #1a1a1a' }}
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className="neo-input"
                                style={{ boxShadow: '3px 3px 0px #1a1a1a' }}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password"
                                    className="neo-input pr-12"
                                    style={{ boxShadow: '3px 3px 0px #1a1a1a' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neo-black/40 hover:text-neo-black"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="neo-btn neo-btn-purple w-full text-sm mt-2 disabled:opacity-50"
                            style={{ boxShadow: '4px 4px 0px #1a1a1a' }}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 text-center"
                        style={{ borderTop: '2px solid #1a1a1a' }}
                    >
                        <p className="text-sm text-neo-black/60 font-medium">
                            Don&apos;t have an account?{" "}
                            <Link href="/auth/signup" className="font-bold text-neo-purple underline decoration-2 underline-offset-2 hover:text-neo-black">
                                Sign up free
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to home */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-xs font-bold text-neo-black/40 uppercase tracking-wider hover:text-neo-black">
                        ← Back to home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
