// app/home/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import SidebarFilter from "@/components/SidebarFilter";
import ScheduleMeetingModal from "@/components/ScheduleMeetingModal";
import {
  FilterState,
  DEFAULT_FILTERS,
  MOCK_PROJECT_CARDS,
  ProjectCard,
} from "@/lib/mockData";

// ── Project Card ───────────────────────────────────────────
function ProjectCardUI({
  project,
  onSchedule,
}: {
  project: ProjectCard;
  onSchedule: (name: string) => void;
}) {
  const BADGE_STYLE: Record<string, { bg: string; text: string }> = {
    Hot: { bg: "#fee2e2", text: "#dc2626" },
    "New Launch": { bg: "#dcfce7", text: "#16a34a" },
    "Best Seller": { bg: "#f3e8ff", text: "#9333ea" },
    Luxury: { bg: "#fef3c7", text: "#b47a00" },
  };
  const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
    "Ready to Move": { bg: "#dcfce7", text: "#16a34a" },
    "Under Construction": { bg: "#fef3c7", text: "#b47a00" },
  };
  const badge = BADGE_STYLE[project.badge ?? ""] ?? null;
  const status = STATUS_STYLE[project.status] ?? {
    bg: "#f1f5f9",
    text: "#64748b",
  };

  return (
    <article
      className="card rounded-2xl overflow-hidden group flex flex-col"
      style={{ borderRadius: "var(--radius-xl)" }}
    >
      {/* Color bar */}
      <div
        className="h-1.5 w-full"
        style={{ background: "var(--gradient-card-top)" }}
      />

      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-sm leading-snug mb-0.5 truncate transition-colors group-hover:text-blue-700"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--navy-900)",
              }}
            >
              {project.name}
            </h3>
            <p
              className="text-xs truncate"
              style={{ color: "var(--color-text-muted)" }}
            >
              {project.developer}
            </p>
          </div>
          {badge && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: badge.bg, color: badge.text }}
            >
              {project.badge}
            </span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-3">
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ color: "var(--color-text-hint)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {project.location}
          </span>
        </div>

        {/* Price */}
        <p
          className="text-base font-bold mb-3"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--gold-700)",
          }}
        >
          {project.price}
        </p>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2 mb-4 flex-1">
          {[
            { label: "Type", val: project.type },
            { label: "Area", val: project.area },
            { label: "Possession", val: project.possession },
            { label: "Units Left", val: `${project.units} units` },
          ].map((info) => (
            <div
              key={info.label}
              className="px-2.5 py-2 rounded-lg"
              style={{
                background: "var(--slate-50)",
                border: "1px solid var(--slate-100)",
              }}
            >
              <p className="text-gray-400 mb-0.5" style={{ fontSize: 10 }}>
                {info.label}
              </p>
              <p
                className="text-xs font-semibold truncate"
                style={{ color: "var(--color-text-primary)" }}
              >
                {info.val}
              </p>
            </div>
          ))}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: status.bg, color: status.text }}
          >
            {project.status}
          </span>
          <div className="flex gap-1.5">
            <button
              className="btn btn-primary text-xs px-3 py-1.5"
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.8rem" }}
            >
              Details
            </button>
            <button
              onClick={() => onSchedule(project.name)}
              className="btn btn-gold text-xs px-3 py-1.5"
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.8rem" }}
            >
              📅 Schedule
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Loading ────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="spinner spinner-lg" />
      <p className="page-loader-text">Loading projects…</p>
    </div>
  );
}

// ── Home Page ──────────────────────────────────────────────
export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isLoading, router]);

  const filteredProjects = useMemo<ProjectCard[]>(() => {
    return MOCK_PROJECT_CARDS.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.developer.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q);
      const matchDev =
        !filters.developer.length ||
        filters.developer.some((d) => p.developer.includes(d));
      const matchLoc =
        !filters.location.length ||
        filters.location.some((l) => p.location.includes(l));
      const matchProj =
        !filters.projectName.length || filters.projectName.includes(p.name);
      const matchStatus =
        !filters.developmentStatus ||
        filters.developmentStatus === "both" ||
        (filters.developmentStatus === "under_construction" &&
          p.status === "Under Construction") ||
        (filters.developmentStatus === "ready" && p.status === "Ready to Move");
      return matchSearch && matchDev && matchLoc && matchProj && matchStatus;
    });
  }, [search, filters]);

  const activeFilterCount = [
    filters.projectName.length,
    filters.developer.length,
    filters.location.length,
    filters.amenities.length,
    filters.intent.length,
    filters.unitTypes.length,
    filters.developmentStatus ? 1 : 0,
    filters.bestSuited ? 1 : 0,
    filters.possessionDate ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleSchedule = (name: string) => {
    setSelectedProject(name);
    setScheduleOpen(true);
  };
  const handleScheduled = () => {
    setToast(`✓ Meeting scheduled for "${selectedProject}"!`);
    setTimeout(() => setToast(""), 3500);
  };

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-bg)" }}
    >
      <Header variant="app" />
      <SidebarFilter
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
      <ScheduleMeetingModal
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        projectName={selectedProject}
        onScheduled={handleScheduled}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in-up">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
            style={{ background: "var(--navy-900)", color: "#fff" }}
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "var(--gold-400)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium">{toast}</p>
            <button
              onClick={() => setToast("")}
              className="ml-1 opacity-60 hover:opacity-100 text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <main className="flex-1" style={{ paddingTop: "var(--header-height)" }}>
        {/* Banner */}
        <div
          className="px-4 md:px-8 py-5"
          style={{ background: "var(--gradient-header)" }}
        >
          <div className="max-w-7xl mx-auto flex justify-end">
            <SearchBar
              value={search}
              onChange={setSearch}
              onFilterClick={() => setSidebarOpen(true)}
              activeFilterCount={activeFilterCount}
            />
          </div>
        </div>

        {/* Stats bar */}
        <div className="stats-bar">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-5 flex-wrap">
              {[
                {
                  val: MOCK_PROJECT_CARDS.length,
                  label: "Total",
                  color: "var(--navy-700)",
                },
                {
                  val: filteredProjects.length,
                  label: "Showing",
                  color: "var(--gold-700)",
                },
                {
                  val: activeFilterCount,
                  label: "Filters",
                  color: "var(--purple-600)",
                },
              ].map((s) => (
                <div key={s.label} className="flex items-baseline gap-1.5">
                  <span className="stat-val" style={{ color: s.color }}>
                    {s.val}
                  </span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: "var(--red-100)",
                  color: "var(--red-600)",
                  border: "1px solid rgba(220,38,38,0.2)",
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <h3
                className="text-lg font-bold mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                No projects found
              </h3>
              <p
                className="text-sm mb-5"
                style={{ color: "var(--color-text-hint)" }}
              >
                Try adjusting your search or filters
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setSearch("");
                }}
              >
                Reset All
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
              {filteredProjects.map((p) => (
                <ProjectCardUI
                  key={p.id}
                  project={p}
                  onSchedule={handleSchedule}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
