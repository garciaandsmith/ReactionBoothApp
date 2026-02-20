"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  users: number;
  reactions: number;
  completed: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((users) => setStats({ users: users.length, reactions: 0, completed: 0 }))
      .catch(() => {});
  }, []);

  const navItems = [
    {
      href: "/admin/users",
      label: "User Management",
      desc: "View, create, pause, and upgrade user accounts",
      icon: (
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      ),
    },
    {
      href: "/admin/settings",
      label: "Default Backgrounds",
      desc: "Upload default background images/videos per layout",
      icon: (
        <><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">ADMIN</span>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-3xl font-bold text-gray-900">{stats.users}</p>
              <p className="text-sm text-gray-500 mt-1">Total Users</p>
            </div>
          </div>
        )}

        {/* Navigation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-brand transition-colors group"
            >
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2EE6A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{item.label}</h2>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </Link>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700">
            <strong>Admin zone.</strong> Changes made here directly affect user accounts and site behaviour.
          </p>
        </div>
      </div>
    </div>
  );
}
