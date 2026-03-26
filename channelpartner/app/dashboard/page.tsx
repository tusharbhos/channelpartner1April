// app/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddCustomerModal from "@/components/AddCustomerModal";
import EditCustomerModal from "@/components/EditCustomerModal";
import { CustomerAPI, Customer, ProjectMeeting } from "@/lib/api";

// ── Status badge ───────────────────────────────────────────
function StatusBadge({ status }: { status: Customer["status"] }) {
  const MAP = {
    active:    "badge badge-active",
    inactive:  "badge badge-inactive",
    converted: "badge badge-converted",
  };
  const LABELS = { active: "Active", inactive: "Inactive", converted: "Converted" };
  return <span className={MAP[status] ?? MAP.active}>{LABELS[status]}</span>;
}

// ── Meeting stats ──────────────────────────────────────────
function MeetingStats({ projects }: { projects?: ProjectMeeting[] }) {
  if (!projects?.length) return <span style={{ color: "var(--color-text-hint)" }}>—</span>;
  const today    = new Date().toISOString().split("T")[0];
  const upcoming = projects.filter((p) => p.meeting_date >= today).length;
  const done     = projects.filter((p) => p.meeting_date  < today).length;
  return (
    <div className="flex items-center gap-1.5">
      {upcoming > 0 && (
        <span className="badge" style={{ background: "var(--gold-100)", color: "var(--gold-700)", fontSize: "0.65rem" }}>
          ⏰ {upcoming}
        </span>
      )}
      {done > 0 && (
        <span className="badge badge-active" style={{ fontSize: "0.65rem" }}>✅ {done}</span>
      )}
    </div>
  );
}

// ── Projects cell ──────────────────────────────────────────
function ProjectsCell({ projects }: { projects?: ProjectMeeting[] }) {
  if (!projects?.length) return <span style={{ color: "var(--color-text-hint)" }}>—</span>;
  const today    = new Date().toISOString().split("T")[0];
  const upcoming = projects.filter((p) => p.meeting_date >= today);
  const done     = projects.filter((p) => p.meeting_date  < today);
  return (
    <div className="space-y-1 max-w-[220px]">
      {upcoming.slice(0, 2).map((p, i) => (
        <div key={i} className="text-xs px-1.5 py-1 rounded-md truncate" style={{ background: "var(--gold-50)", color: "var(--gold-700)", border: "1px solid var(--gold-100)" }}>
          <span className="font-semibold">{p.project_name}</span>
          <span className="opacity-70 ml-1">{p.meeting_date}</span>
        </div>
      ))}
      {done.slice(0, 1).map((p, i) => (
        <div key={i} className="text-xs px-1.5 py-1 rounded-md truncate line-through" style={{ background: "var(--slate-50)", color: "var(--color-text-hint)" }}>
          {p.project_name}
        </div>
      ))}
      {projects.length > 3 && (
        <span className="text-xs" style={{ color: "var(--navy-500)" }}>+{projects.length - 3} more</span>
      )}
    </div>
  );
}

// ── Page loader ────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="spinner spinner-lg" />
    </div>
  );
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const [customers,    setCustomers]    = useState<Customer[]>([]);
  const [loadingData,  setLoadingData]  = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteId,     setDeleteId]     = useState<number | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isLoading, router]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoadingData(true);
      setError("");
      const res = await CustomerAPI.list();
      setCustomers(res.data);
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? "Failed to load customers.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchCustomers(); }, [isAuthenticated, fetchCustomers]);

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await CustomerAPI.delete(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setDeleteId(null);
    } catch { alert("Failed to delete."); }
    finally  { setDeleting(false); }
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.nickname.toLowerCase().includes(q) || c.secret_code.toLowerCase().includes(q)
      || (c.name && c.name.toLowerCase().includes(q)) || (c.phone && c.phone.includes(q));
  });

  const totalMeetings  = customers.reduce((s, c) => s + (c.projects?.length ?? 0), 0);
  const today          = new Date().toISOString().split("T")[0];
  const upcomingTotal  = customers.reduce((s, c) => s + (c.projects?.filter((p) => p.meeting_date >= today).length ?? 0), 0);

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return null;
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
      <Header variant="app" />

      <main className="flex-1" style={{ paddingTop: "var(--header-height)" }}>
        {/* Banner */}
        <div className="px-4 md:px-8 py-5" style={{ background: "var(--gradient-header)" }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="page-banner-sub">{isAdmin ? "Admin View — All Users" : "My Customers"}</p>
              <h2 className="page-banner-title">Customer Dashboard</h2>
            </div>
            <button onClick={() => setShowAdd(true)} className="btn btn-gold gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Customer
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="stats-bar">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-5 flex-wrap">
              {[
                { val: customers.length,                                                  label: "Customers",       color: "var(--navy-700)" },
                { val: customers.filter((c) => c.status === "active").length,             label: "Active",          color: "var(--green-600)" },
                { val: customers.filter((c) => c.status === "converted").length,          label: "Converted",       color: "var(--purple-600)" },
                { val: totalMeetings,                                                     label: "Total Meetings",  color: "var(--gold-700)" },
                { val: upcomingTotal,                                                     label: "Upcoming",        color: "var(--navy-500)" },
              ].map((s) => (
                <div key={s.label} className="flex items-baseline gap-1.5">
                  <span className="stat-val" style={{ color: s.color }}>{s.val}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-hint)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nickname, code, name…"
                className="input-field pl-9"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
          {error && (
            <div className="alert alert-danger mb-4">
              {error}
              <button onClick={fetchCustomers} className="ml-auto text-xs font-bold underline">Retry</button>
            </div>
          )}

          {loadingData ? (
            <div className="flex justify-center py-20"><div className="spinner spinner-lg" /></div>
          ) : filtered.length === 0 && !search ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">👥</p>
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-muted)" }}>No customers yet</h3>
              <p className="text-sm mb-6" style={{ color: "var(--color-text-hint)" }}>Add your first customer to get started</p>
              <button onClick={() => setShowAdd(true)} className="btn btn-primary">+ Add Customer</button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-hidden rounded-2xl border" style={{ border: "1px solid var(--slate-200)", boxShadow: "var(--shadow-sm)" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {["Nickname", "Secret Code", ...(isAdmin ? ["Agent"] : []), "Customer", "Phone", "Projects", "Meetings", "Status", "Actions"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={isAdmin ? 9 : 8} style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-hint)" }}>No customers match your search.</td></tr>
                    ) : filtered.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <span className="font-bold text-sm" style={{ color: "var(--navy-900)" }}>{c.nickname}</span>
                        </td>
                        <td><span className="secret-code">{c.secret_code}</span></td>
                        {isAdmin && (
                          <td className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {(c as unknown as { user?: { name: string } }).user?.name ?? `#${c.user_id}`}
                          </td>
                        )}
                        <td style={{ color: c.name ? "var(--color-text-primary)" : "var(--color-text-hint)" }}>
                          {c.name ?? "—"}
                        </td>
                        <td style={{ color: c.phone ? "var(--color-text-primary)" : "var(--color-text-hint)" }}>
                          {c.phone ?? "—"}
                        </td>
                        <td><ProjectsCell projects={c.projects} /></td>
                        <td><MeetingStats projects={c.projects} /></td>
                        <td><StatusBadge status={c.status} /></td>
                        <td>
                          <div className="flex gap-1.5">
                            <button onClick={() => setEditCustomer(c)} className="p-1.5 rounded-lg transition-colors hover:bg-blue-50" style={{ color: "var(--navy-600)" }} title="Edit">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg transition-colors hover:bg-red-50" style={{ color: "var(--red-600)" }} title="Delete">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.map((c) => (
                  <div key={c.id} className="card p-4 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-sm" style={{ color: "var(--navy-900)" }}>{c.nickname}</p>
                        <span className="secret-code mt-1 inline-block">{c.secret_code}</span>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    {c.name  && <p className="text-sm mb-1">👤 {c.name}</p>}
                    {c.phone && <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>📞 {c.phone}</p>}
                    <MeetingStats projects={c.projects} />
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setEditCustomer(c)} className="btn btn-primary flex-1" style={{ fontSize: "0.75rem" }}>Edit</button>
                      <button onClick={() => setDeleteId(c.id)} className="btn btn-danger flex-1" style={{ fontSize: "0.75rem" }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      {showAdd && (
        <AddCustomerModal onClose={() => setShowAdd(false)} onAdded={(c) => { setCustomers((prev) => [c, ...prev]); setShowAdd(false); }} />
      )}

      {editCustomer && (
        <EditCustomerModal
          customer={editCustomer}
          allCustomers={customers}
          onClose={() => setEditCustomer(null)}
          onUpdated={(u) => { setCustomers((prev) => prev.map((c) => c.id === u.id ? u : c)); setEditCustomer(null); }}
        />
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth: "22rem" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body text-center py-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--red-100)" }}>
                <svg className="w-7 h-7" style={{ color: "var(--red-600)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-1" style={{ color: "var(--navy-900)" }}>Delete Customer?</h3>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteId(null)} className="btn btn-ghost flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} disabled={deleting} className="btn btn-danger flex-1">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}