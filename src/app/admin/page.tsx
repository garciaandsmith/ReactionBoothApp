"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  total: number;
  pending: number;
  active: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((users: { status: string }[]) => {
        if (!Array.isArray(users)) return;
        setStats({
          total: users.length,
          pending: users.filter((u) => u.status === "pending").length,
          active: users.filter((u) => u.status === "active").length,
        });
      })
      .catch(() => {});
  }, []);

  const navItems = [
    {
      href: "/admin/users",
      label: "User Management",
      desc: "View, approve, pause, and upgrade user accounts",
      icon: (
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      ),
    },
    {
      href: "/admin/settings",
      label: "Site Settings",
      desc: "Maintenance mode and other site-wide controls",
      icon: (
        <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>
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
        {/* Pending approval alert */}
        {stats && stats.pending > 0 && (
          <Link href="/admin/users" className="block">
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex items-center justify-between hover:border-amber-400 transition-colors">
              <div className="flex items-center gap-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    {stats.pending} account{stats.pending > 1 ? "s" : ""} awaiting approval
                  </p>
                  <p className="text-xs text-amber-700">Click to review and approve signups</p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500 mt-1">Total Signups</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              <p className="text-sm text-gray-500 mt-1">Active Users</p>
            </div>
            <div className={`rounded-2xl border p-6 ${stats.pending > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"}`}>
              <p className={`text-3xl font-bold ${stats.pending > 0 ? "text-amber-600" : "text-gray-900"}`}>{stats.pending}</p>
              <p className="text-sm text-gray-500 mt-1">Pending Approval</p>
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
