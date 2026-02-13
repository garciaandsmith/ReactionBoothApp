"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("email", { email, redirect: false });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Check your email
        </h1>
        <p className="text-gray-500">
          We sent a sign-in link to <strong>{email}</strong>. Click the link to
          continue.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Sign in to ReactionBooth
        </h1>
        <p className="text-gray-500">
          Enter your email and we&apos;ll send you a magic link.
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4"
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-500 text-white py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors"
        >
          Send Magic Link
        </button>
      </form>
    </div>
  );
}
