// components/EditCustomerModal.tsx
"use client";

import React, { useState, useCallback } from "react";
import { CustomerAPI, Customer, ProjectMeeting } from "@/lib/api";
import { MOCK_PROJECT_CARDS } from "@/lib/mockData";

interface Props {
  customer: Customer;
  onClose: () => void;
  onUpdated: (customer: Customer) => void;
  allCustomers?: Customer[];
}

const STATUS_OPTS: { label: string; value: Customer["status"] }[] = [
  { label: "Active",    value: "active" },
  { label: "Inactive",  value: "inactive" },
  { label: "Converted", value: "converted" },
];

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  active:    { bg: "#dcfce7", border: "#16a34a", text: "#15803d" },
  inactive:  { bg: "#f1f5f9", border: "#94a3b8", text: "#475569" },
  converted: { bg: "#f3e8ff", border: "#9333ea", text: "#7e22ce" },
};

function toMins(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

// 30-min slots 7 AM–9 PM
const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const mins = 7 * 60 + i * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const val = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return { val, label: fmt12(val) };
});

export default function EditCustomerModal({ customer, onClose, onUpdated, allCustomers = [] }: Props) {
  const [form, setForm] = useState({
    nickname:  customer.nickname,
    name:      customer.name     ?? "",
    phone:     customer.phone    ?? "",
    address:   customer.address  ?? "",
    notes:     customer.notes    ?? "",
    status:    customer.status,
  });
  const [projects,     setProjects]     = useState<ProjectMeeting[]>(customer.projects ?? []);
  const [showAddProj,  setShowAddProj]  = useState(false);
  const [editingProj,  setEditingProj]  = useState<ProjectMeeting | null>(null);
  const [newProj, setNewProj] = useState({ project_name: "", meeting_date: "", meeting_time: "" });
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [conflictWarn, setConflictWarn] = useState("");

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Conflict: same date, < 30 min apart (within this customer's own projects)
  const findConflict = useCallback((date: string, time: string, excludeName?: string): ProjectMeeting | null => {
    const mins = toMins(time);
    for (const p of projects) {
      if (excludeName && p.project_name === excludeName) continue;
      if (!p.meeting_date || !p.meeting_time) continue;
      if (p.meeting_date !== date) continue;
      if (Math.abs(toMins(p.meeting_time) - mins) < 30) return p;
    }
    return null;
  }, [projects]);

  const checkConflict = (date: string, time: string, excludeName?: string) => {
    if (!date || !time) { setConflictWarn(""); return; }
    const c = findConflict(date, time, excludeName);
    setConflictWarn(c ? `⚠️ "${c.project_name}" is at ${fmt12(c.meeting_time!)} — less than 30 min apart.` : "");
  };

  // Add project
  const handleAddProject = () => {
    setError("");
    if (!newProj.project_name) { setError("Select a project."); return; }
    if (!newProj.meeting_date) { setError("Select a meeting date."); return; }
    if (!newProj.meeting_time) { setError("Select a meeting time."); return; }
    if (projects.some((p) => p.project_name === newProj.project_name)) {
      setError(`"${newProj.project_name}" is already added.`); return;
    }
    const conflict = findConflict(newProj.meeting_date, newProj.meeting_time);
    if (conflict) { setError(`Time conflict with "${conflict.project_name}" at ${fmt12(conflict.meeting_time!)}.`); return; }
    setProjects([...projects, { ...newProj, scheduled_at: new Date().toISOString() }]);
    setNewProj({ project_name: "", meeting_date: "", meeting_time: "" });
    setShowAddProj(false);
  };

  const handleUpdateProject = () => {
    if (!editingProj) return;
    const conflict = findConflict(editingProj.meeting_date, editingProj.meeting_time, editingProj.project_name);
    if (conflict) { setError(`Time conflict with "${conflict.project_name}" at ${fmt12(conflict.meeting_time!)}.`); return; }
    setProjects(projects.map((p) => p.project_name === editingProj.project_name ? editingProj : p));
    setEditingProj(null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.nickname.trim()) { setError("Nickname is required."); return; }
    setSaving(true);
    try {
      const res = await CustomerAPI.update(customer.id, form);
      const updated = res.data;
      // sync project meetings
      const existNames = customer.projects?.map((p) => p.project_name) ?? [];
      const newNames   = projects.map((p) => p.project_name);
      for (const p of projects.filter((p) => !existNames.includes(p.project_name))) {
        await CustomerAPI.scheduleMeeting(customer.id, { meeting_date: p.meeting_date, meeting_time: p.meeting_time, project_name: p.project_name });
      }
      for (const p of projects.filter((p) => {
        const ex = customer.projects?.find((e) => e.project_name === p.project_name);
        return ex && (ex.meeting_date !== p.meeting_date || ex.meeting_time !== p.meeting_time);
      })) {
        await CustomerAPI.updateProjectMeeting(customer.id, p.project_name, { meeting_date: p.meeting_date, meeting_time: p.meeting_time });
      }
      for (const name of existNames.filter((n) => !newNames.includes(n))) {
        await CustomerAPI.deleteProjectMeeting(customer.id, name);
      }
      const fresh = await CustomerAPI.get(customer.id);
      onUpdated(fresh.data);
    } catch (e: unknown) {
      const err = e as { message?: string; errors?: Record<string, string[]> };
      if (err.errors) {
        const k = Object.keys(err.errors)[0];
        setError(err.errors[k]?.[0] ?? "Update failed.");
      } else setError(err.message ?? "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: "40rem" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <p className="modal-title">Edit Customer</p>
            <p className="modal-subtitle">
              Code: <span className="font-mono font-bold">{customer.secret_code}</span>
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="modal-body space-y-4">
          {error && (
            <div className="alert alert-danger">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Nickname + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nickname <span className="req">*</span></label>
              <input type="text" value={form.nickname} onChange={(e) => set("nickname", e.target.value)} className="input-field" placeholder="Nickname" />
            </div>
            <div>
              <label className="label">Status</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {STATUS_OPTS.map((opt) => {
                  const sc = STATUS_COLORS[opt.value];
                  const active = form.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("status", opt.value)}
                      className="px-2.5 py-1 rounded-full text-xs font-bold transition-all"
                      style={{
                        background: active ? sc.bg : "#f1f5f9",
                        color:      active ? sc.text : "var(--color-text-muted)",
                        border:     active ? `1.5px solid ${sc.border}` : "1.5px solid var(--color-border)",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Customer Name</label>
              <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className="input-field" placeholder="Full name" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} className="input-field" placeholder="10-digit number" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="label">Address</label>
            <textarea value={form.address} onChange={(e) => set("address", e.target.value)} rows={2} className="input-field" placeholder="Customer address" />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="input-field" placeholder="Any notes…" />
          </div>

          {/* Projects */}
          <hr className="section-divider" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0" style={{ fontSize: "0.78rem" }}>
                Projects &amp; Meetings <span style={{ color: "var(--gold-700)" }}>({projects.length})</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddProj(true)}
                className="btn btn-primary"
                style={{ fontSize: "0.72rem", padding: "0.3rem 0.75rem" }}
              >
                + Add Project
              </button>
            </div>

            {/* Add Project form */}
            {showAddProj && (
              <div className="p-3 rounded-xl mb-3 space-y-3" style={{ background: "var(--navy-50)", border: "1px solid var(--navy-100)" }}>
                <p className="text-xs font-bold" style={{ color: "var(--navy-700)" }}>New Project Meeting</p>
                <div>
                  <label className="label">Project <span className="req">*</span></label>
                  <select value={newProj.project_name} onChange={(e) => setNewProj({ ...newProj, project_name: e.target.value })} className="input-field">
                    <option value="">— Select project —</option>
                    {MOCK_PROJECT_CARDS.map((p) => <option key={p.id} value={p.name}>{p.name} — {p.location}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Date <span className="req">*</span></label>
                    <input type="date" value={newProj.meeting_date} min={today} onChange={(e) => setNewProj({ ...newProj, meeting_date: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Time <span className="req">*</span></label>
                    <select value={newProj.meeting_time} onChange={(e) => setNewProj({ ...newProj, meeting_time: e.target.value })} className="input-field">
                      <option value="">— Select time —</option>
                      {TIME_SLOTS.map(({ val, label }) => <option key={val} value={val}>{label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleAddProject} className="btn btn-primary flex-1" style={{ fontSize: "0.78rem" }}>Add</button>
                  <button type="button" onClick={() => setShowAddProj(false)} className="btn btn-ghost flex-1" style={{ fontSize: "0.78rem" }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Edit project form */}
            {editingProj && (
              <div className="p-3 rounded-xl mb-3 space-y-3" style={{ background: "var(--gold-50)", border: "1px solid var(--gold-300)" }}>
                <p className="text-xs font-bold" style={{ color: "var(--gold-700)" }}>Editing: {editingProj.project_name}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Date</label>
                    <input type="date" value={editingProj.meeting_date} min={today}
                      onChange={(e) => { setEditingProj({ ...editingProj, meeting_date: e.target.value }); checkConflict(e.target.value, editingProj.meeting_time, editingProj.project_name); }}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Time</label>
                    <select value={editingProj.meeting_time}
                      onChange={(e) => { setEditingProj({ ...editingProj, meeting_time: e.target.value }); checkConflict(editingProj.meeting_date, e.target.value, editingProj.project_name); }}
                      className="input-field"
                    >
                      <option value="">— Select time —</option>
                      {TIME_SLOTS.map(({ val, label }) => <option key={val} value={val}>{label}</option>)}
                    </select>
                  </div>
                </div>
                {conflictWarn && <div className="alert alert-warn text-xs">{conflictWarn}</div>}
                <div className="flex gap-2">
                  <button type="button" onClick={handleUpdateProject} disabled={!!conflictWarn} className="btn btn-primary flex-1" style={{ fontSize: "0.78rem" }}>Update</button>
                  <button type="button" onClick={() => { setEditingProj(null); setConflictWarn(""); }} className="btn btn-ghost flex-1" style={{ fontSize: "0.78rem" }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Projects list */}
            {projects.length === 0 ? (
              <p className="text-center text-xs py-4" style={{ color: "var(--color-text-hint)" }}>No projects added yet</p>
            ) : (
              <div className="space-y-2">
                {projects.map((p, i) => {
                  const past = p.meeting_date < today;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--slate-50)", border: "1px solid var(--slate-200)", opacity: past ? 0.65 : 1 }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--navy-800)" }}>{p.project_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                          📅 {p.meeting_date}
                          {p.meeting_time && <span className="ml-2">🕐 {fmt12(p.meeting_time)}</span>}
                          {past && <span className="ml-2 text-gray-400">(Past)</span>}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => setEditingProj(p)} className="p-1.5 rounded-lg transition-colors hover:bg-blue-100" style={{ color: "var(--navy-600)" }} title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => setProjects(projects.filter((_, j) => j !== i))} className="p-1.5 rounded-lg transition-colors hover:bg-red-50" style={{ color: "var(--red-600)" }} title="Remove">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn btn-primary flex-1">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="spinner" style={{ width: "0.9rem", height: "0.9rem", borderWidth: "2px" }} />
                Saving…
              </span>
            ) : "Save Changes →"}
          </button>
        </div>
      </div>
    </div>
  );
}