"use client";

import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((settings: Record<string, string>) => {
        setMaintenanceMode(settings["maintenance_mode"] === "true");
      })
      .catch(() => setMaintenanceMode(false));
  }, []);

  async function toggleMaintenance() {
    if (maintenanceMode === null) return;
    setSaving(true);
    setMessage(null);
    const next = !maintenanceMode;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "maintenance_mode", value: next ? "true" : "false" }),
      });
      if (!res.ok) throw new Error("Failed");
      setMaintenanceMode(next);
      setMessage({
        type: "success",
        text: next
          ? "Maintenance mode ON — new reactions blocked, home page shows notice."
          : "Maintenance mode OFF — site is live.",
      });
    } catch {
      setMessage({ type: "error", text: "Failed to update setting. Try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">ADMIN</span>
            <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Maintenance Mode Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Maintenance Mode</h2>
              </div>
              <p className="text-sm text-gray-500 max-w-lg">
                When ON, the home page shows a &ldquo;coming soon&rdquo; notice and new reaction creation is blocked.
                Existing booth links and the admin panel remain accessible.
              </p>

              {maintenanceMode !== null && (
                <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full text-xs font-semibold ${
                  maintenanceMode
                    ? "bg-amber-100 text-amber-800"
                    : "bg-green-100 text-green-700"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${maintenanceMode ? "bg-amber-500" : "bg-green-500"}`} />
                  {maintenanceMode ? "Maintenance ON" : "Live — accepting visitors"}
                </div>
              )}
            </div>

            <button
              onClick={toggleMaintenance}
              disabled={saving || maintenanceMode === null}
              className={`shrink-0 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                maintenanceMode
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
              }`}
            >
              {saving ? "Saving…" : maintenanceMode ? "Turn OFF (go live)" : "Turn ON (pause site)"}
            </button>
          </div>

          {message && (
            <div className={`mt-4 px-4 py-3 rounded-xl text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-700"
            }`}>
              {message.text}
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700">
            <strong>Admin zone.</strong> Changes take effect immediately for all visitors.
          </p>
        </div>
      </div>
    </div>
  );
}
