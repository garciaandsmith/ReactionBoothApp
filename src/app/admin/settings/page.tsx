"use client";

import { useEffect, useState } from "react";

function cookieAge(updatedAt: string | null): {
  label: string;
  color: "green" | "amber" | "red";
} {
  if (!updatedAt) return { label: "Never set", color: "red" };
  const days = (Date.now() - new Date(updatedAt).getTime()) / 86_400_000;
  if (days < 14) return { label: `Updated ${Math.floor(days)}d ago`, color: "green" };
  if (days < 28) return { label: `Updated ${Math.floor(days)}d ago — refresh soon`, color: "amber" };
  return { label: `Updated ${Math.floor(days)}d ago — overdue`, color: "red" };
}

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // YouTube cookies state
  const [cookiesSet, setCookiesSet] = useState(false);
  const [cookiesUpdatedAt, setCookiesUpdatedAt] = useState<string | null>(null);
  const [cookiesPaste, setCookiesPaste] = useState("");
  const [cookiesSaving, setCookiesSaving] = useState(false);
  const [cookiesMessage, setCookiesMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((settings: Record<string, string>) => {
        setMaintenanceMode(settings["maintenance_mode"] === "true");
        setCookiesSet(!!settings["youtube_cookies"]);
        setCookiesUpdatedAt(settings["youtube_cookies_updated_at"] ?? null);
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

  async function saveCookies() {
    const trimmed = cookiesPaste.trim();
    if (!trimmed) return;
    setCookiesSaving(true);
    setCookiesMessage(null);
    try {
      const now = new Date().toISOString();
      const [r1, r2] = await Promise.all([
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "youtube_cookies", value: trimmed }),
        }),
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "youtube_cookies_updated_at", value: now }),
        }),
      ]);
      if (!r1.ok || !r2.ok) throw new Error("Failed");
      setCookiesSet(true);
      setCookiesUpdatedAt(now);
      setCookiesPaste("");
      setCookiesMessage({ type: "success", text: "Cookies saved. yt-dlp will use them immediately." });
    } catch {
      setCookiesMessage({ type: "error", text: "Failed to save cookies. Try again." });
    } finally {
      setCookiesSaving(false);
    }
  }

  const age = cookieAge(cookiesUpdatedAt);

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
                  maintenanceMode ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-700"
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
              message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* YouTube Cookies Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">YouTube Cookies</h2>
              </div>
              <p className="text-sm text-gray-500 max-w-lg">
                Pasting cookies from a logged-in YouTube session helps yt-dlp bypass bot detection on
                datacenter IPs. Refresh every 2–4 weeks when downloads start failing.
              </p>
            </div>
            {/* Freshness badge */}
            <div className={`shrink-0 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
              age.color === "green" ? "bg-green-100 text-green-700" :
              age.color === "amber" ? "bg-amber-100 text-amber-800" :
              "bg-red-100 text-red-700"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                age.color === "green" ? "bg-green-500" :
                age.color === "amber" ? "bg-amber-500" : "bg-red-500"
              }`} />
              {cookiesSet ? age.label : "Not set"}
            </div>
          </div>

          {/* How-to instructions */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-brand hover:text-brand-600 select-none list-none flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-90">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              How to get cookies
            </summary>
            <div className="mt-3 pl-5 space-y-2 text-sm text-gray-600">
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Install the browser extension{" "}
                  <strong>&ldquo;Get cookies.txt LOCALLY&rdquo;</strong>{" "}
                  (<a href="https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc" target="_blank" rel="noopener noreferrer" className="text-brand underline">Chrome</a>
                  {" / "}
                  <a href="https://addons.mozilla.org/en-US/firefox/addon/get-cookies-txt-locally/" target="_blank" rel="noopener noreferrer" className="text-brand underline">Firefox</a>).
                </li>
                <li>Log in to <strong>youtube.com</strong> with the dedicated platform account.</li>
                <li>With the extension active, open <strong>youtube.com</strong> in a tab.</li>
                <li>Click the extension icon and export cookies for <strong>youtube.com</strong> in <strong>Netscape format</strong>.</li>
                <li>Open the downloaded <code className="bg-gray-100 px-1 rounded text-xs">.txt</code> file, select all, and paste below.</li>
              </ol>
              <p className="text-xs text-gray-400 pt-1">
                The cookies are stored encrypted in the database and are only used server-side by yt-dlp.
              </p>
            </div>
          </details>

          {/* Paste area */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Paste Netscape-format cookies
            </label>
            <textarea
              value={cookiesPaste}
              onChange={(e) => setCookiesPaste(e.target.value)}
              rows={6}
              placeholder={"# Netscape HTTP Cookie File\n# Generated by Get cookies.txt LOCALLY\n.youtube.com\tTRUE\t/\t…"}
              className="w-full font-mono text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand resize-none placeholder-gray-300"
            />
            <p className="text-xs text-gray-400">
              Existing cookies are replaced — the current value is never shown here for security.
            </p>
          </div>

          <button
            onClick={saveCookies}
            disabled={cookiesSaving || !cookiesPaste.trim()}
            className="px-5 py-2.5 bg-brand text-soft-black rounded-xl font-medium text-sm hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cookiesSaving ? "Saving…" : "Save Cookies"}
          </button>

          {cookiesMessage && (
            <div className={`px-4 py-3 rounded-xl text-sm ${
              cookiesMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
            }`}>
              {cookiesMessage.text}
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
