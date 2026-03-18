"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BgImage { url: string; type: string }

interface LayoutStyle {
  id: string;
  name: string;
  isDefault: boolean;
  bgPip: string | null;
  bgSideBySide: string | null;
  bgStacked: string | null;
  createdAt: string;
  updatedAt: string;
}

type Slot = "pip" | "sideBySide" | "stacked";

function parseBg(raw: string | null): BgImage | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function slotField(slot: Slot): "bgPip" | "bgSideBySide" | "bgStacked" {
  return slot === "pip" ? "bgPip" : slot === "sideBySide" ? "bgSideBySide" : "bgStacked";
}

// ─── Layout overlay definitions (pixel values from compose.ts) ───────────────
// Expressed as percentages of the canvas for the preview overlay.

const BRAND = "#2EE6A6";

const SLOT_META: Record<Slot, {
  label: string;
  hint: string;
  aspect: number; // w/h
  overlays: { label: string; x: number; y: number; w: number; h: number }[];
}> = {
  pip: {
    label: "PiP Layouts",
    hint: "1920 × 1080 px — used by all Picture-in-Picture layouts",
    aspect: 1920 / 1080,
    overlays: [
      // Main video: 1750×977 at (85, 75)
      { label: "Main video", x: 85/1920, y: 75/1080, w: 1750/1920, h: 977/1080 },
      // PIP video (bottom-right): 550×310 at (1285, 742)
      { label: "PiP", x: 1285/1920, y: 742/1080, w: 550/1920, h: 310/1080 },
    ],
  },
  sideBySide: {
    label: "Side by Side",
    hint: "1920 × 1080 px — used by the side-by-side layout",
    aspect: 1920 / 1080,
    overlays: [
      // Left: 930×540 at (0, 270)
      { label: "Video", x: 0,        y: 270/1080, w: 930/1920, h: 540/1080 },
      // Right: 930×540 at (990, 270)
      { label: "Reaction", x: 990/1920, y: 270/1080, w: 930/1920, h: 540/1080 },
    ],
  },
  stacked: {
    label: "Stacked (Portrait)",
    hint: "1080 × 1920 px — used by the stacked portrait layout",
    aspect: 1080 / 1920,
    overlays: [
      // Top: 1080×920 at (0, 0)
      { label: "Video", x: 0, y: 0,         w: 1, h: 920/1920 },
      // Bottom: 1080×920 at (0, 1000)
      { label: "Reaction", x: 0, y: 1000/1920, w: 1, h: 920/1920 },
    ],
  },
};

// ─── Preview component ────────────────────────────────────────────────────────

function LayoutPreview({
  slot,
  bg,
  compact = false,
}: {
  slot: Slot;
  bg: BgImage | null;
  compact?: boolean;
}) {
  const meta = SLOT_META[slot];
  const containerH = compact ? 80 : 160;
  const containerW = containerH * meta.aspect;

  return (
    <div
      className="relative rounded overflow-hidden border border-gray-200 shrink-0"
      style={{ width: containerW, height: containerH, backgroundColor: BRAND }}
    >
      {bg && (
        <img
          src={bg.url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* Video area overlays */}
      {meta.overlays.map((o) => (
        <div
          key={o.label}
          className="absolute"
          style={{
            left:   `${o.x * 100}%`,
            top:    `${o.y * 100}%`,
            width:  `${o.w * 100}%`,
            height: `${o.h * 100}%`,
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.4)",
          }}
        >
          {!compact && (
            <span
              className="absolute inset-0 flex items-center justify-center text-white font-medium"
              style={{ fontSize: Math.max(7, containerH * 0.07) }}
            >
              {o.label}
            </span>
          )}
        </div>
      ))}
      {!bg && (
        <span
          className="absolute bottom-1 left-0 right-0 text-center font-medium text-white/60"
          style={{ fontSize: compact ? 8 : 10 }}
        >
          Brand colour
        </span>
      )}
    </div>
  );
}

// ─── Slot editor sub-component ────────────────────────────────────────────────

function SlotEditor({
  styleId,
  slot,
  bg,
  onChange,
}: {
  styleId: string;
  slot: Slot;
  bg: BgImage | null;
  onChange: (slot: Slot, bg: BgImage | null) => void;
}) {
  const meta = SLOT_META[slot];
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving]   = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("slot", slot);
      const res = await fetch(`/api/admin/layout-styles/${styleId}/background`, { method: "POST", body: form });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? "Upload failed");
      }
      const data: { url: string; type: string } = await res.json();
      onChange(slot, { url: data.url, type: data.type });
      setMsg({ type: "success", text: "Background saved." });
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Upload failed." });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setRemoving(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/admin/layout-styles/${styleId}/background?slot=${encodeURIComponent(slot)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Remove failed");
      onChange(slot, null);
      setMsg({ type: "success", text: "Background removed." });
    } catch {
      setMsg({ type: "error", text: "Failed to remove." });
    } finally {
      setRemoving(false);
    }
  }

  const busy = uploading || removing;

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{meta.hint}</p>
      </div>

      <LayoutPreview slot={slot} bg={bg} />

      <div className="flex gap-2">
        <label className={`flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
          busy ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-brand text-soft-black hover:bg-brand-600"
        }`}>
          {uploading ? "Uploading…" : bg ? "Replace" : "Upload PNG"}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
          />
        </label>
        {bg && (
          <button
            onClick={remove}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {removing ? "…" : "Remove"}
          </button>
        )}
      </div>

      {msg && (
        <p className={`text-xs px-2 py-1 rounded-lg ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

// ─── Style card (mosaic) ──────────────────────────────────────────────────────

function StyleCard({
  style,
  isEditing,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  style: LayoutStyle;
  isEditing: boolean;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const pip  = parseBg(style.bgPip);
  const sbs  = parseBg(style.bgSideBySide);
  const stk  = parseBg(style.bgStacked);
  const hasAny = pip || sbs || stk;

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-colors ${
      style.isDefault ? "border-brand" : isEditing ? "border-blue-400" : "border-gray-200 hover:border-gray-300"
    }`}>
      {/* Thumbnail strip */}
      <div className="bg-gray-50 p-3 flex gap-2 items-start">
        <LayoutPreview slot="pip" bg={pip} compact />
        <LayoutPreview slot="sideBySide" bg={sbs} compact />
        <LayoutPreview slot="stacked" bg={stk} compact />
        {!hasAny && (
          <span className="text-xs text-gray-400 self-center pl-1">No backgrounds set</span>
        )}
      </div>

      {/* Info + actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">{style.name}</p>
            {style.isDefault && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-brand/20 text-xs font-semibold text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
                Active default
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onEdit}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isEditing
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {isEditing ? "Editing…" : "Edit"}
          </button>
          {!style.isDefault && (
            <>
              <button
                onClick={onSetDefault}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand/10 text-emerald-800 hover:bg-brand/20 transition-colors"
              >
                Set as default
              </button>
              <button
                onClick={onDelete}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Inline editor panel ──────────────────────────────────────────────────────

function StyleEditor({
  style,
  onClose,
  onUpdated,
}: {
  style: LayoutStyle;
  onClose: () => void;
  onUpdated: (updated: LayoutStyle) => void;
}) {
  const [name, setName]     = useState(style.name);
  const [saving, setSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [local, setLocal]   = useState(style);

  async function saveName() {
    if (!name.trim() || name.trim() === style.name) return;
    setSaving(true);
    setNameMsg(null);
    try {
      const res = await fetch(`/api/admin/layout-styles/${style.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated: LayoutStyle = await res.json();
      setNameMsg({ type: "success", text: "Name saved." });
      setLocal(updated);
      onUpdated(updated);
    } catch {
      setNameMsg({ type: "error", text: "Failed to save name." });
    } finally {
      setSaving(false);
    }
  }

  function handleBgChange(slot: Slot, bg: BgImage | null) {
    const field = slotField(slot);
    const updated = { ...local, [field]: bg ? JSON.stringify(bg) : null };
    setLocal(updated);
    onUpdated(updated);
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-400 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          Editing: <span className="text-blue-700">{local.name}</span>
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close editor"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Name */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-gray-700">Style name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveName(); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <button
          onClick={saveName}
          disabled={saving || !name.trim() || name.trim() === local.name}
          className="px-4 py-2 bg-brand text-soft-black rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {saving ? "Saving…" : "Save Name"}
        </button>
      </div>
      {nameMsg && (
        <p className={`-mt-4 text-xs px-2 py-1 rounded-lg ${nameMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {nameMsg.text}
        </p>
      )}

      {/* Background slots */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["pip", "sideBySide", "stacked"] as Slot[]).map((slot) => (
          <SlotEditor
            key={slot}
            styleId={local.id}
            slot={slot}
            bg={parseBg(local[slotField(slot)])}
            onChange={handleBgChange}
          />
        ))}
      </div>
    </div>
  );
}

// ─── New style form ───────────────────────────────────────────────────────────

function NewStyleForm({
  onCreated,
  onCancel,
}: {
  onCreated: (style: LayoutStyle) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr]   = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/layout-styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? "Failed");
      }
      const created: LayoutStyle = await res.json();
      onCreated(created);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create style.");
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-6 space-y-4">
      <h3 className="text-base font-semibold text-gray-900">New Layout Style</h3>
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-gray-700">Style name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") create(); }}
            placeholder="e.g. Default, Event Branding, Holiday…"
            autoFocus
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <button
          onClick={create}
          disabled={saving || !name.trim()}
          className="px-4 py-2 bg-brand text-soft-black rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {saving ? "Creating…" : "Create"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors shrink-0"
        >
          Cancel
        </button>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminLayoutsPage() {
  const [styles, setStyles]         = useState<LayoutStyle[]>([]);
  const [loading, setLoading]       = useState(true);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [actionMsg, setActionMsg]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/layout-styles")
      .then((r) => r.json())
      .then((data: LayoutStyle[]) => { setStyles(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function updateStyle(updated: LayoutStyle) {
    setStyles((prev) => prev.map((s) => s.id === updated.id ? updated : s));
  }

  async function setDefault(id: string) {
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/layout-styles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error("Failed");
      // Mark the new default, unmark all others
      setStyles((prev) => prev.map((s) => ({ ...s, isDefault: s.id === id })));
      setActionMsg({ type: "success", text: "Default updated — all new exports will use this style." });
    } catch {
      setActionMsg({ type: "error", text: "Failed to update default." });
    }
  }

  async function deleteStyle(id: string) {
    if (!confirm("Delete this layout style? This cannot be undone.")) return;
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/layout-styles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? "Failed");
      }
      setStyles((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) setEditingId(null);
      setActionMsg({ type: "success", text: "Style deleted." });
    } catch (err) {
      setActionMsg({ type: "error", text: err instanceof Error ? err.message : "Delete failed." });
    }
  }

  const editingStyle = styles.find((s) => s.id === editingId) ?? null;
  const defaultStyle = styles.find((s) => s.isDefault);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">ADMIN</span>
            <h1 className="text-2xl font-bold text-gray-900">Layout Styles</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Named visual styles that supply background images for each export layout. The active default is applied to all video exports.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Active default banner */}
        {defaultStyle && (
          <div className="bg-brand/10 border border-brand/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand inline-block" />
              <span className="text-sm text-gray-800">
                Active default: <strong>{defaultStyle.name}</strong>
              </span>
            </div>
            <span className="text-xs text-gray-500">Applied to all new exports</span>
          </div>
        )}

        {/* Action feedback */}
        {actionMsg && (
          <div className={`px-4 py-3 rounded-xl text-sm ${
            actionMsg.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
          }`}>
            {actionMsg.text}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">
            {loading ? "Loading…" : `${styles.length} style${styles.length !== 1 ? "s" : ""}`}
          </h2>
          <button
            onClick={() => { setShowNewForm(true); setEditingId(null); }}
            disabled={showNewForm}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-soft-black rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Layout
          </button>
        </div>

        {/* New style form */}
        {showNewForm && (
          <NewStyleForm
            onCreated={(created) => {
              setStyles((prev) => [...prev, created]);
              setShowNewForm(false);
              setEditingId(created.id);
            }}
            onCancel={() => setShowNewForm(false)}
          />
        )}

        {/* Style mosaic */}
        {!loading && styles.length === 0 && !showNewForm && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">No layout styles yet. Create one to customise export backgrounds.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {styles.map((style) => (
            <StyleCard
              key={style.id}
              style={style}
              isEditing={editingId === style.id}
              onEdit={() => setEditingId(editingId === style.id ? null : style.id)}
              onSetDefault={() => setDefault(style.id)}
              onDelete={() => deleteStyle(style.id)}
            />
          ))}
        </div>

        {/* Inline editor */}
        {editingStyle && (
          <StyleEditor
            key={editingStyle.id}
            style={editingStyle}
            onClose={() => setEditingId(null)}
            onUpdated={updateStyle}
          />
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700">
            <strong>Admin zone.</strong> The active default style is applied to all exports immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
