"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: string | null;
  plan: string;
  role: string;
  status: string;
  createdAt: string;
  _count: { sentReactions: number };
}

type PlanOption = "free" | "pro";
type StatusOption = "active" | "paused";
type RoleOption = "user" | "admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPlan, setNewPlan] = useState<PlanOption>("free");
  const [newRole, setNewRole] = useState<RoleOption>("user");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = async (id: string, patch: Record<string, string>) => {
    setSaving(id);
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await fetchUsers();
    } finally {
      setSaving(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, name: newName, plan: newPlan, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create user");
      } else {
        setNewEmail("");
        setNewName("");
        setNewPlan("free");
        setNewRole("user");
        setShowCreate(false);
        await fetchUsers();
      }
    } finally {
      setCreating(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      paused: "bg-red-100 text-red-700",
      pending: "bg-amber-100 text-amber-700",
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    );
  };

  const planBadge = (plan: string) => {
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        plan === "pro" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"
      }`}>
        {plan}
      </span>
    );
  };

  const pendingUsers = users.filter((u) => u.status === "pending");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-gray-400 hover:text-gray-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </Link>
              <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">ADMIN</span>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 bg-brand text-soft-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create User
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Pending approval banner */}
        {pendingUsers.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {pendingUsers.length} account{pendingUsers.length > 1 ? "s" : ""} awaiting approval
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {pendingUsers.map((u) => u.email).join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Create user form */}
        {showCreate && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create User</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-brand outline-none"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-brand outline-none"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as PlanOption)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-brand outline-none"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as RoleOption)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-brand outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {createError && (
                <div className="col-span-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {createError}
                </div>
              )}

              <div className="col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-brand text-soft-black px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="text-gray-500 px-5 py-2.5 rounded-xl text-sm hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">User</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Plan</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Booths</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className={`hover:bg-gray-50 ${user.status === "pending" ? "bg-amber-50/40" : ""}`}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{user.email}</span>
                            {user.role === "admin" && (
                              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">admin</span>
                            )}
                            {!user.emailVerified && (
                              <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">unverified</span>
                            )}
                          </div>
                          {user.name && <div className="text-xs text-gray-500">{user.name}</div>}
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {statusBadge(user.status)}
                      </td>
                      <td className="px-4 py-4">
                        {planBadge(user.plan)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {user._count.sentReactions}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {user.status === "pending" ? (
                            /* Approve / Reject for pending accounts */
                            <>
                              <button
                                onClick={() => updateUser(user.id, { status: "active" })}
                                disabled={saving === user.id}
                                className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                              >
                                {saving === user.id ? "..." : "Approve"}
                              </button>
                              <button
                                onClick={() => updateUser(user.id, { status: "paused" })}
                                disabled={saving === user.id}
                                className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            /* Toggle status for active/paused accounts */
                            <button
                              onClick={() => updateUser(user.id, { status: user.status === "active" ? "paused" : "active" })}
                              disabled={saving === user.id}
                              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                                user.status === "active"
                                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                                  : "bg-green-50 text-green-600 hover:bg-green-100"
                              } disabled:opacity-50`}
                            >
                              {saving === user.id ? "..." : user.status === "active" ? "Pause" : "Activate"}
                            </button>
                          )}
                          {/* Toggle plan */}
                          <button
                            onClick={() => updateUser(user.id, { plan: user.plan === "free" ? "pro" : "free" })}
                            disabled={saving === user.id}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors disabled:opacity-50"
                          >
                            {user.plan === "free" ? "→ Pro" : "→ Free"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-sm">No users yet</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
