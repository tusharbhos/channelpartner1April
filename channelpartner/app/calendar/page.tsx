// app/calendar/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CustomerAPI, Customer } from "@/lib/api";
import { fetchAllProjects, ApiProject, normalize } from "@/lib/conectr";

const WEEKDAYS_FULL  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const WEEKDAYS_SHORT = ["S","M","T","W","T","F","S"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
}

const PILL_COLORS = [
  { bg:"rgba(30,69,128,0.11)",  text:"#0f2240", border:"rgba(30,69,128,0.28)",  dot:"#1e4580" },
  { bg:"rgba(249,115,22,0.12)", text:"#7a3500", border:"rgba(249,115,22,0.32)", dot:"#f97316" },
  { bg:"rgba(8,145,178,0.11)",  text:"#044551", border:"rgba(8,145,178,0.28)",  dot:"#0891b2" },
  { bg:"rgba(147,51,234,0.1)",  text:"#4c1d95", border:"rgba(147,51,234,0.25)", dot:"#9333ea" },
  { bg:"rgba(22,163,74,0.11)",  text:"#14532d", border:"rgba(22,163,74,0.28)",  dot:"#16a34a" },
  { bg:"rgba(220,38,38,0.1)",   text:"#7f1d1d", border:"rgba(220,38,38,0.25)",  dot:"#dc2626" },
];

const TIME_SLOTS = Array.from({ length:29 }, (_,i) => {
  const mins = 7*60 + i*30;
  const h = Math.floor(mins/60), m = mins%60;
  const val = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  return { val, label: fmt12(val) };
});

interface MeetingEntry {
  customer:     Customer;
  meeting_date: string;
  meeting_time: string;
  project_name: string;
}

/* ─────────────── small reusables ─────────────── */
function StepBadge({ n }: { n: number }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      width:"1.3rem", height:"1.3rem", borderRadius:"50%",
      background:"linear-gradient(135deg,#1e4580,#0f2240)",
      color:"#fff", fontSize:"0.65rem", fontWeight:800, flexShrink:0,
    }}>{n}</span>
  );
}
function Spin() {
  return <div className="spinner" style={{ width:"0.9rem", height:"0.9rem", borderWidth:"2px" }}/>;
}
function InfoRow({ icon, label, val }: { icon:string; label:string; val:string }) {
  return (
    <div style={{ display:"flex", gap:"0.5rem", alignItems:"flex-start" }}>
      <span style={{ fontSize:"0.9rem", flexShrink:0, marginTop:1 }}>{icon}</span>
      <div style={{ minWidth:0 }}>
        <p style={{ fontSize:"0.68rem", color:"var(--color-text-muted)", fontWeight:600, margin:0 }}>{label}</p>
        <p style={{ fontSize:"0.85rem", fontWeight:500, margin:0, wordBreak:"break-word" }}>{val}</p>
      </div>
    </div>
  );
}

/* sheet overlay wrapper */
function SheetOverlay({ onClose, children }: { onClose:()=>void; children:React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:9999,
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        background:"rgba(6,14,26,0.72)",
        backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)",
        animation:"fadeInBg 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width:"100%", maxWidth:"30rem", maxHeight:"92vh",
          display:"flex", flexDirection:"column",
          background:"#fff",
          borderRadius:"20px 20px 0 0",
          boxShadow:"0 -8px 40px rgba(6,14,26,0.28)",
          overflow:"hidden",
          animation:"slideUpSheet 0.3s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* drag handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"10px 0 0" }}>
          <div style={{ width:40, height:4, borderRadius:2, background:"rgba(100,116,139,0.3)" }}/>
        </div>
        {children}
      </div>
      <style>{`
        @keyframes slideUpSheet { from{transform:translateY(100%);opacity:.6} to{transform:translateY(0);opacity:1} }
        @keyframes fadeInBg     { from{opacity:0} to{opacity:1} }
      `}</style>
    </div>
  );
}

function SheetHeader({ title, subtitle, onClose }: { title:string; subtitle?:string; onClose:()=>void }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0.85rem 1.2rem",
      background:"linear-gradient(135deg,#0a1628 0%,#163258 50%,#1e4580 100%)",
      flexShrink:0,
    }}>
      <div style={{ minWidth:0 }}>
        <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1rem", color:"#fff", margin:0 }}>{title}</p>
        {subtitle && <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.72)", margin:"3px 0 0" }}>{subtitle}</p>}
      </div>
      <button onClick={onClose} style={{
        width:"2rem", height:"2rem", borderRadius:"50%",
        background:"rgba(255,255,255,0.15)", border:"none", cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", flexShrink:0,
      }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ADD MEETING MODAL  — date is pre-filled
═══════════════════════════════════════════ */
function AddMeetingModal({ date, onClose, onAdded }: { date:string; onClose:()=>void; onAdded:()=>void }) {
  const [customers,   setCustomers]   = useState<Customer[]>([]);
  const [apiProjects, setApiProjects] = useState<ApiProject[]>([]);
  const [loadingC,    setLoadingC]    = useState(true);
  const [loadingP,    setLoadingP]    = useState(true);

  const [selCustomerId, setSelCustomerId] = useState<number|null>(null);
  const [selProject,    setSelProject]    = useState("");
  const [selTime,       setSelTime]       = useState("");
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");

  useEffect(() => {
    CustomerAPI.list().then((r)=>setCustomers(r.data)).catch(()=>{}).finally(()=>setLoadingC(false));
    fetchAllProjects().then(({projects})=>setApiProjects(projects)).catch(()=>{}).finally(()=>setLoadingP(false));
  }, []);

  const humanDate = new Date(date+"T00:00:00").toLocaleDateString("en-IN",{
    weekday:"long", day:"numeric", month:"long", year:"numeric",
  });

  const customer = customers.find((c) => c.id===selCustomerId);

  const handleSave = async () => {
    setError("");
    if (!selCustomerId) { setError("कृपया customer निवडा."); return; }
    if (!selProject)    { setError("कृपया project निवडा."); return; }
    if (!selTime)       { setError("कृपया वेळ निवडा."); return; }
    setSaving(true);
    try {
      await CustomerAPI.scheduleMeeting(selCustomerId, {
        meeting_date: date,
        meeting_time: selTime,
        project_name: selProject,
      });
      setSuccess("✓ Meeting scheduled!");
      setTimeout(() => { onAdded(); onClose(); }, 1200);
    } catch (e: unknown) {
      setError((e as { message?:string }).message ?? "Failed to schedule.");
    } finally { setSaving(false); }
  };

  return (
    <SheetOverlay onClose={onClose}>
      {/* Header with pre-filled date chip */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0.85rem 1.2rem",
        background:"linear-gradient(135deg,#0a1628 0%,#163258 50%,#1e4580 100%)",
        flexShrink:0,
      }}>
        <div>
          <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1rem", color:"#fff", margin:0 }}>
            ➕ Meeting Schedule करा
          </p>
          {/* DATE CHIP — prominent orange */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:5,
            marginTop:6, padding:"4px 12px", borderRadius:999,
            background:"rgba(249,115,22,0.28)", border:"1.5px solid rgba(249,115,22,0.55)",
          }}>
            <span style={{ fontSize:"0.8rem" }}>📅</span>
            <span style={{ fontSize:"0.8rem", fontWeight:800, color:"#fff" }}>{humanDate}</span>
          </div>
        </div>
        <button onClick={onClose} style={{
          width:"2rem", height:"2rem", borderRadius:"50%",
          background:"rgba(255,255,255,0.15)", border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", flexShrink:0,
        }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div style={{
        flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch",
        padding:"1rem 1.2rem",
        display:"flex", flexDirection:"column", gap:"1rem",
      }}>

        {error && (
          <div className="alert alert-danger" style={{ fontSize:"0.8rem" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ fontSize:"0.8rem" }}>{success}</div>
        )}

        {/* Step 1 — Customer */}
        <div>
          <label className="label" style={{ display:"flex", alignItems:"center", gap:6 }}>
            <StepBadge n={1}/> Customer निवडा <span style={{ color:"var(--red-600)" }}>*</span>
          </label>
          {loadingC ? (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0.6rem 0", color:"var(--color-text-muted)", fontSize:"0.82rem" }}>
              <Spin/> Loading customers…
            </div>
          ) : (
            <select
              value={selCustomerId ?? ""}
              onChange={(e) => { setSelCustomerId(Number(e.target.value)); setError(""); }}
              className="input-field"
              style={{ marginTop:"0.35rem" }}
            >
              <option value="">— Customer निवडा —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nickname}{c.name ? ` (${c.name})` : ""} · {c.secret_code}
                </option>
              ))}
            </select>
          )}
          {/* Verified chip */}
          {customer && (
            <div style={{
              display:"flex", alignItems:"center", gap:8,
              marginTop:6, padding:"0.55rem 0.85rem", borderRadius:"var(--radius-md)",
              background:"var(--navy-50)", border:"1px solid var(--navy-100)",
            }}>
              <span className="secret-code">{customer.secret_code}</span>
              <span style={{ marginLeft:"auto", fontSize:"0.72rem", fontWeight:700, color:"var(--green-600)" }}>✓ Verified</span>
            </div>
          )}
        </div>

        {/* Step 2 — Project */}
        <div>
          <label className="label" style={{ display:"flex", alignItems:"center", gap:6 }}>
            <StepBadge n={2}/> Project निवडा <span style={{ color:"var(--red-600)" }}>*</span>
          </label>
          {loadingP ? (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0.6rem 0", color:"var(--color-text-muted)", fontSize:"0.82rem" }}>
              <Spin/> Loading projects…
            </div>
          ) : (
            <select
              value={selProject}
              onChange={(e) => { setSelProject(e.target.value); setError(""); }}
              className="input-field"
              style={{ marginTop:"0.35rem" }}
            >
              <option value="">— Project निवडा —</option>
              {apiProjects.map((p) => (
                <option key={p.id} value={normalize(p.title)}>
                  {normalize(p.title)}{p.location ? ` — ${normalize(p.location)}` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step 3 — Time */}
        <div>
          <label className="label" style={{ display:"flex", alignItems:"center", gap:6 }}>
            <StepBadge n={3}/> वेळ निवडा <span style={{ color:"var(--red-600)" }}>*</span>
          </label>
          <p style={{ fontSize:"0.7rem", color:"var(--color-text-hint)", margin:"0 0 4px", fontWeight:500 }}>
            सकाळी 7 ते रात्री 9 · 30-मिनिट slots
          </p>
          <select
            value={selTime}
            onChange={(e) => { setSelTime(e.target.value); setError(""); }}
            className="input-field"
          >
            <option value="">— वेळ निवडा —</option>
            {TIME_SLOTS.map(({ val, label }) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Summary */}
        {selCustomerId && selProject && selTime && (
          <div style={{
            padding:"1rem", borderRadius:"var(--radius-lg)",
            background:"linear-gradient(135deg,rgba(249,115,22,0.09),rgba(30,69,128,0.06))",
            border:"1px solid rgba(249,115,22,0.28)",
            animation:"fadeIn 0.25s ease-out",
          }}>
            <p style={{ fontSize:"0.68rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--orange-700)", margin:"0 0 0.6rem" }}>
              📋 Meeting Summary
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {[
                { icon:"👤", label:"Customer", val:customer?.nickname ?? "" },
                { icon:"🏠", label:"Project",  val:selProject },
                { icon:"📅", label:"Date",     val:humanDate },
                { icon:"🕐", label:"Time",     val:fmt12(selTime) },
              ].map((row) => (
                <div key={row.label} style={{ display:"flex", gap:6, alignItems:"flex-start" }}>
                  <span style={{ fontSize:"0.85rem", flexShrink:0 }}>{row.icon}</span>
                  <p style={{ margin:0, fontSize:"0.82rem" }}>
                    <span style={{ color:"var(--color-text-muted)", fontWeight:600 }}>{row.label}: </span>
                    <span style={{ fontWeight:700, color:"var(--navy-900)" }}>{row.val}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display:"flex", gap:"0.65rem",
        padding:"0.85rem 1.2rem",
        paddingBottom:"calc(0.85rem + env(safe-area-inset-bottom))",
        borderTop:"1px solid var(--slate-100)", background:"#fff", flexShrink:0,
      }}>
        <button onClick={onClose} className="btn btn-ghost" style={{ flex:1 }}>Cancel</button>
        <button
          onClick={handleSave}
          disabled={saving || !selCustomerId || !selProject || !selTime}
          className="btn btn-primary"
          style={{ flex:1 }}
        >
          {saving ? <span style={{ display:"flex", alignItems:"center", gap:6 }}><Spin/> Saving…</span> : "Schedule Meeting →"}
        </button>
      </div>
    </SheetOverlay>
  );
}

/* ═══════════════════════════════════════════
   MEETING DETAIL MODAL
═══════════════════════════════════════════ */
function MeetingModal({ entry, onClose }: { entry:MeetingEntry; onClose:()=>void }) {
  const { customer } = entry;
  const STATUS_STYLE: Record<string,{bg:string;text:string;dot:string}> = {
    active:    { bg:"#dcfce7", text:"#16a34a", dot:"#16a34a" },
    inactive:  { bg:"#f1f5f9", text:"#64748b", dot:"#94a3b8" },
    converted: { bg:"#f3e8ff", text:"#9333ea", dot:"#9333ea" },
  };
  const sc = STATUS_STYLE[customer.status] ?? STATUS_STYLE.active;

  const sendWA = () => {
    if (!customer.phone) return;
    const msg = `Hello ${customer.name||customer.nickname},\n\nYour meeting for ${entry.project_name} is scheduled on ${entry.meeting_date} at ${fmt12(entry.meeting_time)}.\n\nRegards,\nChannelPartner.Network`;
    window.open(`https://wa.me/91${customer.phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };
  const sendEmail = () => {
    if (!customer.email) return;
    const subj = `Meeting Confirmation — ${entry.project_name}`;
    const body = `Dear ${customer.name||customer.nickname},\n\nProject: ${entry.project_name}\nDate: ${entry.meeting_date}\nTime: ${fmt12(entry.meeting_time)}\n\nRegards`;
    window.location.href = `mailto:${customer.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <SheetOverlay onClose={onClose}>
      <SheetHeader title={customer.nickname} subtitle={`Code: ${customer.secret_code}`} onClose={onClose}/>

      <div style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch", padding:"1rem 1.2rem", display:"flex", flexDirection:"column", gap:"0.85rem" }}>
        {/* status */}
        <span className="badge" style={{ background:sc.bg, color:sc.text }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:sc.dot }}/>
          {customer.status.charAt(0).toUpperCase()+customer.status.slice(1)}
        </span>

        {/* meeting info */}
        <div style={{
          display:"flex", alignItems:"center", gap:"0.75rem",
          padding:"0.85rem", borderRadius:"var(--radius-lg)",
          background:"linear-gradient(135deg,rgba(30,69,128,0.07),rgba(249,115,22,0.05))",
          border:"1px solid rgba(30,69,128,0.14)",
        }}>
          <div style={{
            width:42, height:42, borderRadius:"var(--radius-lg)", flexShrink:0,
            background:"linear-gradient(135deg,#1e4580,#0f2240)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize:"0.7rem", fontWeight:600, color:"var(--color-text-muted)", margin:"0 0 2px" }}>Meeting</p>
            <p style={{ fontSize:"0.85rem", fontWeight:700, color:"var(--navy-900)", margin:0 }}>
              {new Date(entry.meeting_date+"T00:00:00").toLocaleDateString("en-IN",{ weekday:"long", day:"numeric", month:"long", year:"numeric" })}
            </p>
            {entry.meeting_time && (
              <p style={{ fontSize:"0.85rem", fontWeight:700, color:"var(--orange-600)", margin:0 }}>🕐 {fmt12(entry.meeting_time)}</p>
            )}
          </div>
        </div>

        {entry.project_name && <InfoRow icon="🏠" label="Project" val={entry.project_name}/>}
        {customer.name      && <InfoRow icon="👤" label="Name"    val={customer.name}/>}
        {customer.phone     && <InfoRow icon="📞" label="Phone"   val={customer.phone}/>}
        {customer.email     && <InfoRow icon="✉️" label="Email"   val={customer.email}/>}
        {customer.address   && <InfoRow icon="📍" label="Address" val={customer.address}/>}
        {customer.notes     && (
          <div style={{ padding:"0.75rem", borderRadius:"var(--radius-md)", background:"var(--slate-50)", border:"1px solid var(--slate-200)", fontSize:"0.8rem", fontStyle:"italic", color:"var(--color-text-secondary)" }}>
            📝 "{customer.notes}"
          </div>
        )}

        {/* quick actions */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem" }}>
          <button onClick={sendWA} disabled={!customer.phone} className="btn"
            style={{ background:customer.phone?"#25d366":"#94a3b8", color:"#fff", fontSize:"0.78rem", opacity:customer.phone?1:0.5 }}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.48 2 2 6.48 2 12c0 2.108.576 4.082 1.579 5.79L2 22l4.21-1.579A9.93 9.93 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
            </svg>
            WhatsApp
          </button>
          <button onClick={sendEmail} disabled={!customer.email} className="btn"
            style={{ background:customer.email?"#ea4335":"#94a3b8", color:"#fff", fontSize:"0.78rem", opacity:customer.email?1:0.5 }}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Email
          </button>
        </div>
      </div>

      <div style={{ padding:"0.85rem 1.2rem", paddingBottom:"calc(0.85rem + env(safe-area-inset-bottom))", borderTop:"1px solid var(--slate-100)", background:"#fff", flexShrink:0 }}>
        <button onClick={onClose} className="btn btn-primary" style={{ width:"100%" }}>Close</button>
      </div>
    </SheetOverlay>
  );
}

/* ═══════════════════════════════════════════
   MAIN CALENDAR PAGE
═══════════════════════════════════════════ */
export default function CalendarPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const today  = new Date();

  const [year,        setYear]        = useState(today.getFullYear());
  const [month,       setMonth]       = useState(today.getMonth());
  const [customers,   setCustomers]   = useState<Customer[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const [selectedEntry, setSelectedEntry] = useState<MeetingEntry|null>(null);
  const [addDate,       setAddDate]       = useState<string|null>(null);

  useEffect(() => { if (!isLoading && !isAuthenticated) router.replace("/login"); }, [isAuthenticated,isLoading,router]);

  const fetchCustomers = useCallback(async () => {
    try { setLoadingData(true); const r = await CustomerAPI.list(); setCustomers(r.data); }
    catch { /**/ } finally { setLoadingData(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchCustomers(); }, [isAuthenticated, fetchCustomers, refreshTick]);

  const prevMonth = () => month===0  ? (setMonth(11),setYear(y=>y-1)) : setMonth(m=>m-1);
  const nextMonth = () => month===11 ? (setMonth(0), setYear(y=>y+1)) : setMonth(m=>m+1);
  const goToday   = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const allMeetings = useMemo<MeetingEntry[]>(() => {
    const out: MeetingEntry[] = [];
    customers.forEach((c) => {
      if (c.projects?.length) {
        c.projects.forEach((p) => out.push({ customer:c, meeting_date:p.meeting_date, meeting_time:p.meeting_time??"", project_name:p.project_name }));
      } else if (c.meeting_date) {
        out.push({ customer:c, meeting_date:c.meeting_date, meeting_time:c.meeting_time??"", project_name:c.project_name??"" });
      }
    });
    return out;
  }, [customers]);

  const meetingMap = useMemo(() => {
    const map: Record<string, MeetingEntry[]> = {};
    allMeetings.forEach((e) => {
      const k = e.meeting_date.slice(0,10);
      if (!map[k]) map[k] = [];
      map[k].push(e);
    });
    Object.values(map).forEach((arr) => arr.sort((a,b) => a.meeting_time.localeCompare(b.meeting_time)));
    return map;
  }, [allMeetings]);

  const monthMeetings = useMemo(() =>
    allMeetings
      .filter((e) => { const d = new Date(e.meeting_date+"T00:00:00"); return d.getFullYear()===year && d.getMonth()===month; })
      .sort((a,b) => (a.meeting_date+a.meeting_time).localeCompare(b.meeting_date+b.meeting_time)),
  [allMeetings, year, month]);

  const daysInMonth = new Date(year,month+1,0).getDate();
  const firstDay    = new Date(year,month,1).getDay();
  const totalCells  = Math.ceil((firstDay+daysInMonth)/7)*7;
  const todayStr    = today.toISOString().split("T")[0];
  const makeDate    = (d:number) => `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  if (isLoading) return <div className="page-loader"><div className="spinner spinner-lg"/></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background:"var(--color-bg)" }}>
      <Header variant="app"/>

      <main className="flex-1" style={{ paddingTop:"var(--header-height)" }}>

        {/* Banner */}
        <div className="px-4 md:px-8 py-4 md:py-5" style={{ background:"var(--gradient-header)" }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="page-banner-sub">Meeting Schedule</p>
              <h2 className="page-banner-title">📅 Calendar</h2>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"1.25rem" }}>
              <div className="text-center"><p className="banner-stat-val">{monthMeetings.length}</p><p className="banner-stat-label">This Month</p></div>
              <div style={{ width:1, height:36, background:"rgba(255,255,255,0.18)" }}/>
              <div className="text-center"><p className="banner-stat-val">{allMeetings.length}</p><p className="banner-stat-label">Total</p></div>
            </div>
          </div>
        </div>

        {/* Month nav */}
        <div className="px-3 md:px-8 py-2.5 bg-white sticky z-10" style={{ top:"var(--header-height)", borderBottom:"1px solid var(--slate-200)", boxShadow:"0 2px 8px rgba(10,22,40,0.06)" }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <button onClick={prevMonth} className="btn btn-ghost" style={{ padding:"0.5rem 0.75rem" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
              <h3 style={{ fontFamily:"var(--font-display)", color:"var(--navy-900)", fontWeight:700, fontSize:"clamp(0.95rem,3vw,1.1rem)", margin:0 }}>
                {MONTHS[month]} {year}
              </h3>
              {(year!==today.getFullYear()||month!==today.getMonth()) && (
                <button onClick={goToday} style={{ fontSize:"0.72rem", fontWeight:700, padding:"2px 10px", borderRadius:999, background:"var(--navy-50)", color:"var(--navy-600)", border:"1px solid var(--navy-100)", cursor:"pointer" }}>
                  Today
                </button>
              )}
            </div>
            <button onClick={nextMonth} className="btn btn-ghost" style={{ padding:"0.5rem 0.75rem" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        {/* Hint strip */}
        <div style={{ background:"linear-gradient(90deg,rgba(30,69,128,0.06),rgba(249,115,22,0.06))", borderBottom:"1px solid var(--slate-100)", padding:"0.45rem 1rem", textAlign:"center" }}>
          <p style={{ fontSize:"0.7rem", color:"var(--navy-600)", fontWeight:600, margin:0 }}>
            📅 तारखेवर click करा → Meeting add करा &nbsp;|&nbsp; 🟦 Meeting वर click करा → Details पाहा
          </p>
        </div>

        {/* Grid */}
        <div className="px-2 sm:px-4 md:px-6 py-3 md:py-4 max-w-7xl mx-auto">
          {loadingData ? (
            <div style={{ display:"flex", justifyContent:"center", padding:"5rem 0" }}><div className="spinner spinner-lg"/></div>
          ) : (
            <div style={{ borderRadius:"var(--radius-xl)", border:"1px solid var(--slate-200)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>

              {/* Weekday row */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"#fff", borderBottom:"1px solid var(--slate-200)" }}>
                {WEEKDAYS_FULL.map((d,i) => (
                  <div key={d} className="cal-weekday" style={{ color:i===0||i===6?"var(--red-600)":"var(--navy-700)" }}>
                    <span className="md:hidden">{WEEKDAYS_SHORT[i]}</span>
                    <span className="hidden md:inline">{d}</span>
                  </div>
                ))}
              </div>

              {/* Date cells */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"#fff" }}>
                {Array.from({ length:totalCells }, (_,i) => {
                  const dayNum  = i - firstDay + 1;
                  const isValid = dayNum>=1 && dayNum<=daysInMonth;
                  const dateStr = isValid ? makeDate(dayNum) : null;
                  const isToday = dateStr===todayStr;
                  const isWknd  = i%7===0 || i%7===6;
                  const entries = dateStr ? (meetingMap[dateStr]??[]) : [];
                  const isPast  = dateStr ? dateStr < todayStr : false;
                  const isLastRow = i>=totalCells-7;
                  const isLastCol = i%7===6;

                  return (
                    <div
                      key={i}
                      className="cal-cell"
                      onClick={() => { if (isValid && dateStr) setAddDate(dateStr); }}
                      title={isValid ? `${MONTHS[month]} ${dayNum} — click to add meeting` : undefined}
                      style={{
                        background: !isValid ? "var(--slate-50)" : isToday ? "rgba(30,69,128,0.05)" : isWknd ? "rgba(255,241,241,0.45)" : "#fff",
                        borderRight:  isLastCol ? "none" : "1px solid var(--slate-100)",
                        borderBottom: isLastRow  ? "none" : "1px solid var(--slate-100)",
                        cursor: isValid ? "pointer" : "default",
                        transition:"background 0.15s",
                        position:"relative",
                      }}
                    >
                      {isValid && (
                        <>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                            {/* Day number */}
                            <span className="cal-day-num" style={
                              isToday
                                ? { background:"linear-gradient(135deg,#1e4580,#0f2240)", color:"#fff" }
                                : { color: isWknd ? "var(--red-600)" : "var(--color-text-primary)" }
                            }>
                              {dayNum}
                            </span>

                            {/* Count OR + icon */}
                            {entries.length>0 ? (
                              <span className="hidden sm:flex items-center justify-center" style={{
                                minWidth:"1.15rem", height:"1.15rem", borderRadius:999, padding:"0 3px",
                                background:"linear-gradient(135deg,#1e4580,#0f2240)",
                                color:"#fff", fontSize:"0.58rem", fontWeight:800,
                              }}>
                                {entries.length}
                              </span>
                            ) : !isPast ? (
                              <span className="hidden sm:flex items-center justify-center" style={{
                                width:"1.15rem", height:"1.15rem", borderRadius:"50%",
                                background:"rgba(30,69,128,0.08)", color:"var(--navy-400)",
                                fontSize:"0.8rem", fontWeight:900,
                              }}>
                                +
                              </span>
                            ) : null}
                          </div>

                          {/* Mobile dots */}
                          <div className="sm:hidden" style={{ display:"flex", flexWrap:"wrap", gap:2 }}>
                            {entries.slice(0,4).map((entry,idx) => {
                              const pal = PILL_COLORS[idx%PILL_COLORS.length];
                              return (
                                <button key={idx} className="cal-dot"
                                  onClick={(e) => { e.stopPropagation(); setSelectedEntry(entry); }}
                                  style={{ background:pal.dot, border:`1.5px solid ${pal.border}` }}
                                  title={entry.customer.nickname}
                                />
                              );
                            })}
                            {/* tiny + on mobile for empty future */}
                            {entries.length===0 && !isPast && (
                              <span style={{ fontSize:"9px", color:"rgba(30,69,128,0.25)", fontWeight:900, lineHeight:1, marginTop:2 }}>+</span>
                            )}
                          </div>

                          {/* Desktop pills */}
                          <div className="hidden sm:flex flex-col" style={{ gap:2 }}>
                            {entries.slice(0,3).map((entry,idx) => {
                              const pal = PILL_COLORS[idx%PILL_COLORS.length];
                              return (
                                <button key={idx} className="cal-pill"
                                  onClick={(e) => { e.stopPropagation(); setSelectedEntry(entry); }}
                                  style={{ background:pal.bg, color:pal.text, border:`1px solid ${pal.border}` }}
                                  title={`${entry.customer.nickname} — ${entry.project_name}`}
                                >
                                  <span className="hidden md:inline" style={{ opacity:0.6, marginRight:3, fontSize:"9px" }}>
                                    {entry.meeting_time && fmt12(entry.meeting_time)}
                                  </span>
                                  {entry.customer.nickname}
                                </button>
                              );
                            })}
                            {entries.length>3 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedEntry(entries[3]); }}
                                style={{ color:"var(--navy-500)", fontSize:10, textAlign:"left", paddingLeft:4, fontWeight:600, background:"none", border:"none", cursor:"pointer" }}
                              >
                                +{entries.length-3} more
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

          {/* Month list */}
          {monthMeetings.length>0 && (
            <div style={{ marginTop:"1.5rem" }}>
              <h3 style={{ fontFamily:"var(--font-display)", color:"var(--navy-900)", fontWeight:700, fontSize:"0.9rem", marginBottom:"0.75rem", padding:"0 4px" }}>
                Meetings in {MONTHS[month]}
              </h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,260px),1fr))", gap:"0.6rem" }}>
                {monthMeetings.map((entry,idx) => {
                  const pal    = PILL_COLORS[idx%PILL_COLORS.length];
                  const d      = new Date(entry.meeting_date+"T00:00:00");
                  const isPast = d < new Date(today.getFullYear(),today.getMonth(),today.getDate());
                  return (
                    <button key={idx} onClick={() => setSelectedEntry(entry)} style={{
                      textAlign:"left", padding:"0.85rem 1rem", borderRadius:"var(--radius-lg)",
                      background:"#fff", border:`1.5px solid ${pal.border}`,
                      opacity:isPast?0.6:1, boxShadow:"var(--shadow-xs)", cursor:"pointer",
                      transition:"transform 0.18s,box-shadow 0.18s",
                    }}
                      onMouseEnter={(e) => { const t=e.currentTarget; t.style.transform="translateY(-2px)"; t.style.boxShadow="var(--shadow-md)"; }}
                      onMouseLeave={(e) => { const t=e.currentTarget; t.style.transform="none"; t.style.boxShadow="var(--shadow-xs)"; }}
                    >
                      <div style={{ display:"flex", justifyContent:"space-between", gap:6, marginBottom:4 }}>
                        <span style={{ fontWeight:700, fontSize:"0.85rem", color:pal.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.customer.nickname}</span>
                        <span className="secret-code" style={{ flexShrink:0, borderColor:pal.border, color:pal.text, background:pal.bg }}>{entry.customer.secret_code}</span>
                      </div>
                      <p style={{ fontSize:"0.75rem", color:"var(--color-text-muted)", margin:0 }}>
                        📅 {d.toLocaleDateString("en-IN",{ weekday:"short", day:"numeric", month:"short" })}
                        {entry.meeting_time && <span style={{ marginLeft:6, fontWeight:700, color:pal.text }}>· {fmt12(entry.meeting_time)}</span>}
                      </p>
                      {entry.project_name && <p style={{ fontSize:"0.75rem", color:"var(--color-text-muted)", margin:"3px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>🏠 {entry.project_name}</p>}
                      {isPast && <span style={{ display:"inline-block", marginTop:5, fontSize:"0.68rem", padding:"1px 8px", borderRadius:999, background:"var(--slate-100)", color:"var(--slate-400)" }}>Past</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!loadingData && monthMeetings.length===0 && (
            <div style={{ textAlign:"center", padding:"4rem 1rem" }}>
              <p style={{ fontSize:"3.5rem", marginBottom:"0.75rem" }}>📭</p>
              <h3 style={{ fontSize:"1rem", fontWeight:700, color:"var(--color-text-muted)", marginBottom:"0.4rem" }}>No meetings in {MONTHS[month]}</h3>
              <p style={{ fontSize:"0.85rem", color:"var(--color-text-hint)", marginBottom:"1.25rem" }}>Calendar वर कोणत्याही तारखेवर click करा</p>
              <button onClick={() => setAddDate(todayStr)} className="btn btn-primary">+ Add Meeting Today</button>
            </div>
          )}
        </div>
      </main>

      <Footer/>

      {/* Modals */}
      {selectedEntry && <MeetingModal entry={selectedEntry} onClose={() => setSelectedEntry(null)}/>}
      {addDate && (
        <AddMeetingModal
          date={addDate}
          onClose={() => setAddDate(null)}
          onAdded={() => { setAddDate(null); setRefreshTick(t=>t+1); }}
        />
      )}
    </div>
  );
}