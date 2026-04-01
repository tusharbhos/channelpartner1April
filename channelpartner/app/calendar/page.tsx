// app/calendar/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CustomerAPI, Customer, ProjectMeeting } from "@/lib/api";
import { fetchAllProjects, ApiProject, normalize } from "@/lib/conectr";
import AddCustomerModal from "@/components/AddCustomerModal";
import MeetingModal, { MeetingEntry } from "@/components/MeetingModal";

const WEEKDAYS_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const normalise = (c: Customer) => ({
  ...c,
  projects: safeProjects(c.projects),
});
function safeProjects(projects: unknown): ProjectMeeting[] {
  return Array.isArray(projects) ? (projects as ProjectMeeting[]) : [];
}
function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const PILL_COLORS = [
  {
    bg: "rgba(30,69,128,0.11)",
    text: "#0f2240",
    border: "rgba(30,69,128,0.28)",
    dot: "#1e4580",
  },
  {
    bg: "rgba(249,115,22,0.12)",
    text: "#7a3500",
    border: "rgba(249,115,22,0.32)",
    dot: "#f97316",
  },
  {
    bg: "rgba(8,145,178,0.11)",
    text: "#044551",
    border: "rgba(8,145,178,0.28)",
    dot: "#0891b2",
  },
  {
    bg: "rgba(147,51,234,0.1)",
    text: "#4c1d95",
    border: "rgba(147,51,234,0.25)",
    dot: "#9333ea",
  },
  {
    bg: "rgba(22,163,74,0.11)",
    text: "#14532d",
    border: "rgba(22,163,74,0.28)",
    dot: "#16a34a",
  },
  {
    bg: "rgba(220,38,38,0.1)",
    text: "#7f1d1d",
    border: "rgba(220,38,38,0.25)",
    dot: "#dc2626",
  },
];

const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const mins = 7 * 60 + i * 30;
  const h = Math.floor(mins / 60),
    m = mins % 60;
  const val = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return { val, label: fmt12(val) };
});

/* ── small helpers ── */
function StepBadge({ n }: { n: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "1.3rem",
        height: "1.3rem",
        borderRadius: "50%",
        background: "linear-gradient(135deg,#1e4580,#0f2240)",
        color: "#fff",
        fontSize: "0.65rem",
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {n}
    </span>
  );
}

function Spin() {
  return (
    <div
      className="spinner"
      style={{ width: "0.9rem", height: "0.9rem", borderWidth: "2px" }}
    />
  );
}

/* ─── SheetOverlay ─── */
function SheetOverlay({
  onClose,
  children,
  hidden,
}: {
  onClose: () => void;
  children: React.ReactNode;
  hidden?: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: hidden ? "none" : "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(6,14,26,0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "fadeInBg 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "30rem",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -8px 40px rgba(6,14,26,0.28)",
          overflow: "hidden",
          animation: "slideUpSheet 0.3s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "10px 0 0",
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: "rgba(100,116,139,0.3)",
            }}
          />
        </div>
        {children}
      </div>
      <style>{`
        @keyframes slideUpSheet { from{transform:translateY(100%);opacity:.6} to{transform:translateY(0);opacity:1} }
        @keyframes fadeInBg     { from{opacity:0} to{opacity:1} }
        @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
      `}</style>
    </div>
  );
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      style={{
        width: "2rem",
        height: "2rem",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.15)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        flexShrink: 0,
      }}
    >
      <svg
        width="14"
        height="14"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}

/* ═══════════════════════════════════════════
   ADD MEETING MODAL
═══════════════════════════════════════════ */
function AddMeetingModal({
  date,
  onClose,
  onAdded,
}: {
  date: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [apiProjects, setApiProjects] = useState<ApiProject[]>([]);
  const [loadingC, setLoadingC] = useState(true);
  const [loadingP, setLoadingP] = useState(true);

  const [selCustomerId, setSelCustomerId] = useState<number | null>(null);
  const [selProject, setSelProject] = useState("");
  const [selTime, setSelTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);

  useEffect(() => {
    CustomerAPI.list()
      .then((r) => setCustomers(r.data))
      .catch(() => {})
      .finally(() => setLoadingC(false));
    fetchAllProjects()
      .then(({ projects }) => setApiProjects(projects))
      .catch(() => {})
      .finally(() => setLoadingP(false));
  }, []);

  const humanDate = new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const customer = customers.find((c) => c.id === selCustomerId);

  const handleCustomerCreated = (newCustomer: Customer) => {
    const normalised = {
      ...newCustomer,
      projects: Array.isArray(newCustomer.projects) ? newCustomer.projects : [],
    };
    setCustomers((prev) => [normalised, ...prev]);
    setSelCustomerId(normalised.id);
    setShowCreateCustomer(false);
  };

  const handleSave = async () => {
    setError("");
    if (!selCustomerId) {
      setError("Please select a customer.");
      return;
    }
    if (!selProject) {
      setError("Please select a project.");
      return;
    }
    if (!selTime) {
      setError("Please select a time slot.");
      return;
    }
    setSaving(true);
    try {
      await CustomerAPI.scheduleMeeting(selCustomerId, {
        meeting_date: date,
        meeting_time: selTime,
        project_name: selProject,
      });
      setSuccess("Meeting scheduled successfully!");
      setTimeout(() => {
        onAdded();
        onClose();
      }, 1200);
    } catch (e: unknown) {
      setError(
        (e as { message?: string }).message ??
          "Failed to schedule. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SheetOverlay onClose={onClose} hidden={showCreateCustomer}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.85rem 1.2rem",
            background:
              "linear-gradient(135deg,#0a1628 0%,#163258 50%,#1e4580 100%)",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "1rem",
                color: "#fff",
                margin: 0,
              }}
            >
              Schedule Meeting
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                marginTop: 6,
                padding: "4px 12px",
                borderRadius: 999,
                background: "rgba(249,115,22,0.28)",
                border: "1.5px solid rgba(249,115,22,0.55)",
              }}
            >
              <span style={{ fontSize: "0.78rem" }}>📅</span>
              <span
                style={{ fontSize: "0.78rem", fontWeight: 800, color: "#fff" }}
              >
                {humanDate}
              </span>
            </div>
          </div>
          <CloseBtn onClose={onClose} />
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            padding: "1rem 1.2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {error && (
            <div className="alert alert-danger" style={{ fontSize: "0.8rem" }}>
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success" style={{ fontSize: "0.8rem" }}>
              ✓ {success}
            </div>
          )}

          {/* Step 1 — Customer */}
          <div>
            <label
              className="label"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <StepBadge n={1} /> Select Customer{" "}
              <span style={{ color: "var(--red-600)" }}>*</span>
            </label>
            {loadingC ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0.6rem 0",
                  color: "var(--color-text-muted)",
                  fontSize: "0.82rem",
                }}
              >
                <Spin /> Loading customers…
              </div>
            ) : (
              <>
                <select
                  value={selCustomerId ?? ""}
                  onChange={(e) => {
                    setSelCustomerId(Number(e.target.value));
                    setError("");
                  }}
                  className="input-field"
                  style={{ marginTop: "0.35rem" }}
                >
                  <option value="">— Choose a customer —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nickname}
                      {c.name ? ` (${c.name})` : ""} · {c.secret_code}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowCreateCustomer(true)}
                  style={{
                    marginTop: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--navy-600)",
                    background: "var(--navy-50)",
                    border: "1.5px dashed var(--navy-200)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.45rem 0.85rem",
                    cursor: "pointer",
                    width: "100%",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--navy-100)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "var(--navy-50)")
                  }
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Customer not in list? Create new customer
                </button>
              </>
            )}
            {customer && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 6,
                  padding: "0.5rem 0.85rem",
                  borderRadius: "var(--radius-md)",
                  background: "var(--navy-50)",
                  border: "1px solid var(--navy-100)",
                }}
              >
                <span className="secret-code">{customer.secret_code}</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "var(--green-600)",
                  }}
                >
                  ✓ Verified
                </span>
              </div>
            )}
          </div>

          {/* Step 2 — Project */}
          <div>
            <label
              className="label"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <StepBadge n={2} /> Select Project{" "}
              <span style={{ color: "var(--red-600)" }}>*</span>
            </label>
            {loadingP ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0.6rem 0",
                  color: "var(--color-text-muted)",
                  fontSize: "0.82rem",
                }}
              >
                <Spin /> Loading projects…
              </div>
            ) : (
              <select
                value={selProject}
                onChange={(e) => {
                  setSelProject(e.target.value);
                  setError("");
                }}
                className="input-field"
                style={{ marginTop: "0.35rem" }}
              >
                <option value="">— Choose a project —</option>
                {apiProjects.map((p) => (
                  <option key={p.id} value={normalize(p.title)}>
                    {normalize(p.title)}
                    {p.location ? ` — ${normalize(p.location)}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Step 3 — Time */}
          <div>
            <label
              className="label"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <StepBadge n={3} /> Select Time{" "}
              <span style={{ color: "var(--red-600)" }}>*</span>
            </label>
            <p
              style={{
                fontSize: "0.7rem",
                color: "var(--color-text-hint)",
                margin: "0 0 4px",
                fontWeight: 500,
              }}
            >
              7:00 AM – 9:00 PM · 30-minute slots
            </p>
            <select
              value={selTime}
              onChange={(e) => {
                setSelTime(e.target.value);
                setError("");
              }}
              className="input-field"
            >
              <option value="">— Choose a time slot —</option>
              {TIME_SLOTS.map(({ val, label }) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Summary */}
          {selCustomerId && selProject && selTime && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "var(--radius-lg)",
                background:
                  "linear-gradient(135deg,rgba(249,115,22,0.09),rgba(30,69,128,0.06))",
                border: "1px solid rgba(249,115,22,0.28)",
                animation: "fadeIn 0.25s ease-out",
              }}
            >
              <p
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--orange-700)",
                  margin: "0 0 0.6rem",
                }}
              >
                Meeting Summary
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  {
                    icon: "👤",
                    label: "Customer",
                    val: customer?.nickname ?? "",
                  },
                  { icon: "🏠", label: "Project", val: selProject },
                  { icon: "📅", label: "Date", val: humanDate },
                  { icon: "🕐", label: "Time", val: fmt12(selTime) },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>
                      {row.icon}
                    </span>
                    <p style={{ margin: 0, fontSize: "0.82rem" }}>
                      <span
                        style={{
                          color: "var(--color-text-muted)",
                          fontWeight: 600,
                        }}
                      >
                        {row.label}:{" "}
                      </span>
                      <span
                        style={{ fontWeight: 700, color: "var(--navy-900)" }}
                      >
                        {row.val}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: "0.65rem",
            padding: "0.85rem 1.2rem",
            paddingBottom: "calc(0.85rem + env(safe-area-inset-bottom))",
            borderTop: "1px solid var(--slate-100)",
            background: "#fff",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selCustomerId || !selProject || !selTime}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            {saving ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Spin /> Saving…
              </span>
            ) : (
              "Schedule Meeting →"
            )}
          </button>
        </div>
      </SheetOverlay>

      {showCreateCustomer && (
        <AddCustomerModal
          onClose={() => setShowCreateCustomer(false)}
          onAdded={handleCustomerCreated}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   MAIN CALENDAR PAGE
═══════════════════════════════════════════ */
export default function CalendarPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const today = new Date();

  const [showAdd, setShowAdd] = useState(false);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<MeetingEntry | null>(null);
  const [addDate, setAddDate] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isLoading, router]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoadingData(true);
      const r = await CustomerAPI.list();
      setCustomers(r.data);
    } catch {
      /**/
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchCustomers();
  }, [isAuthenticated, fetchCustomers, refreshTick]);

  const prevMonth = () =>
    month === 0
      ? (setMonth(11), setYear((y) => y - 1))
      : setMonth((m) => m - 1);
  const nextMonth = () =>
    month === 11
      ? (setMonth(0), setYear((y) => y + 1))
      : setMonth((m) => m + 1);
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const allMeetings = useMemo<MeetingEntry[]>(() => {
    const out: MeetingEntry[] = [];
    customers.forEach((c) => {
      if (c.projects?.length) {
        c.projects.forEach((p) =>
          out.push({
            customer: c,
            meeting_date: p.meeting_date,
            meeting_time: p.meeting_time ?? "",
            project_name: p.project_name,
          }),
        );
      } else if (c.meeting_date) {
        out.push({
          customer: c,
          meeting_date: c.meeting_date,
          meeting_time: c.meeting_time ?? "",
          project_name: c.project_name ?? "",
        });
      }
    });
    return out;
  }, [customers]);

  const meetingMap = useMemo(() => {
    const map: Record<string, MeetingEntry[]> = {};
    allMeetings.forEach((e) => {
      const k = e.meeting_date.slice(0, 10);
      if (!map[k]) map[k] = [];
      map[k].push(e);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => a.meeting_time.localeCompare(b.meeting_time)),
    );
    return map;
  }, [allMeetings]);

  const monthMeetings = useMemo(
    () =>
      allMeetings
        .filter((e) => {
          const d = new Date(e.meeting_date + "T00:00:00");
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .sort((a, b) =>
          (a.meeting_date + a.meeting_time).localeCompare(
            b.meeting_date + b.meeting_time,
          ),
        ),
    [allMeetings, year, month],
  );

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const todayStr = today.toISOString().split("T")[0];
  const makeDate = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  if (isLoading)
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="app" />
      <main className="flex-1" style={{ paddingTop: "var(--header-height)" }}>
        {/* Banner */}
        <div
          className="px-4 md:px-8 py-4 md:py-5"
          style={{ background: "var(--gradient-header)" }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="page-banner-sub">Meeting Schedule</p>
              <h2 className="page-banner-title">📅 Calendar</h2>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}
            >
              <div className="text-center">
                <p className="banner-stat-val">{monthMeetings.length}</p>
                <p className="banner-stat-label">This Month</p>
              </div>
              <div
                style={{
                  width: 1,
                  height: 36,
                  background: "rgba(255,255,255,0.18)",
                }}
              />
              <div className="text-center">
                <p className="banner-stat-val">{allMeetings.length}</p>
                <p className="banner-stat-label">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Month Nav */}
        <div
          className="px-3 md:px-8 py-2.5 bg-white sticky z-10"
          style={{
            top: "var(--header-height)",
            borderBottom: "1px solid var(--slate-200)",
            boxShadow: "0 2px 8px rgba(10,22,40,0.06)",
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <button
              onClick={prevMonth}
              className="btn btn-ghost"
              style={{ padding: "0.5rem 0.75rem" }}
              aria-label="Previous month"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--navy-900)",
                  fontWeight: 700,
                  fontSize: "clamp(0.95rem,3vw,1.1rem)",
                  margin: 0,
                }}
              >
                {MONTHS[month]} {year}
              </h3>
              {(year !== today.getFullYear() || month !== today.getMonth()) && (
                <button
                  onClick={goToday}
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "2px 10px",
                    borderRadius: 999,
                    background: "var(--navy-50)",
                    color: "var(--navy-600)",
                    border: "1px solid var(--navy-100)",
                    cursor: "pointer",
                  }}
                >
                  Today
                </button>
              )}
            </div>
            <button
              onClick={nextMonth}
              className="btn btn-ghost"
              style={{ padding: "0.5rem 0.75rem" }}
              aria-label="Next month"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Hint strip */}
        <div
          style={{
            background:
              "linear-gradient(90deg,rgba(30,69,128,0.06),rgba(249,115,22,0.06))",
            borderBottom: "1px solid var(--slate-100)",
            padding: "0.4rem 1rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "0.7rem",
              color: "var(--navy-600)",
              fontWeight: 600,
              margin: 0,
            }}
          >
            📅 Click on any date to add a meeting &nbsp;·&nbsp; Click a meeting
            pill to view details
          </p>
        </div>

        {/* Calendar Grid */}
        <div className="px-2 sm:px-4 md:px-6 py-3 md:py-4 max-w-7xl mx-auto">
          {loadingData ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "5rem 0",
              }}
            >
              <div className="spinner spinner-lg" />
            </div>
          ) : (
            <div
              style={{
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--slate-200)",
                boxShadow: "var(--shadow-sm)",
                overflow: "hidden",
              }}
            >
              {/* Weekday headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                  background: "#fff",
                  borderBottom: "1px solid var(--slate-200)",
                }}
              >
                {WEEKDAYS_FULL.map((d, i) => (
                  <div
                    key={d}
                    className="cal-weekday"
                    style={{
                      color:
                        i === 0 || i === 6
                          ? "var(--red-600)"
                          : "var(--navy-700)",
                    }}
                  >
                    <span className="md:hidden">{WEEKDAYS_SHORT[i]}</span>
                    <span className="hidden md:inline">{d}</span>
                  </div>
                ))}
              </div>

              {/* Date cells */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                  background: "#fff",
                }}
              >
                {Array.from({ length: totalCells }, (_, i) => {
                  const dayNum = i - firstDay + 1;
                  const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                  const dateStr = isValid ? makeDate(dayNum) : null;
                  const isToday = dateStr === todayStr;
                  const isWknd = i % 7 === 0 || i % 7 === 6;
                  const entries = dateStr ? (meetingMap[dateStr] ?? []) : [];
                  const isPast = dateStr ? dateStr < todayStr : false;
                  const isLastRow = i >= totalCells - 7;
                  const isLastCol = i % 7 === 6;

                  return (
                    <div
                      key={i}
                      className="cal-cell"
                      onClick={() => {
                        if (isValid && dateStr) setAddDate(dateStr);
                      }}
                      style={{
                        background: !isValid
                          ? "var(--slate-50)"
                          : isToday
                            ? "rgba(30,69,128,0.05)"
                            : isWknd
                              ? "rgba(255,241,241,0.45)"
                              : "#fff",
                        borderRight: isLastCol
                          ? "none"
                          : "1px solid var(--slate-100)",
                        borderBottom: isLastRow
                          ? "none"
                          : "1px solid var(--slate-100)",
                        cursor: isValid ? "pointer" : "default",
                        transition: "background 0.15s",
                        position: "relative",
                      }}
                    >
                      {isValid && (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 3,
                            }}
                          >
                            <span
                              className="cal-day-num"
                              style={
                                isToday
                                  ? {
                                      background:
                                        "linear-gradient(135deg,#1e4580,#0f2240)",
                                      color: "#fff",
                                    }
                                  : {
                                      color: isWknd
                                        ? "var(--red-600)"
                                        : "var(--color-text-primary)",
                                    }
                              }
                            >
                              {dayNum}
                            </span>
                            {entries.length > 0 ? (
                              <span
                                className="hidden sm:flex items-center justify-center"
                                style={{
                                  minWidth: "1.15rem",
                                  height: "1.15rem",
                                  borderRadius: 999,
                                  padding: "0 3px",
                                  background:
                                    "linear-gradient(135deg,#1e4580,#0f2240)",
                                  color: "#fff",
                                  fontSize: "0.58rem",
                                  fontWeight: 800,
                                }}
                              >
                                {entries.length}
                              </span>
                            ) : !isPast ? (
                              <span
                                className="hidden sm:flex items-center justify-center"
                                style={{
                                  width: "1.15rem",
                                  height: "1.15rem",
                                  borderRadius: "50%",
                                  background: "rgba(30,69,128,0.08)",
                                  color: "var(--navy-400)",
                                  fontSize: "0.8rem",
                                  fontWeight: 900,
                                }}
                              >
                                +
                              </span>
                            ) : null}
                          </div>

                          {/* Mobile dots */}
                          <div
                            className="sm:hidden"
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 2,
                            }}
                          >
                            {entries.slice(0, 4).map((entry, idx) => {
                              const pal = PILL_COLORS[idx % PILL_COLORS.length];
                              return (
                                <button
                                  key={idx}
                                  className="cal-dot"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEntry(entry);
                                  }}
                                  style={{
                                    background: pal.dot,
                                    border: `1.5px solid ${pal.border}`,
                                  }}
                                  title={entry.customer.nickname}
                                />
                              );
                            })}
                            {entries.length === 0 && !isPast && (
                              <span
                                style={{
                                  fontSize: "9px",
                                  color: "rgba(30,69,128,0.25)",
                                  fontWeight: 900,
                                  lineHeight: 1,
                                  marginTop: 2,
                                }}
                              >
                                +
                              </span>
                            )}
                          </div>

                          {/* Desktop pills */}
                          <div
                            className="hidden sm:flex flex-col"
                            style={{ gap: 2 }}
                          >
                            {entries.slice(0, 3).map((entry, idx) => {
                              const pal = PILL_COLORS[idx % PILL_COLORS.length];
                              return (
                                <button
                                  key={idx}
                                  className="cal-pill"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEntry(entry);
                                  }}
                                  style={{
                                    background: pal.bg,
                                    color: pal.text,
                                    border: `1px solid ${pal.border}`,
                                  }}
                                  title={`${entry.customer.nickname} — ${entry.project_name}`}
                                >
                                  <span
                                    className="hidden md:inline"
                                    style={{
                                      opacity: 0.6,
                                      marginRight: 3,
                                      fontSize: "9px",
                                    }}
                                  >
                                    {entry.meeting_time &&
                                      fmt12(entry.meeting_time)}
                                  </span>
                                  {entry.customer.nickname}
                                </button>
                              );
                            })}
                            {entries.length > 3 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEntry(entries[3]);
                                }}
                                style={{
                                  color: "var(--navy-500)",
                                  fontSize: 10,
                                  textAlign: "left",
                                  paddingLeft: 4,
                                  fontWeight: 600,
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                +{entries.length - 3} more
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Month meeting list */}
          {monthMeetings.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--navy-900)",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  marginBottom: "0.75rem",
                  padding: "0 4px",
                }}
              >
                Meetings in {MONTHS[month]}
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill,minmax(min(100%,260px),1fr))",
                  gap: "0.6rem",
                }}
              >
                {monthMeetings.map((entry, idx) => {
                  const pal = PILL_COLORS[idx % PILL_COLORS.length];
                  const d = new Date(entry.meeting_date + "T00:00:00");
                  const isPast =
                    d <
                    new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate(),
                    );
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedEntry(entry)}
                      style={{
                        textAlign: "left",
                        padding: "0.85rem 1rem",
                        borderRadius: "var(--radius-lg)",
                        background: "#fff",
                        border: `1.5px solid ${pal.border}`,
                        opacity: isPast ? 0.6 : 1,
                        boxShadow: "var(--shadow-xs)",
                        cursor: "pointer",
                        transition: "transform 0.18s, box-shadow 0.18s",
                      }}
                      onMouseEnter={(e) => {
                        const t = e.currentTarget;
                        t.style.transform = "translateY(-2px)";
                        t.style.boxShadow = "var(--shadow-md)";
                      }}
                      onMouseLeave={(e) => {
                        const t = e.currentTarget;
                        t.style.transform = "none";
                        t.style.boxShadow = "var(--shadow-xs)";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 6,
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: pal.text,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {entry.customer.nickname}
                        </span>
                        <span
                          className="secret-code"
                          style={{
                            flexShrink: 0,
                            borderColor: pal.border,
                            color: pal.text,
                            background: pal.bg,
                          }}
                        >
                          {entry.customer.secret_code}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                          margin: 0,
                        }}
                      >
                        📅{" "}
                        {d.toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                        {entry.meeting_time && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontWeight: 700,
                              color: pal.text,
                            }}
                          >
                            · {fmt12(entry.meeting_time)}
                          </span>
                        )}
                      </p>
                      {entry.project_name && (
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                            margin: "3px 0 0",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          🏠 {entry.project_name}
                        </p>
                      )}
                      {isPast && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: 5,
                            fontSize: "0.68rem",
                            padding: "1px 8px",
                            borderRadius: 999,
                            background: "var(--slate-100)",
                            color: "var(--slate-400)",
                          }}
                        >
                          Past
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loadingData && monthMeetings.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
              <p style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>📭</p>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--color-text-muted)",
                  marginBottom: "0.4rem",
                }}
              >
                No meetings in {MONTHS[month]}
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text-hint)",
                  marginBottom: "1.25rem",
                }}
              >
                Click any date on the calendar above to schedule a meeting
              </p>
              <button
                onClick={() => setAddDate(todayStr)}
                className="btn btn-primary"
              >
                + Add Meeting Today
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modals */}
      {selectedEntry && (
        <MeetingModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onAdded={(c) => {
            setCustomers((prev) => [normalise(c), ...prev]);
            setShowAdd(false);
          }}
        />
      )}
      {addDate && (
        <AddMeetingModal
          date={addDate}
          onClose={() => setAddDate(null)}
          onAdded={() => {
            setAddDate(null);
            setRefreshTick((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}
