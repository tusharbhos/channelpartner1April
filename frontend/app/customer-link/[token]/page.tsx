"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CustomerProjectLinkAPI,
  LinkedProjectCard,
  PublicCustomerProjectLink,
} from "@/lib/api";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "under construction": { bg: "rgba(249,115,22,0.12)", text: "#b47a00" },
  ready: { bg: "rgba(22,163,74,0.12)", text: "#15803d" },
  "ready to move": { bg: "rgba(22,163,74,0.12)", text: "#15803d" },
};

function statusStyle(status?: string) {
  if (!status) return { bg: "rgba(30,69,128,0.1)", text: "#1e4580" };
  return (
    STATUS_COLORS[status.toLowerCase()] ?? {
      bg: "rgba(30,69,128,0.1)",
      text: "#1e4580",
    }
  );
}

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function fmtExpiry(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const mins = 7 * 60 + i * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const val = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return { val, label: fmt12(val) };
});

export default function PublicCustomerLinkPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const today = new Date().toISOString().split("T")[0];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [linkData, setLinkData] = useState<PublicCustomerProjectLink | null>(
    null,
  );
  const [likedProjects, setLikedProjects] = useState<LinkedProjectCard[]>([]);
  const [likedKeys, setLikedKeys] = useState<string[]>([]);
  const [scheduleProject, setScheduleProject] = useState<{
    project: LinkedProjectCard;
    index: number;
  } | null>(null);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [scheduleError, setScheduleError] = useState("");

  const getAttemptKey = (project: LinkedProjectCard) => {
    if (project.project_key) return project.project_key;
    if (project.id) return `id-${project.id}`;
    const title = (project.title || "").trim().toLowerCase();
    return title ? `title-${title}` : "";
  };

  const getProjectKey = (project: LinkedProjectCard) => getAttemptKey(project);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError("");

    CustomerProjectLinkAPI.publicShow(token)
      .then((res) => {
        if (!active) return;
        const data = res.data;
        setLinkData(data);
        const existingLiked = data.liked_projects || [];
        setLikedProjects(existingLiked);
        setLikedKeys(existingLiked.map((p) => getProjectKey(p)));
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(
          (e as { message?: string }).message || "Invalid or expired link.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const selectedProjects = linkData?.selected_projects || [];

  const saveLikedProjects = async (
    nextLikedProjects: LinkedProjectCard[],
    attemptProjectKey?: string,
  ) => {
    if (!token) return;

    setSaving(true);
    try {
      const res = await CustomerProjectLinkAPI.publicLike(
        token,
        nextLikedProjects,
        attemptProjectKey,
      );
      const savedLikedProjects = res.data.liked_projects || [];
      setLikedProjects(savedLikedProjects);
      setLikedKeys(savedLikedProjects.map((p) => getProjectKey(p)));
      setLinkData((prev) =>
        prev
          ? {
              ...prev,
              selected_projects: (prev.selected_projects || []).map(
                (project) => {
                  const projectKey = getProjectKey(project);
                  const nextAttemptCount =
                    attemptProjectKey && projectKey === attemptProjectKey
                      ? (project.attempt_count || 0) + 1
                      : project.attempt_count || 0;
                  const maxAttempts =
                    res.data.max_attempts_per_card ||
                    prev.max_attempts_per_card ||
                    5;
                  const isLocked = (
                    res.data.locked_project_keys ||
                    prev.locked_project_keys ||
                    []
                  ).includes(projectKey);

                  return {
                    ...project,
                    attempt_count: nextAttemptCount,
                    attempts_left: Math.max(0, maxAttempts - nextAttemptCount),
                    is_locked: isLocked,
                  };
                },
              ),
              liked_projects: savedLikedProjects,
              status: res.data.status,
              expires_at: res.data.expires_at || prev.expires_at,
              is_disabled:
                typeof res.data.is_disabled === "boolean"
                  ? res.data.is_disabled
                  : prev.is_disabled,
              max_attempts_per_card:
                res.data.max_attempts_per_card || prev.max_attempts_per_card,
              locked_project_keys:
                res.data.locked_project_keys || prev.locked_project_keys,
            }
          : prev,
      );
    } catch (e: unknown) {
      setError(
        (e as { message?: string }).message ||
          "Failed to save liked project details.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openLikeForm = (project: LinkedProjectCard, index: number) => {
    const attemptKey = getAttemptKey(project);
    const isLocked =
      (project.is_locked ?? false) ||
      (attemptKey !== "" &&
        (linkData?.locked_project_keys || []).includes(attemptKey));
    if (isLocked) {
      setError(
        "This card is locked after maximum attempts. Editing is disabled.",
      );
      return;
    }

    const key = getProjectKey(project);
    const existingProject = likedProjects.find(
      (likedProject) => getProjectKey(likedProject) === key,
    );

    setScheduleProject({ project, index });
    setMeetingDate(existingProject?.meeting_date || today);
    setMeetingTime(existingProject?.meeting_time || "");
    setScheduleError("");
  };

  const removeLikedProject = async (
    project: LinkedProjectCard,
    index: number,
  ) => {
    const key = getProjectKey(project);
    const nextLikedProjects = likedProjects.filter(
      (likedProject) => getProjectKey(likedProject) !== key,
    );

    await saveLikedProjects(nextLikedProjects);
  };

  const submitLikeSchedule = async () => {
    if (!scheduleProject) return;
    if (!meetingDate || !meetingTime) {
      setScheduleError("Please select both date and time.");
      return;
    }

    const projectKey = getProjectKey(scheduleProject.project);
    const scheduledProject: LinkedProjectCard = {
      ...scheduleProject.project,
      meeting_date: meetingDate,
      meeting_time: meetingTime,
    };
    const remainingLikedProjects = likedProjects.filter(
      (likedProject) => getProjectKey(likedProject) !== projectKey,
    );

    await saveLikedProjects(
      [...remainingLikedProjects, scheduledProject],
      getAttemptKey(scheduleProject.project),
    );
    setScheduleProject(null);
    setMeetingDate("");
    setMeetingTime("");
    setScheduleError("");
  };
  if (loading) {
    return (
      <div className="page-loader min-h-screen">
        <div className="spinner spinner-lg" />
        <p className="page-loader-text">Loading shared projects...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main">
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div
          className="card p-5 mb-5"
          style={{ borderRadius: "var(--radius-xl)" }}
        >
          <p
            className="text-xs uppercase font-bold"
            style={{ color: "var(--orange-600)" }}
          >
            Shared Project Link
          </p>
          <h1
            className="text-2xl font-bold mt-1"
            style={{ color: "var(--navy-900)" }}
          >
            Hello{" "}
            {linkData?.customer?.name ||
              linkData?.customer?.nickname ||
              "Customer"}
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              gap: "1rem",
              flexWrap: "wrap",
              marginTop: "0.5rem",
            }}
          >
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Tap like, choose date and time, then submit for that project.
              {saving && (
                <span
                  className="ml-2 text-xs"
                  style={{ color: "var(--color-text-hint)" }}
                >
                  Saving…
                </span>
              )}
            </p>
            {linkData?.expires_at && (
              <p
                className="text-sm"
                style={{ color: "var(--orange-700)", fontWeight: 700 }}
              >
                Link expires in 72 hours. Valid until{" "}
                {fmtExpiry(linkData.expires_at)}.
              </p>
            )}
          </div>
        </div>

        {error && <div className="alert alert-danger mb-4">{error}</div>}

        {/* Project cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedProjects.map((project, index) => {
            const projectKey = getProjectKey(project);

            const safeTitle =
              typeof project.title === "string" && project.title.trim()
                ? project.title
                : "*****";
            const safeDeveloper =
              typeof project.developer === "string" && project.developer.trim()
                ? project.developer
                : "*****";
            const safeLocation =
              typeof project.location === "string" && project.location.trim()
                ? project.location
                : "-";
            const safePrice =
              typeof project.price === "string" && project.price.trim()
                ? project.price
                : "-";
            const safeType =
              typeof project.unit_types === "string" &&
              project.unit_types.trim()
                ? project.unit_types
                : "-";
            const safeArea =
              typeof project.area === "string" && project.area.trim()
                ? project.area
                : "-";
            const safePossession =
              typeof project.possession === "string" &&
              project.possession.trim()
                ? project.possession
                : "-";
            const safeUnits =
              typeof project.units_left === "number"
                ? String(project.units_left)
                : "-";
            const safeStatus =
              typeof project.status === "string" && project.status.trim()
                ? project.status
                : "-";

            const liked = likedKeys.includes(projectKey);
            const sc = statusStyle(project.status);
            const attemptKey = getAttemptKey(project);
            const isLocked =
              (project.is_locked ?? false) ||
              (attemptKey !== "" &&
                (linkData?.locked_project_keys || []).includes(attemptKey));
            const maxAttempts = linkData?.max_attempts_per_card || 5;
            const attemptCount = project.attempt_count || 0;
            const attemptsLeft = Math.max(
              0,
              typeof project.attempts_left === "number"
                ? project.attempts_left
                : maxAttempts - attemptCount,
            );
            const scheduledLike = likedProjects.find(
              (likedProject) => getProjectKey(likedProject) === projectKey,
            );

            return (
              <div
                key={`${project.title}-${index}`}
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: isLocked
                    ? "1.5px solid #dc2626"
                    : liked
                      ? "1.5px solid #16a34a"
                      : "1px solid var(--slate-200)",
                  background: isLocked ? "#fef2f2" : liked ? "#f0fdf4" : "#fff",
                  overflow: "hidden",
                  boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
                  transition: "border-color 0.2s, background 0.2s",
                  opacity: 1,
                }}
              >
                {/* Image */}
                {project.image_url ? (
                  <img
                    src={project.image_url}
                    alt={project.title}
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: "90px",
                      background:
                        "linear-gradient(135deg,var(--navy-900) 0%,var(--navy-700) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: "2rem" }}>🏢</span>
                  </div>
                )}

                <div style={{ padding: "0.9rem" }}>
                  {/* Always visible: project name + developer */}
                  <p
                    className="font-bold"
                    style={{
                      color: "var(--navy-900)",
                      fontSize: "0.97rem",
                      lineHeight: 1.35,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {safeTitle}
                  </p>
                  <p
                    className="text-sm mt-0.5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {safeDeveloper}
                  </p>
                  <div
                    style={{
                      marginTop: "0.45rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      padding: "0.26rem 0.6rem",
                      borderRadius: "999px",
                      background: isLocked ? "#fee2e2" : "var(--navy-50)",
                      color: isLocked ? "#991b1b" : "var(--navy-700)",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                    }}
                  >
                    {isLocked
                      ? `Attempts used: ${maxAttempts}/${maxAttempts}`
                      : `Attempts left: ${attemptsLeft}/${maxAttempts}`}
                  </div>

                  <div
                    style={{
                      marginTop: "0.7rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.45rem",
                    }}
                  >
                    {isLocked ? (
                      <div
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #fca5a5",
                          background: "#fee2e2",
                          padding: "0.55rem 0.7rem",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#991b1b",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          Card Locked
                        </p>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "#7f1d1d" }}
                        >
                          Maximum 5 attempts reached. View only mode.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p
                          className="text-sm"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          📍 {safeLocation}
                        </p>
                        <p
                          className="font-bold"
                          style={{
                            color: "var(--orange-600)",
                            fontSize: "0.97rem",
                          }}
                        >
                          {safePrice}
                        </p>

                        {/* 2-col detail grid */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.35rem",
                          }}
                        >
                          <div
                            style={{
                              background: "var(--slate-50)",
                              border: "1px solid var(--slate-100)",
                              borderRadius: "6px",
                              padding: "0.4rem 0.5rem",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                color: "var(--color-text-hint)",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                marginBottom: "2px",
                              }}
                            >
                              Type
                            </p>
                            <p
                              className="text-xs font-semibold"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {safeType}
                            </p>
                          </div>
                          <div
                            style={{
                              background: "var(--slate-50)",
                              border: "1px solid var(--slate-100)",
                              borderRadius: "6px",
                              padding: "0.4rem 0.5rem",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                color: "var(--color-text-hint)",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                marginBottom: "2px",
                              }}
                            >
                              Area
                            </p>
                            <p
                              className="text-xs font-semibold"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {safeArea}
                            </p>
                          </div>
                          <div
                            style={{
                              background: "var(--slate-50)",
                              border: "1px solid var(--slate-100)",
                              borderRadius: "6px",
                              padding: "0.4rem 0.5rem",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                color: "var(--color-text-hint)",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                marginBottom: "2px",
                              }}
                            >
                              Possession
                            </p>
                            <p
                              className="text-xs font-semibold"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {safePossession}
                            </p>
                          </div>
                          <div
                            style={{
                              background: "var(--slate-50)",
                              border: "1px solid var(--slate-100)",
                              borderRadius: "6px",
                              padding: "0.4rem 0.5rem",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                color: "var(--color-text-hint)",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                marginBottom: "2px",
                              }}
                            >
                              Units Left
                            </p>
                            <p
                              className="text-xs font-semibold"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {safeUnits}
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.2rem 0.7rem",
                        borderRadius: "999px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        background: sc.bg,
                        color: sc.text,
                        alignSelf: "flex-start",
                      }}
                    >
                      {safeStatus}
                    </span>

                    {!isLocked &&
                      scheduledLike?.meeting_date &&
                      scheduledLike?.meeting_time && (
                        <div
                          style={{
                            background: liked ? "#dcfce7" : "var(--slate-50)",
                            border: liked
                              ? "1px solid #86efac"
                              : "1px solid var(--slate-100)",
                            borderRadius: "8px",
                            padding: "0.55rem 0.7rem",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: liked
                                ? "#166534"
                                : "var(--color-text-hint)",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            Selected Visit Slot
                          </p>
                          <p
                            className="text-sm font-semibold"
                            style={{
                              color: liked ? "#166534" : "var(--navy-900)",
                            }}
                          >
                            {scheduledLike.meeting_date} at{" "}
                            {scheduledLike.meeting_time}
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Like button — auto-saves, no separate submit */}
                  <button
                    onClick={() => openLikeForm(project, index)}
                    disabled={isLocked}
                    style={{
                      marginTop: "0.9rem",
                      width: "100%",
                      padding: "0.52rem 0",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      fontWeight: 700,
                      fontSize: "0.87rem",
                      cursor: isLocked ? "not-allowed" : "pointer",
                      background: isLocked
                        ? "#b91c1c"
                        : liked
                          ? "#16a34a"
                          : "var(--navy-900)",
                      opacity: isLocked ? 0.85 : 1,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                      transition: "background 0.2s",
                    }}
                  >
                    {isLocked
                      ? "Locked: View Only"
                      : liked
                        ? "🗓️ Update Visit Date & Time"
                        : "🤍 Like this Project"}
                  </button>
                  {liked && !isLocked && (
                    <button
                      onClick={() => removeLikedProject(project, index)}
                      style={{
                        marginTop: "0.55rem",
                        width: "100%",
                        padding: "0.5rem 0",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--slate-300)",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        background: "#fff",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Remove Like
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: liked count, auto-saved */}
        {likedKeys.length > 0 && (
          <div
            className="mt-6 p-4 rounded-xl text-center"
            style={{ background: "#f0fdf4", border: "1px solid #86efac" }}
          >
            <p
              style={{ color: "#16a34a", fontWeight: 700, fontSize: "0.9rem" }}
            >
              ✅ You&apos;ve liked {likedKeys.length} project
              {likedKeys.length !== 1 ? "s" : ""} — saved automatically!
            </p>
          </div>
        )}

        {scheduleProject && (
          <div className="modal-overlay">
            <div
              className="modal-box"
              style={{
                maxWidth: "28rem",
                width: "min(28rem, calc(100% - 1.2rem))",
              }}
            >
              <div className="modal-header">
                <div>
                  <p className="modal-title">Schedule Visit</p>
                  <p className="modal-subtitle">
                    {scheduleProject.project.title || "Selected Project"}
                  </p>
                </div>
                <button
                  className="modal-close"
                  onClick={() => {
                    setScheduleProject(null);
                    setScheduleError("");
                  }}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                {scheduleError && (
                  <div className="alert alert-danger mb-3">{scheduleError}</div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Date</label>
                    <input
                      className="input-field"
                      type="date"
                      min={today}
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Time</label>

                    <select
                      className="input-field"
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                    >
                      <option value="">Choose a time slot</option>
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot.val} value={slot.val}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setScheduleProject(null);
                    setScheduleError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-gold"
                  onClick={submitLikeSchedule}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
