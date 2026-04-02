// components/ScheduleMeetingModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { CustomerAPI, Customer, CompanyUserAPI, CompanyUser } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onScheduled: () => void;
}

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const mins = 7 * 60 + i * 30;
  const h = Math.floor(mins / 60),
    m = mins % 60;
  const val = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return { val, label: fmt12(val) };
});

const DATE_OPTIONS = Array.from({ length: 30 }, (_, i) => {
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

export default function ScheduleMeetingModal({
  isOpen,
  onClose,
  projectName,
  onScheduled,
}: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assignees, setAssignees] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState<number | null>(null);
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([CustomerAPI.list(), CompanyUserAPI.list()])
      .then(([customerRes, assigneeRes]) => {
        setCustomers(customerRes.data);
        setAssignees(assigneeRes.data.filter((u) => u.is_active));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen]);

  const reset = () => {
    setSelId(null);
    setAssignedTo(null);
    setDate("");
    setTime("");
    setError("");
    setSuccess("");
  };

  const handleSchedule = async () => {
    setError("");
    if (!selId) {
      setError("Please select a customer.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }
    if (!time) {
      setError("Please select a time.");
      return;
    }
    setSaving(true);
    try {
      await CustomerAPI.scheduleMeeting(selId, {
        meeting_date: date,
        meeting_time: time,
        project_name: projectName,
        assigned_to_user_id: assignedTo ?? undefined,
      });
      setSuccess("✓ Meeting scheduled!");
      setTimeout(() => {
        onScheduled();
        onClose();
        reset();
      }, 1400);
    } catch (e: unknown) {
      setError(
        (e as { message?: string }).message ||
          "Failed to schedule. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const selCustomer = customers.find((c) => c.id === selId);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        reset();
        onClose();
      }}
    >
      <div
        className="modal-box"
        style={{ maxWidth: "28rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <p className="modal-title">Schedule Meeting</p>
            <p className="modal-subtitle">📅 {projectName}</p>
          </div>
          <button
            className="modal-close"
            onClick={() => {
              reset();
              onClose();
            }}
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="modal-body space-y-4">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Step 1: Select Customer */}
          <div>
            <label className="label">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-1"
                style={{ background: "var(--navy-600)", color: "#fff" }}
              >
                1
              </span>
              Select Customer <span className="req">*</span>
            </label>
            {loading ? (
              <div
                className="flex items-center gap-2 py-3 text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span
                  className="spinner"
                  style={{ width: "1rem", height: "1rem" }}
                />{" "}
                Loading customers…
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-4">
                <p
                  className="text-sm mb-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No customers found.
                </p>
                <a
                  href="/dashboard"
                  className="text-sm font-semibold"
                  style={{ color: "var(--navy-600)" }}
                >
                  Add a customer first →
                </a>
              </div>
            ) : (
              <select
                value={selId ?? ""}
                onChange={(e) => {
                  setSelId(Number(e.target.value));
                  setError("");
                }}
                className="input-field mt-1"
              >
                <option value="">— Choose a customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nickname}
                    {c.name ? ` (${c.name})` : ""} · {c.secret_code}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Step 2: Auto-verified code */}
          {selCustomer && (
            <div className="animate-fade-in">
              <label className="label">
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-1"
                  style={{ background: "var(--navy-600)", color: "#fff" }}
                >
                  2
                </span>
                Secret Code (Auto-verified)
              </label>
              <div
                className="flex items-center gap-2 p-3 rounded-xl mt-1"
                style={{
                  background: "var(--navy-50)",
                  border: "1px solid var(--navy-100)",
                }}
              >
                <span className="secret-code">{selCustomer.secret_code}</span>
                <span
                  className="text-xs font-semibold ml-auto"
                  style={{ color: "var(--green-600)" }}
                >
                  ✓ Verified
                </span>
              </div>
            </div>
          )}

          {/* Step 3: Date + Time */}
          {selCustomer && (
            <div className="space-y-3 animate-fade-in">
              <label className="label">
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-1"
                  style={{ background: "var(--navy-600)", color: "#fff" }}
                >
                  3
                </span>
                Schedule <span className="req">*</span>
              </label>
              <div>
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Meeting Date
                </p>
                <select
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
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
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Meeting Time{" "}
                  <span className="text-gray-400">
                    (30-min slots · 7 AM – 9 PM)
                  </span>
                </p>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="input-field"
                >
                  <option value="">— Select a time —</option>
                  {TIME_SLOTS.map(({ val, label }) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Assign to Company User (optional)
                </p>
                <select
                  value={assignedTo ?? ""}
                  onChange={(e) =>
                    setAssignedTo(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="input-field"
                >
                  <option value="">— Keep with creator —</option>
                  {assignees.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Summary */}
              {date && time && (
                <div
                  className="p-3 rounded-xl text-xs"
                  style={{
                    background: "var(--gold-50)",
                    border: "1px solid var(--gold-300)",
                  }}
                >
                  <p
                    className="font-bold mb-1"
                    style={{ color: "var(--gold-700)" }}
                  >
                    Meeting Summary
                  </p>
                  <p style={{ color: "var(--navy-800)" }}>
                    👤 {selCustomer.nickname} &nbsp;·&nbsp; 🏠 {projectName}
                    <br />
                    📅 {DATE_OPTIONS.find((d) => d.val === date)?.label}{" "}
                    &nbsp;·&nbsp; 🕐 {fmt12(time)}
                    {assignedTo ? (
                      <>
                        <br />
                        👥 Assigned:{" "}
                        {assignees.find((u) => u.id === assignedTo)?.name ??
                          "Company User"}
                      </>
                    ) : null}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="btn btn-ghost flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={saving || !selId || !date || !time}
            className="btn btn-primary flex-1"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span
                  className="spinner"
                  style={{
                    width: "0.9rem",
                    height: "0.9rem",
                    borderWidth: "2px",
                  }}
                />
                Scheduling…
              </span>
            ) : (
              "Schedule Meeting →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
