"use client";

import Link from "next/link";

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link
        href="/dashboard"
        className="text-sm text-indigo-500 hover:text-indigo-600 mb-6 inline-flex items-center gap-1 transition-colors"
      >
        &larr; Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Create a New Project
        </h1>
        <span className="text-xs font-medium bg-indigo-100 text-indigo-600 px-2.5 py-0.5 rounded-full">
          Pro
        </span>
      </div>

      <p className="text-gray-500 text-sm mb-8">
        Projects let you group reaction booths together with shared branding and
        settings. All booths in a project inherit its custom layout, colors, and
        logo.
      </p>

      <div className="space-y-6">
        {/* Project Name */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="space-y-4 opacity-60 pointer-events-none select-none">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                disabled
                placeholder="e.g., Product Launch Campaign"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                disabled
                rows={3}
                placeholder="Describe the purpose of this project..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="text-center space-y-3">
          <button className="bg-indigo-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors">
            Upgrade to Pro
          </button>
          <p className="text-xs text-gray-400">
            Projects are available on the Pro plan. Upgrade to start organizing
            your booths.
          </p>
        </div>
      </div>
    </div>
  );
}
