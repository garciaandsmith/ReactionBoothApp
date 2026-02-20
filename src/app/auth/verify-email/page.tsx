"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Email verified!</h1>
        <p className="text-gray-500 mb-8">Your email has been confirmed. You can now sign in.</p>
        <Link
          href="/auth/signin"
          className="inline-block bg-brand text-soft-black px-8 py-3 rounded-xl font-medium hover:bg-brand-600 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (error === "expired") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Link expired</h1>
        <p className="text-gray-500 mb-8">
          This verification link has expired. Sign in and we&apos;ll send you a new one.
        </p>
        <Link href="/auth/signin" className="text-brand hover:text-brand-600 font-medium">
          Back to sign in
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Invalid link</h1>
        <p className="text-gray-500 mb-8">
          This verification link is invalid. Please try signing up again.
        </p>
        <Link href="/auth/signin" className="text-brand hover:text-brand-600 font-medium">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2EE6A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Check your inbox</h1>
      <p className="text-gray-500 mb-8">
        We sent you a verification email. Click the link in the email to activate your account.
      </p>
      <Link href="/auth/signin" className="text-brand hover:text-brand-600 text-sm font-medium">
        Back to sign in
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-20 text-center"><div className="w-8 h-8 border-2 border-gray-200 border-t-brand rounded-full animate-spin mx-auto" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
