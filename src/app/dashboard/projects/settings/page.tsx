"use client";

import Link from "next/link";
import { LAYOUTS } from "@/lib/constants";

export default function ProjectSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/dashboard"
        className="text-sm text-indigo-500 hover:text-indigo-600 mb-6 inline-flex items-center gap-1 transition-colors"
      >
        &larr; Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
        <span className="text-xs font-medium bg-indigo-100 text-indigo-600 px-2.5 py-0.5 rounded-full">
          Pro
        </span>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Configure branding and layout for all booths in this project.
      </p>

      <div className="space-y-8">
        {/* General */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
            General
          </h2>
          <div className="space-y-4 opacity-60 pointer-events-none select-none">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                disabled
                value="My Project"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                disabled
                rows={2}
                value="Describe your project..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
            Branding
          </h2>
          <div className="space-y-5 opacity-60 pointer-events-none select-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500 border border-gray-200 flex-shrink-0" />
                  <input
                    type="text"
                    disabled
                    value="#6366f1"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Font
                </label>
                <select
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 appearance-none"
                >
                  <option>System Default (Geist)</option>
                  <option>Inter</option>
                  <option>Poppins</option>
                  <option>Roboto</option>
                  <option>Montserrat</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Brand Logo
              </label>
              <div className="w-full px-6 py-8 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mb-1">
                  Drag and drop your logo here
                </p>
                <p className="text-xs text-gray-400">
                  PNG, SVG, or JPG (max 2MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Video Customization */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
            Video Customization
          </h2>
          <div className="space-y-4 opacity-60 pointer-events-none select-none">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Intro Message
              </label>
              <textarea
                disabled
                rows={2}
                value="A default intro message for all booths in this project..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                This message will be shown before recording starts in every
                booth in this project.
              </p>
            </div>
          </div>
        </div>

        {/* Default Layout */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
            Default Layout
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Choose how the reaction video and the original video are displayed
            together in the final output.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 opacity-60 pointer-events-none select-none">
            {Object.entries(LAYOUTS).map(([key, label]) => (
              <div
                key={key}
                className={`p-4 rounded-xl border text-center text-sm cursor-pointer transition-colors ${
                  key === "side-by-side"
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <div className="w-full h-16 rounded-lg bg-gray-100 mb-2 flex items-center justify-center overflow-hidden">
                  {key === "side-by-side" ? (
                    <div className="flex gap-1 w-full h-full p-1.5">
                      <div className="flex-1 bg-indigo-200 rounded" />
                      <div className="flex-1 bg-indigo-300 rounded" />
                    </div>
                  ) : key === "stacked" ? (
                    <div className="flex flex-col gap-1 w-full h-full p-1.5">
                      <div className="flex-1 bg-gray-200 rounded" />
                      <div className="flex-1 bg-gray-300 rounded" />
                    </div>
                  ) : key.startsWith("pip-") ? (
                    <div className="relative w-full h-full p-1.5">
                      <div className="w-full h-full bg-gray-200 rounded" />
                      <div
                        className={`absolute w-5 h-4 bg-gray-400 rounded-sm ${
                          key === "pip-bottom-right"
                            ? "bottom-2.5 right-2.5"
                            : key === "pip-bottom-left"
                              ? "bottom-2.5 left-2.5"
                              : key === "pip-top-right"
                                ? "top-2.5 right-2.5"
                                : "top-2.5 left-2.5"
                        }`}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Preview</span>
                  )}
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="text-center space-y-3 pt-2">
          <button className="bg-indigo-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors">
            Upgrade to Pro
          </button>
          <p className="text-xs text-gray-400">
            Project settings are available on the Pro plan. Upgrade to customize
            your booth branding and layouts.
          </p>
        </div>
      </div>
    </div>
  );
}
