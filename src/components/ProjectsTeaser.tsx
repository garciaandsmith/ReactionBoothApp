"use client";

import Link from "next/link";

export default function ProjectsTeaser() {
  const exampleProjects = [
    { name: "Brand Campaign", booths: 5 },
    { name: "Product Launch", booths: 3 },
    { name: "Team Reactions", booths: 8 },
  ];

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
        <span className="text-xs font-medium bg-brand-100 text-soft-black px-2.5 py-0.5 rounded-full">
          Pro
        </span>
      </div>

      <div className="relative bg-white rounded-2xl border border-gray-200 p-6 overflow-hidden">
        <div className="pointer-events-none select-none opacity-75 space-y-3 mb-4">
          {exampleProjects.map((project) => (
            <div
              key={project.name}
              className="flex items-center justify-between bg-gray-50 rounded-xl p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2EE6A6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {project.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {project.booths} booths
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                  Settings
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none select-none opacity-75 flex items-center gap-3 mb-6">
          <span className="text-sm text-brand font-medium">
            + New Project
          </span>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2EE6A6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            Organize with Projects
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-xs mb-2">
            Bundle your booths into projects with custom branding, layouts, and
            configuration.
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
            <Link
              href="/dashboard/projects/new"
              className="hover:text-brand underline transition-colors pointer-events-auto"
            >
              Preview New Project
            </Link>
            <span>&middot;</span>
            <Link
              href="/dashboard/projects/settings"
              className="hover:text-brand underline transition-colors pointer-events-auto"
            >
              Preview Settings
            </Link>
          </div>
          <button className="bg-brand text-soft-black px-6 py-2.5 rounded-xl font-medium hover:bg-brand-600 transition-colors text-sm pointer-events-auto">
            Upgrade to Pro
          </button>
        </div>
      </div>
    </section>
  );
}
