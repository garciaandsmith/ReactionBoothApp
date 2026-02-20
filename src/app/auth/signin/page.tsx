"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Mode = "signin" | "register" | "registered";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to create account");
          setLoading(false);
          return;
        }
        // Show "check your email" state
        setMode("registered");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Your account may be paused.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Post-registration: prompt to verify email
  if (mode === "registered") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2EE6A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Check your inbox</h1>
        <p className="text-gray-500 mb-2">
          We sent a verification email to <strong>{email}</strong>.
        </p>
        <p className="text-gray-500 mb-8 text-sm">
          Click the link in the email to verify your account. If SMTP is not configured,
          the link will appear in the server console.
        </p>
        <button
          onClick={() => setMode("signin")}
          className="text-brand hover:text-brand-600 text-sm font-medium"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  const isRegister = mode === "register";

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isRegister ? "Create an account" : "Sign in to ReactionBooth"}
        </h1>
        <p className="text-gray-500">
          {isRegister
            ? "Create an account to track your reactions."
            : "Sign in to access your dashboard and track reactions."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4"
      >
        {isRegister && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand-100 outline-none transition-all text-gray-900"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand-100 outline-none transition-all text-gray-900"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            {!isRegister && (
              <Link href="/auth/forgot-password" className="text-xs text-brand hover:text-brand-600">
                Forgot password?
              </Link>
            )}
          </div>
          <input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand-100 outline-none transition-all text-gray-900"
          />
          {isRegister && (
            <p className="text-xs text-gray-400 mt-1">At least 6 characters</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand text-soft-black py-3 rounded-xl font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-soft-black/30 border-t-soft-black rounded-full animate-spin" />
              {isRegister ? "Creating account..." : "Signing in..."}
            </span>
          ) : isRegister ? (
            "Create Account"
          ) : (
            "Sign In"
          )}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setMode(isRegister ? "signin" : "register");
              setError("");
            }}
            className="text-sm text-brand hover:text-brand-600"
          >
            {isRegister
              ? "Already have an account? Sign in"
              : "Don't have an account? Create one"}
          </button>
        </div>
      </form>
    </div>
  );
}
