// app/home/page.tsx
"use client";

import React, {
  JSX,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import SidebarFilter, { SidebarOptions } from "@/components/SidebarFilter";
import ScheduleMeetingModal from "@/components/ScheduleMeetingModal";
import AddProjectModal from "@/components/AddProjectModal";
import { DEFAULT_FILTERS, FilterState } from "@/lib/mockData";
import {
  ApiProject,
  fetchAllProjects,
  fetchMeta,
  mediaUrl,
  normalize,
  toCardPrice,
  toNumber,
  toStatusLabel,
} from "@/lib/conectr";

/* ── how many cards per "page" load ── */
const PAGE_SIZE = 12;

function valueInString(selected: string[], actual: string): boolean {
  if (!selected.length) return true;
  const target = actual.toLowerCase();
  return selected.some((e) => target.includes(e.toLowerCase()));
}
function intersects(selected: string[], actual: string[]): boolean {
  if (!selected.length) return true;
  const bag = new Set(actual.map((v) => v.toLowerCase()));
  return selected.some((e) => bag.has(e.toLowerCase()));
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "under construction": { bg: "rgba(249,115,22,0.12)", color: "#b47a00" },
  ready: { bg: "rgba(22,163,74,0.12)", color: "#15803d" },
  "ready to move": { bg: "rgba(22,163,74,0.12)", color: "#15803d" },
  default: { bg: "rgba(30,69,128,0.1)", color: "#1e4580" },
};
function statusStyle(label: string) {
  const key = label.toLowerCase();
  return STATUS_COLORS[key] ?? STATUS_COLORS["default"];
}

function InfoIcon({
  type,
}: {
  type: "type" | "area" | "possession" | "units";
}) {
  const icons: Record<string, JSX.Element> = {
    type: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    ),
    area: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
      />
    ),
    possession: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    ),
    units: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
  };
  return (
    <svg
      className="w-3 h-3 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      {icons[type]}
    </svg>
  );
}

function PageLoader() {
  return (
    <div className="page-loader">
      <div className="spinner spinner-lg" />
      <p className="page-loader-text">Loading projects…</p>
    </div>
  );
}

function AddProjectBanner({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:p-5 rounded-2xl"
      style={{
        background:
          "linear-gradient(135deg,rgba(30,69,128,0.06) 0%,rgba(249,115,22,0.08) 100%)",
        border: "1.5px dashed rgba(30,69,128,0.25)",
      }}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div
          className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "var(--navy-50)",
            border: "1.5px solid var(--navy-100)",
          }}
        >
          <span className="text-xl md:text-2xl">🏗️</span>
        </div>
        <div>
          <p
            className="font-bold text-sm"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--navy-900)",
            }}
          >
            Don't find your project?
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            Request to activate any project on ChannelPartner.Network
          </p>
        </div>
      </div>
      <button
        onClick={onAdd}
        className="btn btn-primary flex-shrink-0 w-full sm:w-auto gap-2"
        style={{ whiteSpace: "nowrap" }}
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add New Project
      </button>
    </div>
  );
}

/* ── Skeleton card shown while loading more ── */
function SkeletonCard() {
  return (
    <article
      className="card flex flex-col"
      style={{
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        className="skeleton"
        style={{ height: "clamp(120px,22vw,152px)", borderRadius: 0 }}
      />
      <div className="p-3.5 md:p-4 flex flex-col gap-3">
        <div>
          <div
            className="skeleton"
            style={{
              height: 14,
              width: "70%",
              borderRadius: 4,
              marginBottom: 6,
            }}
          />
          <div
            className="skeleton"
            style={{ height: 10, width: "45%", borderRadius: 4 }}
          />
        </div>
        <div
          className="skeleton"
          style={{ height: 10, width: "85%", borderRadius: 4 }}
        />
        <div
          className="skeleton"
          style={{ height: 16, width: "40%", borderRadius: 4 }}
        />
        <div className="grid grid-cols-2 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 44, borderRadius: 8 }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            className="skeleton"
            style={{ height: 22, width: 80, borderRadius: 999 }}
          />
          <div
            className="skeleton"
            style={{ height: 30, width: 80, borderRadius: 8 }}
          />
        </div>
      </div>
    </article>
  );
}

function ProjectCardUI({
  project,
  onSchedule,
}: {
  project: ApiProject;
  onSchedule: (name: string) => void;
}) {
  const title = normalize(project.title) || "Untitled Project";
  const developer = normalize(project.developer) || "Developer not available";
  const location = normalize(project.location) || "Location not available";
  const image =
    mediaUrl(project.background_image_mobile) ??
    mediaUrl(project.background_image_desktop) ??
    mediaUrl(project.main_logo);

  const units = project.units ?? [];
  const areaMin = units.map((u) => toNumber(u.area_min)).filter((v) => v > 0);
  const areaMax = units.map((u) => toNumber(u.area_max)).filter((v) => v > 0);
  const unitTypes = Array.from(
    new Set(units.map((u) => normalize(u.unit_type)).filter(Boolean)),
  );

  const areaText =
    areaMin.length || areaMax.length
      ? `${Math.min(...(areaMin.length ? areaMin : areaMax)).toLocaleString("en-IN")} – ${Math.max(...(areaMax.length ? areaMax : areaMin)).toLocaleString("en-IN")} sq.ft`
      : "—";

  const typeText = unitTypes.length ? unitTypes.join(" / ") : "—";
  const possession = normalize(project.possession_date) || "—";
  const status = toStatusLabel(normalize(project.development_status));
  const sc = statusStyle(status);

  return (
    <article
      className="card project-card-glow flex flex-col"
      style={{
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {image ? (
        <div
          style={{
            height: "clamp(120px,22vw,152px)",
            overflow: "hidden",
            background: "#f1f5f9",
          }}
        >
          <img
            src={image}
            alt={title}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.4s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLImageElement).style.transform =
                "scale(1.04)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLImageElement).style.transform =
                "scale(1)";
            }}
          />
        </div>
      ) : (
        <div
          style={{
            height: "clamp(120px,22vw,152px)",
            background:
              "linear-gradient(135deg,var(--navy-900) 0%,var(--navy-700) 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            className="skeleton"
            style={{ position: "absolute", inset: 0, borderRadius: 0 }}
          />
          <div
            style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}
          >
            <div
              className="skeleton"
              style={{
                height: 10,
                width: "55%",
                marginBottom: 6,
                borderRadius: 4,
              }}
            />
            <div
              className="skeleton"
              style={{ height: 8, width: "38%", borderRadius: 4 }}
            />
          </div>
        </div>
      )}

      <div
        className="p-3.5 md:p-4 flex flex-col flex-1"
        style={{ gap: "0.6rem" }}
      >
        <div>
          <h3
            className="font-bold leading-snug truncate"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--navy-900)",
              fontSize: "clamp(0.82rem,2vw,0.9rem)",
            }}
          >
            {title}
          </h3>
          <p
            className="text-xs truncate mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            {developer}
          </p>
        </div>
        <p
          className="text-xs"
          style={{
            color: "var(--color-text-muted)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          📍 {location}
        </p>
        <p
          className="font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--orange-600)",
            fontSize: "clamp(0.9rem,2.5vw,1.05rem)",
          }}
        >
          {toCardPrice(project)}
        </p>

        <div className="grid grid-cols-2 gap-1.5 flex-1">
          {[
            {
              key: "type",
              label: "Type",
              val: typeText,
              icon: "type" as const,
            },
            {
              key: "area",
              label: "Area",
              val: areaText,
              icon: "area" as const,
            },
            {
              key: "possession",
              label: "Possession",
              val: possession,
              icon: "possession" as const,
            },
            {
              key: "units",
              label: "Units Left",
              val: `${toNumber(project.available_units) || 0}`,
              icon: "units" as const,
            },
          ].map((info) => (
            <div
              key={info.key}
              className="px-2 py-1.5 rounded-lg"
              style={{
                background: "var(--slate-50)",
                border: "1px solid var(--slate-100)",
              }}
            >
              <div
                className="flex items-center gap-1 mb-0.5"
                style={{ color: "var(--color-text-hint)" }}
              >
                <InfoIcon type={info.icon} />
                <p
                  style={{
                    fontSize: "9px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {info.label}
                </p>
              </div>
              <p
                className="text-xs font-semibold truncate"
                style={{ color: "var(--color-text-primary)" }}
              >
                {info.val}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: sc.bg, color: sc.color }}
          >
            {status}
          </span>
          <button
            onClick={() => onSchedule(title)}
            className="btn btn-gold"
            style={{
              fontSize: "0.75rem",
              padding: "0.4rem 0.9rem",
              flexShrink: 0,
            }}
          >
            Schedule
          </button>
        </div>
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════════════
   WELCOME PROFILE POPUP
══════════════════════════════════════════════════ */
function WelcomeProfilePopup({
  userName,
  onLater,
  onStartNow,
}: {
  userName: string;
  onLater: () => void;
  onStartNow: () => void;
}) {
  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={onLater}>
      <div
        className="glass-card animate-fade-in-up"
        style={{
          maxWidth: "420px",
          background: "var(--navy-50)",
          width: "calc(100% - 2rem)",
          padding: "2rem 1.75rem",
          borderRadius: "var(--radius-2xl)",
          textAlign: "center",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--gradient-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
            fontSize: "1.75rem",
          }}
        >
          🎯
        </div>

        {/* Heading */}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--navy-900)",
            fontSize: "1.25rem",
            fontWeight: 800,
            marginBottom: "0.5rem",
            lineHeight: 1.3,
          }}
        >
          Welcome, {userName}! 👋
        </h2>

        {/* Sub-heading */}
        <p
          style={{
            color: "var(--orange-600)",
            fontWeight: 700,
            fontSize: "0.85rem",
            marginBottom: "0.75rem",
          }}
        >
          Complete Your Partner Profile
        </p>

        {/* Body text */}
        <p
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            marginBottom: "1.5rem",
          }}
        >
          This form will help us to show you projects that are most suited for
          you!
        </p>

        {/* Buttons */}
        <div
          style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}
        >
          <button
            onClick={onLater}
            className="btn btn-ghost"
            style={{ flex: 1, maxWidth: "160px", fontSize: "0.875rem" }}
          >
            Do It Later
          </button>
          <button
            onClick={onStartNow}
            className="btn btn-gold"
            style={{ flex: 1, maxWidth: "160px", fontSize: "0.875rem" }}
          >
            Start Now →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════ */
export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [toast, setToast] = useState("");
  const [addProjectOpen, setAddProjectOpen] = useState(false);

  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);

  /* ── pagination state ── */
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [filterOptions, setFilterOptions] = useState<SidebarOptions>({
    projects: [],
    categories: [],
    tags: [],
    amenities: [],
    developers: [],
    locations: [],
    developmentStatus: [],
    bestSuited: [],
    unitTypes: [],
    areaRange: { min: 200, max: 10000 },
    priceRange: { min: 100000, max: 50000000 },
  });
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isLoading, router]);

  /* ── Show welcome popup only for main/owner/admin when profile is incomplete ── */
  useEffect(() => {
    if (!user) return;
    const isAdmin = user.role === "admin";
    const isOwner = Boolean(user.is_company_owner);
    const isRegularCompanyUser = Boolean(user.company_id) && !isOwner;

    // Popup should never show for company users.
    if (isRegularCompanyUser) {
      setShowWelcomePopup(false);
      return;
    }

    // Eligible audience: admin + main/owner users.
    const isMainUser = !user.company_id || isOwner;
    if (!isAdmin && !isMainUser) {
      setShowWelcomePopup(false);
      return;
    }

    // DB-backed profile completeness checks from /auth/me payload.
    const hasBasicProfile = Boolean(
      user.name?.trim() &&
      user.phone?.trim() &&
      user.city?.trim() &&
      user.company_name?.trim() &&
      user.rera_no?.trim() &&
      user.address?.trim(),
    );
    const hasPreferenceProfile = Boolean(
      user.primary_market ||
      (user.budget_segments && user.budget_segments.length > 0) ||
      (user.buyer_types && user.buyer_types.length > 0) ||
      user.activation_intent ||
      (user.channels_used && user.channels_used.length > 0),
    );
    const profileCompleted =
      Boolean(user.onboarding_step && user.onboarding_step >= 3) &&
      hasBasicProfile &&
      hasPreferenceProfile;

    setShowWelcomePopup(!profileCompleted);
  }, [user]);

  const dismissWelcome = () => {
    setShowWelcomePopup(false);
  };

  const goProfile = () => {
    dismissWelcome();
    router.push("/profile");
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    const loadProjects = async () => {
      try {
        setProjectsLoading(true);
        const { projects: all } = await fetchAllProjects();
        if (active) setProjects(all);
      } catch {
        if (active) setProjects([]);
      } finally {
        if (active) setProjectsLoading(false);
      }
    };

    const loadMeta = async () => {
      try {
        setMetaLoading(true);
        const data = await fetchMeta();
        const filtersMap = new Map(
          (data.filters ?? []).map((item) => [item.key, item]),
        );

        const categories = (filtersMap.get("categories")?.options ?? [])
          .map((o) => normalize(o.name))
          .filter(Boolean);
        const tags = (filtersMap.get("tags")?.options ?? [])
          .map((o) => normalize(o.name))
          .filter(Boolean);
        const amenities = (filtersMap.get("amenities")?.options ?? [])
          .map((o) => normalize(o.name))
          .filter(Boolean);
        const developers = (filtersMap.get("developer")?.options ?? [])
          .map((o) => normalize(o.name))
          .filter(Boolean);
        const locations = (filtersMap.get("location")?.options ?? [])
          .map((o) => normalize(o.name))
          .filter(Boolean);
        const developmentStatus = (
          filtersMap.get("development_status")?.options ?? []
        )
          .map((o) => ({
            label: normalize(o.name),
            value: normalize(o.value ?? o.name).toLowerCase(),
          }))
          .filter((o) => o.label && o.value);
        const bestSuited = (filtersMap.get("best_suited")?.options ?? [])
          .map((o) => ({
            label: normalize(o.name),
            value: normalize(o.value ?? o.name).toLowerCase(),
          }))
          .filter((o) => o.label && o.value);
        const unitTypes = (filtersMap.get("unit_type")?.options ?? [])
          .map((o) => normalize(o.name))
          .filter(Boolean);
        const areaFilter = filtersMap.get("area");
        const priceFilter = filtersMap.get("price");
        const areaRange = {
          min: Math.max(0, toNumber(areaFilter?.min) || 200),
          max: Math.max(
            toNumber(areaFilter?.max) || 10000,
            toNumber(areaFilter?.min) || 200,
          ),
        };
        const priceRange = {
          min: Math.max(0, toNumber(priceFilter?.min) || 100000),
          max: Math.max(
            toNumber(priceFilter?.max) || 50000000,
            toNumber(priceFilter?.min) || 100000,
          ),
        };

        if (!active) return;
        setFilterOptions((prev) => ({
          ...prev,
          categories,
          tags,
          amenities,
          developers,
          locations,
          developmentStatus,
          bestSuited,
          unitTypes,
          areaRange,
          priceRange,
        }));
        setFilters((prev) => ({
          ...prev,
          areaMin: areaRange.min,
          areaMax: areaRange.max,
          priceMin: priceRange.min,
          priceMax: priceRange.max,
        }));
      } catch {
      } finally {
        if (active) setMetaLoading(false);
      }
    };

    loadProjects();
    loadMeta();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const projectNames = Array.from(
      new Set(projects.map((p) => normalize(p.title)).filter(Boolean)),
    );
    setFilterOptions((prev) => ({
      ...prev,
      projects: projectNames,
      developers: prev.developers.length
        ? prev.developers
        : Array.from(
            new Set(
              projects.map((p) => normalize(p.developer)).filter(Boolean),
            ),
          ),
      locations: prev.locations.length
        ? prev.locations
        : Array.from(
            new Set(projects.map((p) => normalize(p.location)).filter(Boolean)),
          ),
    }));
  }, [projects]);

  /* ── filtered list (all matches) ── */
  const filteredProjects = useMemo(() => {
    const query = search.toLowerCase().trim();
    return projects.filter((project) => {
      const title = normalize(project.title);
      const developer = normalize(project.developer);
      const location = normalize(project.location);
      const status = normalize(project.development_status).toLowerCase();
      const suited = normalize(project.best_suited).toLowerCase();
      const categories = (project.categories ?? []).map((item) =>
        normalize(item.name),
      );
      const tags = (project.tags ?? []).map((item) => normalize(item.name));
      const amenities = (project.amenities ?? []).map((item) =>
        normalize(item.name),
      );
      const unitTypes = (project.units ?? []).map((unit) =>
        normalize(unit.unit_type),
      );

      const projectMinArea = Math.min(
        ...(project.units ?? [])
          .map((u) => toNumber(u.area_min))
          .filter((v) => v > 0),
      );
      const projectMaxArea = Math.max(
        ...(project.units ?? [])
          .map((u) => toNumber(u.area_max))
          .filter((v) => v > 0),
      );
      const projectMinPrice = Math.min(
        ...(project.units ?? [])
          .map((u) => toNumber(u.price_min))
          .filter((v) => v > 0),
      );
      const projectMaxPrice = Math.max(
        ...(project.units ?? [])
          .map((u) => toNumber(u.price_max))
          .filter((v) => v > 0),
      );
      const availableUnits = Math.max(
        toNumber(project.available_units),
        ...(project.units ?? []).map((u) => toNumber(u.available_units)),
      );

      const matchSearch =
        !query ||
        title.toLowerCase().includes(query) ||
        developer.toLowerCase().includes(query) ||
        location.toLowerCase().includes(query);
      const matchProject =
        !filters.projectName.length || filters.projectName.includes(title);
      const matchDeveloper = valueInString(filters.developer, developer);
      const matchLocation = valueInString(filters.location, location);
      const matchCategories = intersects(filters.categories, categories);
      const matchTags = intersects(filters.tags, tags);
      const matchAmenities = intersects(filters.amenities, amenities);
      const matchStatus =
        !filters.developmentStatus || filters.developmentStatus === status;
      const matchBestSuited =
        !filters.bestSuited || filters.bestSuited === suited;
      const matchUnitType = intersects(filters.unitTypes, unitTypes);
      const matchArea =
        (!Number.isFinite(projectMinArea) ||
          projectMinArea <= filters.areaMax) &&
        (!Number.isFinite(projectMaxArea) || projectMaxArea >= filters.areaMin);
      const matchPrice =
        (!Number.isFinite(projectMinPrice) ||
          projectMinPrice <= filters.priceMax) &&
        (!Number.isFinite(projectMaxPrice) ||
          projectMaxPrice >= filters.priceMin);
      const matchUnits = availableUnits >= filters.unitsAvailable;
      const possessionDate = project.possession_date
        ? new Date(project.possession_date)
        : null;
      const matchPossessionExact =
        !filters.possessionDate ||
        (project.possession_date ?? "").startsWith(filters.possessionDate);
      const matchPossessionWithinYears =
        !filters.possessionWithinYears ||
        (possessionDate !== null &&
          possessionDate.getTime() <=
            new Date(
              new Date().setFullYear(
                new Date().getFullYear() + filters.possessionWithinYears,
              ),
            ).getTime());

      return (
        matchSearch &&
        matchProject &&
        matchDeveloper &&
        matchLocation &&
        matchCategories &&
        matchTags &&
        matchAmenities &&
        matchStatus &&
        matchBestSuited &&
        matchUnitType &&
        matchArea &&
        matchPrice &&
        matchUnits &&
        matchPossessionExact &&
        matchPossessionWithinYears
      );
    });
  }, [projects, search, filters]);

  /* ── reset visible count when filter/search changes ── */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, filters]);

  /* ── visible slice ── */
  const visibleProjects = useMemo(
    () => filteredProjects.slice(0, visibleCount),
    [filteredProjects, visibleCount],
  );

  const hasMore = visibleCount < filteredProjects.length;

  /* ── IntersectionObserver — load more when sentinel enters viewport ── */
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    // small delay so skeleton flashes briefly for UX feedback
    setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + PAGE_SIZE, filteredProjects.length),
      );
      setLoadingMore(false);
    }, 400);
  }, [hasMore, loadingMore, filteredProjects.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }, // trigger 200px before sentinel is visible
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const activeFilterCount = [
    filters.projectName.length,
    filters.categories.length,
    filters.tags.length,
    filters.developer.length,
    filters.location.length,
    filters.amenities.length,
    filters.unitTypes.length,
    filters.developmentStatus ? 1 : 0,
    filters.bestSuited ? 1 : 0,
    filters.possessionDate ? 1 : 0,
    filters.possessionWithinYears ? 1 : 0,
    filters.unitsAvailable ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleSchedule = (name: string) => {
    setSelectedProject(name);
    setScheduleOpen(true);
  };
  const handleScheduled = () => {
    setToast(`Meeting scheduled for "${selectedProject}".`);
    setTimeout(() => setToast(""), 3500);
  };

  if (isLoading || projectsLoading || metaLoading) return <PageLoader />;
  if (!isAuthenticated) return null;

  return (
    <div className="bg-main min-h-screen flex flex-col">
      {/* ── Welcome Profile Popup ── */}
      {showWelcomePopup && user && (
        <WelcomeProfilePopup
          userName={user.name}
          onLater={dismissWelcome}
          onStartNow={goProfile}
        />
      )}

      <Header variant="app" />

      <SidebarFilter
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        options={filterOptions}
      />

      <ScheduleMeetingModal
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        projectName={selectedProject}
        onScheduled={handleScheduled}
      />

      <AddProjectModal
        isOpen={addProjectOpen}
        onClose={() => setAddProjectOpen(false)}
        userName={user?.name ?? "Channel Partner"}
        company_name={user?.company_name ?? ""}
        onSuccess={() => {
          setToast("Project request submitted successfully.");
          setTimeout(() => setToast(""), 3500);
        }}
      />

      {/* Toast */}
      {toast && (
        <div
          className="fixed z-50 animate-fade-in-up"
          style={{
            bottom: "1.25rem",
            right: "1rem",
            left: "1rem",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg max-w-sm w-full"
            style={{ background: "var(--navy-900)", color: "#fff" }}
          >
            <p className="text-sm font-medium flex-1">{toast}</p>
            <button
              onClick={() => setToast("")}
              style={{
                opacity: 0.6,
                color: "#fff",
                fontSize: "1.1rem",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: "var(--header-height)" }}
      >
        {/* Search Bar Banner */}
        <div
          className="px-3 sm:px-4 md:px-8 py-3 md:py-4"
          style={{ background: "var(--gradient-header)" }}
        >
          <div className="max-w-7xl mx-auto">
            <SearchBar
              value={search}
              onChange={setSearch}
              onFilterClick={() => setSidebarOpen(true)}
              activeFilterCount={activeFilterCount}
            />
          </div>
        </div>

        {/* Results summary bar */}
        {filteredProjects.length > 0 && (
          <div
            className="px-3 sm:px-4 md:px-8 py-2"
            style={{
              background: "rgba(255,255,255,0.92)",
              borderBottom: "1px solid var(--slate-100)",
            }}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--color-text-muted)" }}
              >
                {/* show how many are visible vs total */}
                Showing {visibleProjects.length} of {filteredProjects.length}{" "}
                project{filteredProjects.length !== 1 ? "s" : ""}
                {activeFilterCount > 0 &&
                  ` · ${activeFilterCount} filter${activeFilterCount !== 1 ? "s" : ""} active`}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() =>
                    setFilters({
                      ...DEFAULT_FILTERS,
                      areaMin: filterOptions.areaRange.min,
                      areaMax: filterOptions.areaRange.max,
                      priceMin: filterOptions.priceRange.min,
                      priceMax: filterOptions.priceRange.max,
                    })
                  }
                  className="text-xs font-bold"
                  style={{ color: "var(--red-600)" }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="px-3 sm:px-4 md:px-8 py-4 md:py-6 max-w-7xl mx-auto">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-5xl mb-3">🔍</p>
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
                  setFilters({
                    ...DEFAULT_FILTERS,
                    areaMin: filterOptions.areaRange.min,
                    areaMax: filterOptions.areaRange.max,
                    priceMin: filterOptions.priceRange.min,
                    priceMax: filterOptions.priceRange.max,
                  });
                  setSearch("");
                }}
              >
                Reset All
              </button>
              <AddProjectBanner onAdd={() => setAddProjectOpen(true)} />
            </div>
          ) : (
            <>
              {/* ── Visible cards ── */}
              <div className="grid-auto-fill-280 stagger">
                {visibleProjects.map((project) => (
                  <ProjectCardUI
                    key={project.id}
                    project={project}
                    onSchedule={handleSchedule}
                  />
                ))}

                {/* Skeleton placeholders while loading more */}
                {loadingMore &&
                  Array.from({
                    length: Math.min(
                      PAGE_SIZE,
                      filteredProjects.length - visibleCount,
                    ),
                  }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
              </div>

              {/* ── Sentinel div — IntersectionObserver watches this ── */}
              <div ref={sentinelRef} style={{ height: 1 }} />

              {/* ── End-of-list message ── */}
              {!hasMore &&
                !loadingMore &&
                filteredProjects.length > PAGE_SIZE && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2rem 0 1rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0.5rem 1.2rem",
                        borderRadius: 999,
                        background: "var(--navy-50)",
                        border: "1px solid var(--navy-100)",
                      }}
                    >
                      <span style={{ fontSize: "0.8rem" }}>✅</span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: "var(--navy-600)",
                        }}
                      >
                        All {filteredProjects.length} projects loaded
                      </span>
                    </div>
                  </div>
                )}

              {/* ── Manual "Load More" button fallback (if IntersectionObserver missed) ── */}
              {hasMore && !loadingMore && (
                <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                  <button
                    onClick={loadMore}
                    className="btn btn-ghost"
                    style={{
                      fontSize: "0.82rem",
                      padding: "0.55rem 1.5rem",
                      gap: 6,
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    Load more projects
                    <span
                      style={{
                        marginLeft: 4,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "1px 7px",
                        borderRadius: 999,
                        background: "var(--navy-50)",
                        color: "var(--navy-600)",
                      }}
                    >
                      {filteredProjects.length - visibleCount} left
                    </span>
                  </button>
                </div>
              )}

              <AddProjectBanner onAdd={() => setAddProjectOpen(true)} />
            </>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}
