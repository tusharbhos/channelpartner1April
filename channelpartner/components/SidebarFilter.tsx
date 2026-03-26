"use client";

import React, { useState } from "react";
import {
  PROJECTS,
  DEVELOPERS,
  LOCATIONS,
  AMENITIES,
  INTENTS,
  UNIT_TYPES,
  DEVELOPMENT_STATUS,
  BEST_SUITED,
  FilterState,
  DEFAULT_FILTERS,
} from "@/lib/mockData";

interface SidebarFilterProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
}

// ── Searchable multi-select dropdown ──────────────────────
function SearchableDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (item: string) => {
    onChange(
      selected.includes(item)
        ? selected.filter((s) => s !== item)
        : [...selected, item],
    );
  };

  return (
    <div className="mb-4">
      <label className="label">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="input-field flex items-center justify-between text-left"
          style={{ cursor: "pointer" }}
        >
          <span className={selected.length ? "text-gray-800" : "text-gray-400"}>
            {selected.length
              ? `${selected.length} selected`
              : `Select ${label}`}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {open && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder={`Search ${label}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field text-xs py-1.5"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-44 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-gray-400 p-3 text-center">
                  No results
                </p>
              ) : (
                filtered.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(item)}
                      onChange={() => toggle(item)}
                    />
                    <span className="text-xs text-gray-700">{item}</span>
                  </label>
                ))
              )}
            </div>
            {/* selected tags */}
            {selected.length > 0 && (
              <div className="p-2 border-t border-gray-100 flex flex-wrap gap-1">
                {selected.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-black"
                    style={{ background: "var(--color-primary)" }}
                  >
                    {s}
                    <button
                      onClick={() => toggle(s)}
                      className="ml-0.5 hover:opacity-75"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Radio group ────────────────────────────────────────────
function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-4">
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2 mt-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value === value ? "" : o.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              value === o.value
                ? "text-black border-transparent"
                : "bg-white border-gray-300 text-gray-600 hover:border-blue-400"
            }`}
            style={
              value === o.value
                ? { background: "var(--gradient-btn-blue)" }
                : {}
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Range Slider ───────────────────────────────────────────
function RangeSlider({
  label,
  min,
  max,
  value,
  onChange,
  format,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <label className="label mb-0">{label}</label>
        <span
          className="text-xs font-bold"
          style={{ color: "var(--color-secondary)" }}
        >
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

// ── Main Sidebar ───────────────────────────────────────────
export default function SidebarFilter({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: SidebarFilterProps) {
  const update = <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
    onFiltersChange({ ...filters, [key]: val });

  const formatPrice = (v: number) =>
    v >= 10000000
      ? `₹${(v / 10000000).toFixed(1)}Cr`
      : `₹${(v / 100000).toFixed(0)}L`;

  const formatArea = (v: number) => `${v.toLocaleString()} sq.ft`;

  const resetAll = () => onFiltersChange(DEFAULT_FILTERS);

  const activeCount = [
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

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-label="Close filters"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 max-w-[90vw] z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "white", boxShadow: "var(--shadow-sidebar)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: "var(--gradient-header)" }}
        >
          <div>
            <h2
              className="text-black font-bold text-lg"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Filters
            </h2>
            {activeCount > 0 && (
              <p className="text-xs text-black/70">{activeCount} active</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={resetAll}
                className="text-xs text-black/80 hover:text-black underline underline-offset-2 transition-colors"
              >
                Reset All
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-black transition-colors"
              aria-label="Close"
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
        </div>

        {/* Active filter chips */}
        {activeCount > 0 && (
          <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {[
              ...filters.projectName,
              ...filters.developer,
              ...filters.location,
              ...filters.amenities,
              ...filters.intent,
              ...filters.unitTypes,
              ...(filters.developmentStatus
                ? [
                    DEVELOPMENT_STATUS.find(
                      (d) => d.value === filters.developmentStatus,
                    )?.label || "",
                  ]
                : []),
              ...(filters.bestSuited
                ? [
                    BEST_SUITED.find((b) => b.value === filters.bestSuited)
                      ?.label || "",
                  ]
                : []),
            ].map((chip, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-black font-medium"
                style={{ background: "var(--color-secondary)" }}
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Scrollable filters */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <SearchableDropdown
            label="Project Name"
            options={PROJECTS}
            selected={filters.projectName}
            onChange={(v) => update("projectName", v)}
          />

          <SearchableDropdown
            label="Developer"
            options={DEVELOPERS}
            selected={filters.developer}
            onChange={(v) => update("developer", v)}
          />

          <SearchableDropdown
            label="Location"
            options={LOCATIONS}
            selected={filters.location}
            onChange={(v) => update("location", v)}
          />

          <SearchableDropdown
            label="Amenities"
            options={AMENITIES}
            selected={filters.amenities}
            onChange={(v) => update("amenities", v)}
          />

          <RadioGroup
            label="Development Status"
            options={DEVELOPMENT_STATUS}
            value={filters.developmentStatus}
            onChange={(v) => update("developmentStatus", v)}
          />

          <RadioGroup
            label="Best Suited For"
            options={BEST_SUITED}
            value={filters.bestSuited}
            onChange={(v) => update("bestSuited", v)}
          />

          <SearchableDropdown
            label="Intent"
            options={INTENTS}
            selected={filters.intent}
            onChange={(v) => update("intent", v)}
          />

          {/* Possession Date */}
          <div className="mb-4">
            <label className="label">Possession Date</label>
            <input
              type="date"
              value={filters.possessionDate}
              onChange={(e) => update("possessionDate", e.target.value)}
              className="input-field"
            />
          </div>

          {/* Unit Types – checkboxes */}
          <div className="mb-4">
            <label className="label">Type of Units</label>
            <div className="grid grid-cols-2 gap-1 mt-1">
              {UNIT_TYPES.map((ut) => (
                <label
                  key={ut}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.unitTypes.includes(ut)}
                    onChange={() =>
                      update(
                        "unitTypes",
                        filters.unitTypes.includes(ut)
                          ? filters.unitTypes.filter((u) => u !== ut)
                          : [...filters.unitTypes, ut],
                      )
                    }
                  />
                  <span className="text-xs text-gray-700">{ut}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Area range */}
          <div className="mb-4">
            <label className="label">Area in Sq. Ft.</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-xs text-gray-400 mb-1 block">Low</span>
                <input
                  type="number"
                  value={filters.areaMin}
                  onChange={(e) => update("areaMin", Number(e.target.value))}
                  className="input-field text-xs"
                  placeholder="Min area"
                  min={200}
                  max={filters.areaMax}
                />
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-400 mb-1 block">High</span>
                <input
                  type="number"
                  value={filters.areaMax}
                  onChange={(e) => update("areaMax", Number(e.target.value))}
                  className="input-field text-xs"
                  placeholder="Max area"
                  min={filters.areaMin}
                  max={10000}
                />
              </div>
            </div>
          </div>

          <RangeSlider
            label="Lower Floor Price"
            min={2000000}
            max={filters.priceMax}
            value={filters.priceMin}
            onChange={(v) => update("priceMin", v)}
            format={formatPrice}
          />

          <RangeSlider
            label="Higher Floor Price"
            min={filters.priceMin}
            max={50000000}
            value={filters.priceMax}
            onChange={(v) => update("priceMax", v)}
            format={formatPrice}
          />

          {/* Units Available */}
          <div className="mb-6">
            <label className="label">Units Available (Min)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={500}
                value={filters.unitsAvailable}
                onChange={(e) =>
                  update("unitsAvailable", Number(e.target.value))
                }
                className="flex-1"
              />
              <span
                className="w-12 text-center text-sm font-bold rounded-md py-1"
                style={{ background: "var(--color-primary)", color: "white" }}
              >
                {filters.unitsAvailable}
              </span>
            </div>
          </div>
        </div>

        {/* Apply button */}
        <div className="px-4 pb-5 pt-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
          <button
            onClick={resetAll}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-black btn-primary transition-all"
          >
            Apply Filters
          </button>
        </div>
      </aside>
    </>
  );
}
