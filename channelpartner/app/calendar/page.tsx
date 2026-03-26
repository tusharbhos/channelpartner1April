// app/calendar/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CustomerAPI, Customer } from "@/lib/api";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

// 6 distinct pill colors
const PILL_COLORS = [
  { bg: "rgba(30,69,128,0.12)", text: "#0f2240",  border: "rgba(30,69,128,0.3)" },
  { bg: "rgba(240,165,0,0.14)", text: "#7a5500",  border: "rgba(240,165,0,0.35)" },
  { bg: "rgba(8,145,178,0.12)", text: "#044551",  border: "rgba(8,145,178,0.3)" },
  { bg: "rgba(147,51,234,0.1)", text: "#4c1d95",  border: "rgba(147,51,234,0.25)" },
  { bg: "rgba(22,163,74,0.12)", text: "#14532d",  border: "rgba(22,163,74,0.3)" },
  { bg: "rgba(220,38,38,0.1)",  text: "#7f1d1d",  border: "rgba(220,38,38,0.25)" },
];

// A "meeting entry" combining customer + date + time + project
interface MeetingEntry {
  customer:     Customer;
  meeting_date: string;
  meeting_time: string;
  project_name: string;
}

// ── Meeting Detail Modal ───────────────────────────────────
function MeetingModal({ entry, onClose }: { entry: MeetingEntry; onClose: () => void }) {
  const { customer } = entry;
  const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
    active:    { bg: "var(--green-100)", text: "var(--green-600)",  dot: "var(--green-600)" },
    inactive:  { bg: "var(--slate-100)", text: "var(--slate-500)",  dot: "var(--slate-400)" },
    converted: { bg: "var(--purple-100)",text: "var(--purple-600)", dot: "var(--purple-600)" },
  };
  const sc = STATUS_STYLE[customer.status] ?? STATUS_STYLE.active;

  const sendWhatsApp = () => {
    if (!customer.phone) return;
    const msg = `Hello ${customer.name || customer.nickname},\n\nYour meeting for ${entry.project_name} is scheduled on ${entry.meeting_date} at ${fmt12(entry.meeting_time)}.\n\nRegards,\nChannelPartner.Network`;
    window.open(`https://wa.me/91${customer.phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const sendEmail = () => {
    if (!customer.email) return;
    const subj = `Meeting Confirmation — ${entry.project_name}`;
    const body = `Dear ${customer.name || customer.nickname},\n\nYour meeting:\nProject: ${entry.project_name}\nDate: ${entry.meeting_date}\nTime: ${fmt12(entry.meeting_time)}\n\nRegards,\nChannelPartner.Network`;
    window.location.href = `mailto:${customer.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: "26rem" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <p className="modal-title">{customer.nickname}</p>
            <span className="secret-code" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>
              {customer.secret_code}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body space-y-4">
          {/* Status */}
          <span className="inline-flex items-center gap-1.5 badge" style={{ background: sc.bg, color: sc.text }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
          </span>

          {/* Meeting info card */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--navy-50)", border: "1px solid var(--navy-100)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--gradient-btn-blue)" }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>Meeting</p>
              <p className="text-sm font-bold" style={{ color: "var(--navy-900)" }}>
                {new Date(entry.meeting_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              {entry.meeting_time && (
                <p className="text-sm font-semibold" style={{ color: "var(--gold-700)" }}>🕐 {fmt12(entry.meeting_time)}</p>
              )}
            </div>
          </div>

          {/* Project */}
          {entry.project_name && (
            <div className="flex items-start gap-2.5">
              <span className="text-base">🏠</span>
              <div>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Project</p>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{entry.project_name}</p>
              </div>
            </div>
          )}

          {/* Contact info */}
          {[
            { icon: "👤", label: "Name",    val: customer.name },
            { icon: "📞", label: "Phone",   val: customer.phone },
            { icon: "✉️", label: "Email",   val: customer.email },
            { icon: "📍", label: "Address", val: customer.address },
          ].map((row) => row.val && (
            <div key={row.label} className="flex items-start gap-2.5">
              <span className="text-sm">{row.icon}</span>
              <div>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{row.label}</p>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{row.val}</p>
              </div>
            </div>
          ))}

          {/* Notes */}
          {customer.notes && (
            <div className="p-3 rounded-xl text-xs italic" style={{ background: "var(--slate-50)", border: "1px solid var(--slate-200)", color: "var(--color-text-secondary)" }}>
              📝 "{customer.notes}"
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button onClick={sendWhatsApp} disabled={!customer.phone} className="btn flex items-center gap-2 justify-center" style={{ background: "#25d366", color: "#fff", fontSize: "0.78rem" }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.48 2 2 6.48 2 12c0 2.108.576 4.082 1.579 5.79L2 22l4.21-1.579A9.93 9.93 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
              </svg>
              WhatsApp
            </button>
            <button onClick={sendEmail} disabled={!customer.email} className="btn flex items-center gap-2 justify-center" style={{ background: "#ea4335", color: "#fff", fontSize: "0.78rem" }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              Email
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary w-full">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Calendar Page ──────────────────────────────────────────
export default function CalendarPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const today = new Date();

  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selected,   setSelected]   = useState<MeetingEntry | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isLoading, router]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoadingData(true);
      const res = await CustomerAPI.list();
      setCustomers(res.data);
    } catch { /* ignore */ }
    finally { setLoadingData(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchCustomers(); }, [isAuthenticated, fetchCustomers]);

  const prevMonth = () => month === 0  ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);
  const nextMonth = () => month === 11 ? (setMonth(0),  setYear(y => y + 1)) : setMonth(m => m + 1);
  const goToday   = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  // Flatten all meetings from all customers
  const allMeetings = useMemo<MeetingEntry[]>(() => {
    const entries: MeetingEntry[] = [];
    customers.forEach((c) => {
      if (c.projects?.length) {
        c.projects.forEach((p) => entries.push({ customer: c, meeting_date: p.meeting_date, meeting_time: p.meeting_time ?? "", project_name: p.project_name }));
      } else if (c.meeting_date) {
        entries.push({ customer: c, meeting_date: c.meeting_date, meeting_time: c.meeting_time ?? "", project_name: c.project_name ?? "" });
      }
    });
    return entries;
  }, [customers]);

  // Group by date
  const meetingMap = useMemo(() => {
    const map: Record<string, MeetingEntry[]> = {};
    allMeetings.forEach((e) => {
      const key = e.meeting_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.meeting_time.localeCompare(b.meeting_time)));
    return map;
  }, [allMeetings]);

  // Month meetings
  const monthMeetings = useMemo(() => allMeetings.filter((e) => {
    const d = new Date(e.meeting_date + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() === month;
  }).sort((a, b) => (a.meeting_date + a.meeting_time).localeCompare(b.meeting_date + b.meeting_time)), [allMeetings, year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const todayStr    = today.toISOString().split("T")[0];

  if (isLoading) return <div className="page-loader"><div className="spinner spinner-lg" /></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
      <Header variant="app" />

      <main className="flex-1" style={{ paddingTop: "var(--header-height)" }}>
        {/* Banner */}
        <div className="px-4 md:px-8 py-5" style={{ background: "var(--gradient-header)" }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="page-banner-sub">Meeting Schedule</p>
              <h2 className="page-banner-title">📅 Calendar</h2>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-center">
                <p className="banner-stat-val">{monthMeetings.length}</p>
                <p className="banner-stat-label">This Month</p>
              </div>
              <div className="text-center">
                <p className="banner-stat-val">{allMeetings.length}</p>
                <p className="banner-stat-label">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Month nav */}
        <div
          className="px-4 md:px-8 py-3 bg-white sticky z-10"
          style={{ top: "var(--header-height)", borderBottom: "1px solid var(--slate-200)" }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button onClick={prevMonth} className="btn btn-ghost w-9 h-9 p-0" style={{ borderRadius: "var(--radius-md)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--navy-900)" }}>
                {MONTHS[month]} {year}
              </h3>
              {(year !== today.getFullYear() || month !== today.getMonth()) && (
                <button onClick={goToday} className="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors" style={{ background: "var(--navy-50)", color: "var(--navy-600)", border: "1px solid var(--navy-100)" }}>
                  Today
                </button>
              )}
            </div>
            <button onClick={nextMonth} className="btn btn-ghost w-9 h-9 p-0" style={{ borderRadius: "var(--radius-md)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-2 md:px-6 py-4 max-w-7xl mx-auto">
          {loadingData ? (
            <div className="flex justify-center py-20"><div className="spinner spinner-lg" /></div>
          ) : (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--slate-200)", boxShadow: "var(--shadow-sm)" }}
            >
              {/* Weekday headers */}
              <div className="grid grid-cols-7 bg-white" style={{ borderBottom: "1px solid var(--slate-200)" }}>
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="py-3 text-center font-bold text-xs tracking-wider"
                    style={{ color: d === "Sun" || d === "Sat" ? "var(--red-600)" : "var(--navy-700)" }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Date cells */}
              <div className="grid grid-cols-7 bg-white">
                {Array.from({ length: totalCells }, (_, i) => {
                  const dayNum  = i - firstDay + 1;
                  const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                  const dateStr = isValid ? `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}` : null;
                  const isToday = dateStr === todayStr;
                  const isWknd  = i % 7 === 0 || i % 7 === 6;
                  const entries = dateStr ? (meetingMap[dateStr] ?? []) : [];
                  const isLastRow = i >= totalCells - 7;
                  const isLastCol = i % 7 === 6;

                  return (
                    <div
                      key={i}
                      className="min-h-[100px] md:min-h-[120px] p-1.5 md:p-2"
                      style={{
                        background: !isValid ? "var(--slate-50)" : isToday ? "rgba(30,69,128,0.04)" : isWknd ? "rgba(255,241,241,0.5)" : "#fff",
                        borderRight:  isLastCol ? "none" : "1px solid var(--slate-100)",
                        borderBottom: isLastRow  ? "none" : "1px solid var(--slate-100)",
                      }}
                    >
                      {isValid && (
                        <>
                          {/* Date number */}
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold"
                              style={
                                isToday
                                  ? { background: "var(--gradient-btn-blue)", color: "#fff" }
                                  : { color: isWknd ? "var(--red-600)" : "var(--color-text-primary)" }
                              }
                            >
                              {dayNum}
                            </span>
                            {entries.length > 0 && (
                              <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded-full hidden md:inline"
                                style={{ background: "var(--navy-50)", color: "var(--navy-600)" }}
                              >
                                {entries.length}
                              </span>
                            )}
                          </div>

                          {/* Pill events */}
                          <div className="space-y-0.5">
                            {entries.slice(0, 3).map((entry, idx) => {
                              const pal = PILL_COLORS[idx % PILL_COLORS.length];
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setSelected(entry)}
                                  className="cal-pill"
                                  style={{ background: pal.bg, color: pal.text, border: `1px solid ${pal.border}` }}
                                  title={`${entry.customer.nickname} — ${entry.project_name} ${entry.meeting_time ? "· " + fmt12(entry.meeting_time) : ""}`}
                                >
                                  <span className="hidden md:inline">
                                    {entry.meeting_time && <span className="opacity-60 mr-1">{fmt12(entry.meeting_time)}</span>}
                                    {entry.customer.nickname}
                                  </span>
                                  <span className="md:hidden inline-block w-2 h-2 rounded-full" style={{ background: pal.text }} />
                                </button>
                              );
                            })}
                            {entries.length > 3 && (
                              <button
                                onClick={() => setSelected(entries[3])}
                                className="text-left w-full px-1.5 text-xs font-semibold"
                                style={{ color: "var(--navy-500)", fontSize: 10 }}
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
            <div className="mt-6">
              <h3 className="text-sm font-bold mb-3 px-1" style={{ fontFamily: "var(--font-display)", color: "var(--navy-900)" }}>
                Meetings in {MONTHS[month]}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {monthMeetings.map((entry, idx) => {
                  const pal    = PILL_COLORS[idx % PILL_COLORS.length];
                  const d      = new Date(entry.meeting_date + "T00:00:00");
                  const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelected(entry)}
                      className="text-left p-4 rounded-xl transition-all hover:scale-[1.02]"
                      style={{
                        background: "#fff",
                        border: `1.5px solid ${pal.border}`,
                        opacity: isPast ? 0.6 : 1,
                        boxShadow: "var(--shadow-xs)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-bold text-sm truncate" style={{ color: pal.text }}>
                          {entry.customer.nickname}
                        </span>
                        <span className="secret-code flex-shrink-0" style={{ borderColor: pal.border, color: pal.text, background: pal.bg }}>
                          {entry.customer.secret_code}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        📅 {d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                        {entry.meeting_time && <span className="ml-1.5 font-semibold" style={{ color: pal.text }}>· {fmt12(entry.meeting_time)}</span>}
                      </p>
                      {entry.project_name && (
                        <p className="text-xs mt-1 truncate" style={{ color: "var(--color-text-muted)" }}>🏠 {entry.project_name}</p>
                      )}
                      {isPast && <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--slate-100)", color: "var(--slate-400)" }}>Past</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!loadingData && monthMeetings.length === 0 && (
            <div className="text-center py-16">
              <p className="text-6xl mb-3">📭</p>
              <h3 className="text-base font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>No meetings in {MONTHS[month]}</h3>
              <p className="text-sm" style={{ color: "var(--color-text-hint)" }}>Schedule meetings from the Customer Dashboard</p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {selected && <MeetingModal entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}