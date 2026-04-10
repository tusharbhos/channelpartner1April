// app/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddCustomerModal from "@/components/AddCustomerModal";
import EditCustomerModal from "@/components/EditCustomerModal";
import ViewCustomerModal from "@/components/ViewCustomerModal";
import {
  CustomerAPI,
  Customer,
  CustomerProjectLink,
  CustomerProjectLinkAPI,
  LinkedProjectCard,
  ProjectMeeting,
} from "@/lib/api";

function safeProjects(projects: unknown): ProjectMeeting[] {
  return Array.isArray(projects) ? (projects as ProjectMeeting[]) : [];
}

// ── Sub-components ─────────────────────────────────────────────
function StatusBadge({ status }: { status: Customer["status"] }) {
  const MAP = {
    active: "badge badge-active",
    inactive: "badge badge-inactive",
    Booked: "badge badge-Booked",
  };
  const LABELS = {
    active: "Active",
    inactive: "Inactive",
    Booked: "Booked",
  };
  return <span className={MAP[status] ?? MAP.active}>{LABELS[status]}</span>;
}

function MeetingStats({ projects }: { projects?: unknown }) {
  const list = safeProjects(projects);
  const today = new Date().toISOString().split("T")[0];
  const upcoming = list.filter((p) => p.meeting_date >= today).length;
  const done = list.filter((p) => p.meeting_date < today).length;
  if (!list.length)
    return <span style={{ color: "var(--color-text-hint)" }}>—</span>;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {upcoming > 0 && (
        <span
          className="badge"
          style={{
            background: "var(--orange-100)",
            color: "var(--orange-700)",
            fontSize: "0.63rem",
          }}
        >
          ⏰ {upcoming} upcoming
        </span>
      )}
      {done > 0 && (
        <span className="badge badge-active" style={{ fontSize: "0.63rem" }}>
          ✅ {done} done
        </span>
      )}
    </div>
  );
}

function ProjectsCell({ projects }: { projects?: unknown }) {
  const list = safeProjects(projects);
  const today = new Date().toISOString().split("T")[0];
  const upcoming = list.filter((p) => p.meeting_date >= today);
  const done = list.filter((p) => p.meeting_date < today);
  if (!list.length)
    return <span style={{ color: "var(--color-text-hint)" }}>—</span>;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        maxWidth: "220px",
      }}
    >
      {upcoming.slice(0, 2).map((p, i) => (
        <div
          key={i}
          className="text-xs px-1.5 py-1 rounded-md"
          style={{
            background: "var(--orange-50)",
            color: "var(--orange-700)",
            border: "1px solid var(--orange-100)",
          }}
        >
          <div className="truncate">
            <span className="font-semibold">{p.project_name}</span>
            <span className="opacity-70 ml-1" style={{ fontSize: "10px" }}>
              {p.meeting_date}
            </span>
          </div>
          {(p.created_by_name || p.assigned_to_user_name) && (
            <div
              className="truncate"
              style={{ fontSize: "10px", color: "var(--color-text-muted)" }}
            >
              {p.created_by_name ? `By: ${p.created_by_name}` : ""}
              {p.created_by_name && p.assigned_to_user_name ? " • " : ""}
              {p.assigned_to_user_name ? `To: ${p.assigned_to_user_name}` : ""}
            </div>
          )}
        </div>
      ))}
      {done.slice(0, 1).map((p, i) => (
        <div
          key={i}
          className="text-xs px-1.5 py-1 rounded-md truncate line-through"
          style={{
            background: "var(--slate-50)",
            color: "var(--color-text-hint)",
          }}
        >
          {p.project_name}
        </div>
      ))}
      {list.length > 3 && (
        <span className="text-xs" style={{ color: "var(--navy-500)" }}>
          +{list.length - 3} more
        </span>
      )}
    </div>
  );
}

function IconEye() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function IconUserCard() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10a2 2 0 104 0 2 2 0 00-4 0zm8 5a3 3 0 00-6 0"
      />
    </svg>
  );
}

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const mins = 7 * 60 + i * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const val = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return { val, label: fmt12(val) };
});

const DATE_OPTIONS = Array.from({ length: 60 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  const val = d.toISOString().split("T")[0];
  const label = d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return { val, label };
});

function LinkPreviewModal({
  customer,
  links,
  loading,
  onCustomerUpdated,
  onClose,
}: {
  customer: Customer | null;
  links: CustomerProjectLink[];
  loading: boolean;
  onCustomerUpdated?: (customer: Customer) => void;
  onClose: () => void;
}) {
  if (!customer) return null;

  const latestLink = links[0] ?? null;
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [schedulingKey, setSchedulingKey] = useState("");
  const [scheduleMsg, setScheduleMsg] = useState("");
  const [scheduleErr, setScheduleErr] = useState("");
  const [schedulePopup, setSchedulePopup] = useState<{
    project: LinkedProjectCard;
    idx: number;
    meetingDate: string;
    meetingTime: string;
  } | null>(null);

  useEffect(() => {
    setRecipientPhone((customer.phone || "").replace(/\D/g, ""));
    setRecipientEmail((customer.email || "").trim());
  }, [customer.id, customer.phone, customer.email]);

  const publicLink = latestLink
    ? CustomerProjectLinkAPI.publicUrl(latestLink.public_token)
    : "";
  const customerPhone = recipientPhone.replace(/\D/g, "");
  const customerEmail = recipientEmail.trim();
  const hasEmail = customerEmail.length > 0;
  const shareText = `Hi ${customer.name || customer.nickname || "Customer"}, here is your project link:\n${publicLink}`;

  const openSchedulePopup = (project: LinkedProjectCard, idx: number) => {
    setScheduleErr("");
    setScheduleMsg("");
    setSchedulePopup({
      project,
      idx,
      meetingDate: project.meeting_date || "",
      meetingTime: project.meeting_time || "",
    });
  };

  const submitScheduleMeeting = async () => {
    if (!schedulePopup) return;

    const { project, idx, meetingDate, meetingTime } = schedulePopup;
    const projectName = (project.title || "").trim();
    if (!projectName) {
      setScheduleErr("Project name missing. Cannot schedule meeting.");
      return;
    }
    if (!meetingDate || !meetingTime) {
      setScheduleErr(
        "Date and time are required on liked project to schedule.",
      );
      return;
    }

    const rowKey = `${projectName}-${idx}`;
    setSchedulingKey(rowKey);
    setScheduleErr("");
    setScheduleMsg("");

    try {
      const existingMeeting = safeProjects(customer.projects).find(
        (p) => p.project_name === projectName,
      );

      const res = existingMeeting
        ? await CustomerAPI.updateProjectMeeting(customer.id, projectName, {
            meeting_date: meetingDate,
            meeting_time: meetingTime,
          })
        : await CustomerAPI.scheduleMeeting(customer.id, {
            project_name: projectName,
            meeting_date: meetingDate,
            meeting_time: meetingTime,
          });

      if (res?.data && onCustomerUpdated) {
        onCustomerUpdated(res.data);
      }
      setScheduleMsg(
        existingMeeting
          ? `Meeting updated for ${projectName}.`
          : `Meeting scheduled for ${projectName}.`,
      );
      setSchedulePopup(null);
    } catch (e: unknown) {
      setScheduleErr(
        (e as { message?: string }).message || "Failed to schedule meeting.",
      );
    } finally {
      setSchedulingKey("");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: "72rem", width: "min(72rem, calc(100% - 1.2rem))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="modal-title">Customer Project Link Preview</p>
            <p className="modal-subtitle">
              {customer.nickname} ({customer.secret_code})
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="spinner spinner-lg" />
            </div>
          ) : !latestLink ? (
            <div className="alert alert-info">
              No project link sent for this customer yet.
            </div>
          ) : (
            <>
              {scheduleErr && !schedulePopup && (
                <div className="alert alert-danger mb-3">{scheduleErr}</div>
              )}
              {scheduleMsg && (
                <div className="alert alert-success mb-3">{scheduleMsg}</div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div
                  className="card p-3"
                  style={{ borderRadius: "var(--radius-lg)" }}
                >
                  <p
                    className="text-xs font-bold"
                    style={{ color: "var(--navy-700)" }}
                  >
                    Customer Card
                  </p>
                  <p
                    className="font-bold mt-2"
                    style={{ color: "var(--navy-900)" }}
                  >
                    {customer.name || customer.nickname}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Nickname: {customer.nickname}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Code: {customer.secret_code}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Phone: {customer.phone || "-"}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Email: {customer.email || "-"}
                  </p>
                </div>

                <div
                  className="card p-3 lg:col-span-2"
                  style={{ borderRadius: "var(--radius-lg)" }}
                >
                  <p
                    className="text-xs font-bold"
                    style={{ color: "var(--navy-700)" }}
                  >
                    Public Link
                  </p>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <input
                      className="input-field"
                      readOnly
                      title="Public customer link"
                      aria-label="Public customer link"
                      value={publicLink}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => navigator.clipboard.writeText(publicLink)}
                    >
                      Copy
                    </button>
                    <button
                      className="btn btn-gold"
                      onClick={() => window.open(publicLink, "_blank")}
                    >
                      Open
                    </button>
                    <button
                      className="btn"
                      style={{
                        background: "#16a34a",
                        color: "#fff",
                        opacity: customerPhone ? 1 : 0.6,
                        cursor: customerPhone ? "pointer" : "not-allowed",
                      }}
                      disabled={!customerPhone}
                      onClick={() => {
                        if (!customerPhone) return;
                        const whatsappUrl = `https://wa.me/91${customerPhone}?text=${encodeURIComponent(shareText)}`;
                        window.open(whatsappUrl, "_blank");
                      }}
                    >
                      WhatsApp
                    </button>
                    <button
                      className="btn"
                      style={{
                        background: "#ea580c",
                        color: "#fff",
                        opacity: hasEmail ? 1 : 0.6,
                        cursor: hasEmail ? "pointer" : "not-allowed",
                      }}
                      disabled={!hasEmail}
                      onClick={() => {
                        if (!hasEmail) return;
                        const subject = "Your Project Link";
                        const body = `${shareText}\n\nRegards`;
                        const mailUrl = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                        window.location.href = mailUrl;
                      }}
                    >
                      Email
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label
                        className="text-xs font-bold"
                        style={{ color: "var(--navy-700)" }}
                      >
                        WhatsApp Number
                      </label>
                      <input
                        className="input-field mt-1"
                        type="tel"
                        placeholder="Enter phone number"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label
                        className="text-xs font-bold"
                        style={{ color: "var(--navy-700)" }}
                      >
                        Email Address
                      </label>
                      <input
                        className="input-field mt-1"
                        type="email"
                        placeholder="Enter email address"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <p
                    className="text-xs font-bold mb-2"
                    style={{ color: "var(--navy-700)" }}
                  >
                    Left Side: Added Project Cards
                  </p>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {(latestLink.selected_projects || []).map(
                      (project, idx) => (
                        <div
                          key={`${project.title}-${idx}`}
                          className="card p-3"
                          style={{ borderRadius: "var(--radius-md)" }}
                        >
                          <p
                            className="font-bold text-sm"
                            style={{ color: "var(--navy-900)" }}
                          >
                            {project.title}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {project.developer || "-"}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--color-text-hint)" }}
                          >
                            {project.location || "-"}
                          </p>
                          <p
                            className="text-sm font-semibold mt-1"
                            style={{ color: "var(--orange-600)" }}
                          >
                            {project.price || "-"}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <p
                    className="text-xs font-bold mb-2"
                    style={{ color: "var(--green-700)" }}
                  >
                    Right Side: Customer Liked Cards
                  </p>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {(latestLink.liked_projects || []).length > 0 ? (
                      (latestLink.liked_projects || []).map((project, idx) => {
                        const projectName = (project.title || "").trim();
                        const rowKey = `${project.title}-${idx}`;
                        const isAlreadyScheduled = safeProjects(
                          customer.projects,
                        ).some(
                          (p) =>
                            (p.project_name || "").trim().toLowerCase() ===
                            projectName.toLowerCase(),
                        );

                        const canSchedule =
                          Boolean(
                            project.meeting_date && project.meeting_time,
                          ) &&
                          !isAlreadyScheduled &&
                          schedulingKey !== rowKey;

                        return (
                          <div
                            key={rowKey}
                            className="card p-3"
                            style={{
                              borderRadius: "var(--radius-md)",
                              border: "1px solid #86efac",
                              background: "#f0fdf4",
                            }}
                          >
                            <p
                              className="font-bold text-sm"
                              style={{ color: "#166534" }}
                            >
                              {project.title}
                            </p>
                            <p className="text-xs" style={{ color: "#15803d" }}>
                              {project.developer || "-"}
                            </p>
                            <p className="text-xs" style={{ color: "#166534" }}>
                              {project.location || "-"}
                            </p>
                            <p
                              className="text-sm font-semibold mt-1"
                              style={{ color: "#15803d" }}
                            >
                              {project.price || "-"}
                            </p>
                            {(project.meeting_date || project.meeting_time) && (
                              <p
                                className="text-xs font-semibold mt-1"
                                style={{ color: "#166534" }}
                              >
                                Visit: {project.meeting_date || "-"}
                                {project.meeting_time
                                  ? ` at ${project.meeting_time}`
                                  : ""}
                              </p>
                            )}
                            <button
                              className="btn btn-primary mt-2"
                              style={{
                                width: "100%",
                                opacity: canSchedule ? 1 : 0.65,
                                cursor: canSchedule ? "pointer" : "not-allowed",
                                background: isAlreadyScheduled
                                  ? "#16a34a"
                                  : undefined,
                              }}
                              disabled={!canSchedule}
                              onClick={() => openSchedulePopup(project, idx)}
                            >
                              {schedulingKey === rowKey
                                ? "Scheduling..."
                                : isAlreadyScheduled
                                  ? "Meeting Scheduled"
                                  : "Schedule Meeting"}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div
                        className="card p-3 text-sm"
                        style={{ color: "var(--color-text-hint)" }}
                      >
                        Customer has not liked any project yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {schedulePopup && (
          <div
            className="modal-overlay"
            onClick={(e) => {
              e.stopPropagation();
              setSchedulePopup(null);
            }}
          >
            <div
              className="modal-box"
              style={{
                maxWidth: "32rem",
                width: "min(32rem, calc(100% - 1.2rem))",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <p className="modal-title">Schedule Meeting</p>
                  <p className="modal-subtitle">Confirm meeting details</p>
                </div>
                <button
                  className="modal-close"
                  onClick={() => setSchedulePopup(null)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                {scheduleErr && (
                  <div className="alert alert-danger mb-3">{scheduleErr}</div>
                )}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="label">Customer Code</label>
                    <input
                      className="input-field"
                      value={customer.secret_code}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="label">Project Name</label>
                    <input
                      className="input-field"
                      value={schedulePopup.project.title || ""}
                      readOnly
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Meeting Date</label>
                      <select
                        className="input-field"
                        value={schedulePopup.meetingDate}
                        onChange={(e) =>
                          setSchedulePopup((prev) =>
                            prev
                              ? { ...prev, meetingDate: e.target.value }
                              : prev,
                          )
                        }
                      >
                        <option value="">— Select a date —</option>
                        {DATE_OPTIONS.map(({ val, label }) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">
                        Meeting Time{" "}
                        <span
                          className="text-gray-400"
                          style={{ fontSize: "0.7rem" }}
                        >
                          (30-min slots)
                        </span>
                      </label>
                      <select
                        className="input-field"
                        value={schedulePopup.meetingTime}
                        onChange={(e) =>
                          setSchedulePopup((prev) =>
                            prev
                              ? { ...prev, meetingTime: e.target.value }
                              : prev,
                          )
                        }
                      >
                        <option value="">— Select a time —</option>
                        {TIME_SLOTS.map(({ val, label }) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-ghost"
                  onClick={() => setSchedulePopup(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-gold"
                  disabled={
                    schedulingKey ===
                    `${schedulePopup.project.title}-${schedulePopup.idx}`
                  }
                  onClick={submitScheduleMeeting}
                >
                  {schedulingKey ===
                  `${schedulePopup.project.title}-${schedulePopup.idx}`
                    ? "Scheduling..."
                    : "Schedule Meeting"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [linkModalCustomer, setLinkModalCustomer] = useState<Customer | null>(
    null,
  );
  const [linkRows, setLinkRows] = useState<CustomerProjectLink[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/");
  }, [isAuthenticated, isLoading, router]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoadingData(true);
      setError("");
      const res = await CustomerAPI.list();
      setCustomers(
        res.data.map((c) => ({ ...c, projects: safeProjects(c.projects) })),
      );
    } catch (e: unknown) {
      setError(
        (e as { message?: string }).message ?? "Failed to load customers.",
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchCustomers();
  }, [isAuthenticated, fetchCustomers]);

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await CustomerAPI.delete(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setDeleteId(null);
    } catch {
      alert("Failed to archive customer.");
    } finally {
      setDeleting(false);
    }
  };

  const openLinkPreview = async (customer: Customer) => {
    setLinkModalCustomer(customer);
    setLinkLoading(true);
    try {
      const res = await CustomerProjectLinkAPI.byCustomer(customer.id);
      setLinkRows(res.data || []);
    } catch {
      setLinkRows([]);
    } finally {
      setLinkLoading(false);
    }
  };

  const normalise = (c: Customer) => ({
    ...c,
    projects: safeProjects(c.projects),
  });

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.nickname.toLowerCase().includes(q) ||
      c.secret_code.toLowerCase().includes(q) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const today = new Date().toISOString().split("T")[0];
  const totalMeetings = customers.reduce(
    (s, c) => s + safeProjects(c.projects).length,
    0,
  );
  const upcomingTotal = customers.reduce(
    (s, c) =>
      s +
      safeProjects(c.projects).filter((p) => p.meeting_date >= today).length,
    0,
  );

  if (isLoading)
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  if (!isAuthenticated) return null;
  const isAdmin = user?.role === "admin";
  const canSeeCreatedBy = isAdmin || Boolean(user?.is_company_owner);

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="app" />

      <main className="flex-1" style={{ paddingTop: "var(--header-height)" }}>
        {/* ── Banner ── */}
        <div
          className="px-4 md:px-8 py-4 md:py-5"
          style={{ background: "var(--gradient-header)" }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="page-banner-sub">
                {isAdmin ? "Admin View — All Users" : "My Customers"}
              </p>
              <h2 className="page-banner-title">Customer Dashboard</h2>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="btn btn-gold gap-2 text-sm"
            >
              <svg
                className="w-4 h-4 shrink-0"
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
              Add Customer
            </button>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="stats-bar">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="stats-scroll">
              {[
                {
                  val: customers.length,
                  label: "Customers",
                  color: "var(--navy-700)",
                },
                {
                  val: customers.filter((c) => c.status === "active").length,
                  label: "Active",
                  color: "var(--green-600)",
                },
                {
                  val: customers.filter((c) => c.status === "Booked").length,
                  label: "Booked",
                  color: "var(--purple-600)",
                },
                {
                  val: totalMeetings,
                  label: "Meetings",
                  color: "var(--orange-600)",
                },
                {
                  val: upcomingTotal,
                  label: "Upcoming",
                  color: "var(--navy-500)",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-baseline gap-1 shrink-0"
                >
                  <span className="stat-val" style={{ color: s.color }}>
                    {s.val}
                  </span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64 mt-2 sm:mt-0">
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

        {/* ── Content ── */}
        <div className="px-3 sm:px-4 md:px-8 py-4 md:py-6 max-w-7xl mx-auto">
          {error && (
            <div className="alert alert-danger mb-4">
              {error}
              <button
                onClick={fetchCustomers}
                className="ml-auto text-xs font-bold underline shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {loadingData ? (
            <div className="flex justify-center py-20">
              <div className="spinner spinner-lg" />
            </div>
          ) : filtered.length === 0 && !search ? (
            <div className="text-center py-16 md:py-20">
              <p className="text-5xl md:text-6xl mb-4">👥</p>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                No customers yet
              </h3>
              <p
                className="text-sm mb-6"
                style={{ color: "var(--color-text-hint)" }}
              >
                Add your first customer to get started
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="btn btn-primary"
              >
                + Add Customer
              </button>
            </div>
          ) : (
            <>
              {/* ── Desktop table ── */}
              <div className="hidden md:block">
                <div
                  className="table-responsive rounded-2xl overflow-hidden"
                  style={{
                    border: "1px solid var(--slate-200)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <table className="data-table bg-white">
                    <thead>
                      <tr>
                        {[
                          "Nickname",
                          "Secret Code",
                          ...(canSeeCreatedBy ? ["Created By"] : []),
                          "Customer",
                          "Phone",
                          "Projects",
                          "Meetings",
                          "Status",
                          "Actions",
                        ].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td
                            colSpan={canSeeCreatedBy ? 9 : 8}
                            style={{
                              textAlign: "center",
                              padding: "3rem",
                              color: "var(--color-text-hint)",
                            }}
                          >
                            No customers match your search.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((c) => (
                          <tr key={c.id}>
                            <td>
                              <div className="flex flex-col gap-0.5">
                                <span
                                  className="font-bold text-sm"
                                  style={{ color: "var(--navy-900)" }}
                                >
                                  {c.nickname}
                                </span>
                                {isAdmin && (
                                  <>
                                    <span
                                      className="text-[11px]"
                                      style={{
                                        color: "var(--color-text-muted)",
                                      }}
                                    >
                                      Company: {c.user?.company_name ?? "—"}
                                    </span>
                                    <span
                                      className="text-[11px]"
                                      style={{
                                        color: "var(--color-text-hint)",
                                      }}
                                    >
                                      Customer: {c.name ?? c.nickname} | User:{" "}
                                      {c.user?.name ?? `#${c.user_id}`}
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="secret-code">
                                {c.secret_code}
                              </span>
                            </td>
                            {canSeeCreatedBy && (
                              <td
                                className="text-xs"
                                style={{ color: "var(--color-text-muted)" }}
                              >
                                {isAdmin ? (
                                  <div className="leading-tight">
                                    <div>
                                      Company: {c.user?.company_name ?? "—"}
                                    </div>
                                    <div>
                                      User: {c.user?.name ?? `#${c.user_id}`}
                                    </div>
                                  </div>
                                ) : (
                                  (c.user?.name ?? `#${c.user_id}`)
                                )}
                              </td>
                            )}
                            <td
                              style={{
                                color: c.name
                                  ? "var(--color-text-primary)"
                                  : "var(--color-text-hint)",
                              }}
                            >
                              {c.name ?? "—"}
                            </td>
                            <td
                              style={{
                                color: c.phone
                                  ? "var(--color-text-primary)"
                                  : "var(--color-text-hint)",
                              }}
                            >
                              {c.phone ?? "—"}
                            </td>
                            <td>
                              <ProjectsCell projects={c.projects} />
                            </td>
                            <td>
                              <MeetingStats projects={c.projects} />
                            </td>
                            <td>
                              <StatusBadge status={c.status} />
                            </td>
                            <td>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => openLinkPreview(c)}
                                  title="Project Link Preview"
                                  className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                                  style={{ color: "#16a34a" }}
                                >
                                  <IconEye />
                                </button>
                                <button
                                  onClick={() => setViewCustomer(c)}
                                  title="View Customer"
                                  className="p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                                  style={{ color: "#4f46e5" }}
                                >
                                  <IconUserCard />
                                </button>
                                <button
                                  onClick={() => setEditCustomer(c)}
                                  title="Edit"
                                  className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                  style={{ color: "var(--navy-600)" }}
                                >
                                  <IconEdit />
                                </button>
                                <button
                                  onClick={() => setDeleteId(c.id)}
                                  title="Archive"
                                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                  style={{ color: "var(--red-600)" }}
                                >
                                  <IconTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Mobile cards ── */}
              <div className="md:hidden space-y-2.5">
                {filtered.length === 0 && (
                  <p
                    className="text-center py-8 text-sm"
                    style={{ color: "var(--color-text-hint)" }}
                  >
                    No customers match your search.
                  </p>
                )}
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    className="card p-3.5 rounded-xl"
                    style={{ borderRadius: "var(--radius-lg)" }}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div style={{ minWidth: 0 }}>
                        <p
                          className="font-bold text-sm truncate"
                          style={{ color: "var(--navy-900)" }}
                        >
                          {c.nickname}
                        </p>
                        <span className="secret-code mt-0.5 inline-block">
                          {c.secret_code}
                        </span>
                        {canSeeCreatedBy && c.user?.name && (
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {isAdmin
                              ? `Company: ${c.user.company_name ?? "—"} | User: ${c.user.name}`
                              : `Created by: ${c.user.name}`}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    {/* Details */}
                    {c.name && <p className="text-sm mb-1">👤 {c.name}</p>}
                    {c.phone && (
                      <p
                        className="text-xs mb-2"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        📞 {c.phone}
                      </p>
                    )}

                    <MeetingStats projects={c.projects} />

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openLinkPreview(c)}
                        className="btn flex-1 text-white"
                        style={{
                          fontSize: "0.78rem",
                          background: "linear-gradient(135deg,#16a34a,#15803d)",
                          padding: "0.5rem",
                        }}
                      >
                        <IconEye /> Links
                      </button>
                      <button
                        onClick={() => setViewCustomer(c)}
                        className="btn flex-1 text-white"
                        style={{
                          fontSize: "0.78rem",
                          background: "linear-gradient(135deg,#4f46e5,#4338ca)",
                          padding: "0.5rem",
                        }}
                      >
                        <IconUserCard /> View
                      </button>
                      <button
                        onClick={() => setEditCustomer(c)}
                        className="btn btn-primary flex-1"
                        style={{ fontSize: "0.78rem", padding: "0.5rem" }}
                      >
                        <IconEdit /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="btn btn-danger flex-1"
                        style={{ fontSize: "0.78rem", padding: "0.5rem" }}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* Modals */}
      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onAdded={(c) => {
            setCustomers((prev) => [normalise(c), ...prev]);
            setShowAdd(false);
          }}
        />
      )}
      {viewCustomer && (
        <ViewCustomerModal
          customer={viewCustomer}
          onClose={() => setViewCustomer(null)}
          onCustomerUpdated={(u) => {
            const n = normalise(u);
            setCustomers((prev) => prev.map((c) => (c.id === n.id ? n : c)));
            setViewCustomer(n);
          }}
        />
      )}
      {editCustomer && (
        <EditCustomerModal
          customer={editCustomer}
          onClose={() => setEditCustomer(null)}
          onUpdated={(u) => {
            const n = normalise(u);
            setCustomers((prev) => prev.map((c) => (c.id === n.id ? n : c)));
            setEditCustomer(null);
          }}
        />
      )}

      <LinkPreviewModal
        customer={linkModalCustomer}
        links={linkRows}
        loading={linkLoading}
        onCustomerUpdated={(u) => {
          const n = normalise(u);
          setCustomers((prev) => prev.map((c) => (c.id === n.id ? n : c)));
          setLinkModalCustomer(n);
        }}
        onClose={() => {
          setLinkModalCustomer(null);
          setLinkRows([]);
          setLinkLoading(false);
        }}
      />

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div
            className="modal-box"
            style={{ maxWidth: "22rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-body text-center py-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--red-100)" }}
              >
                <svg
                  className="w-7 h-7"
                  style={{ color: "var(--red-600)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3
                className="font-bold text-lg mb-1"
                style={{ color: "var(--navy-900)" }}
              >
                Archive Customer?
              </h3>
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                This will soft delete the customer and hide it from active
                lists.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setDeleteId(null)}
                className="btn btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="btn btn-danger flex-1"
              >
                {deleting ? "Archiving..." : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
