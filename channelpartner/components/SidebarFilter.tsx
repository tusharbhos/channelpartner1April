"use client";

import React, { useMemo, useState } from "react";
import { DEFAULT_FILTERS, FilterState } from "@/lib/mockData";

export interface SidebarOptions {
  projects: string[];
  categories: string[];
  tags: string[];
  amenities: string[];
  intents: string[];
  developers: string[];
  locations: string[];
  developmentStatus: { label: string; value: string }[];
  bestSuited: { label: string; value: string }[];
  unitTypes: string[];
  areaRange: { min: number; max: number };
  priceRange: { min: number; max: number };
}

interface SidebarFilterProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  options: SidebarOptions;
}

function sanitizeLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function SearchableMultiDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return options;
    return options.filter((opt) => opt.toLowerCase().includes(query));
  }, [options, search]);

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
  className="input-field flex items-center justify-between text-left"
  onClick={() => setOpen((prev) => !prev)}
>
  {/* LEFT SIDE */}
  <div className="flex items-center gap-1 flex-1 overflow-hidden">
    {selected.length > 0 ? (
      <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {selected.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {item}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggle(item);
              }}
              className="ml-1 text-xs hover:text-red-500"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    ) : (
      <span className="text-gray-400 truncate text-xs">
        Select {label}
      </span>
    )}
  </div>

  {/* RIGHT SIDE (same arrow icon) */}
  <svg
    className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${
      open ? "rotate-180" : ""
    }`}
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
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                className="input-field text-xs py-1.5"
                placeholder={`Search ${label}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-44 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="p-3 text-center text-xs text-gray-400">
                  No options available
                </p>
              ) : (
                filtered.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(item)}
                      onChange={() => toggle(item)}
                    />
                    <span>{item}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchableSingleDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const current = selected[0] ?? "";
  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return options;
    return options.filter((opt) => opt.toLowerCase().includes(query));
  }, [options, search]);

  return (
    <div className="mb-4">
      <label className="label">{label}</label>
      <div className="relative">
        <button
          type="button"
          className="input-field flex items-center justify-between text-left"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span
            className={
              current ? "text-gray-800 truncate" : "text-gray-400 truncate"
            }
          >
            {current || `Select ${label}`}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
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
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                className="input-field text-xs py-1.5"
                placeholder={`Search ${label}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-44 overflow-y-auto">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-blue-50"
                onClick={() => {
                  onChange([]);
                  setOpen(false);
                }}
              >
                Clear selection
              </button>
              {filtered.map((item) => (
                <button
                  type="button"
                  key={item}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50"
                  onClick={() => {
                    onChange([item]);
                    setOpen(false);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChipRadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-4">
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2 mt-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              value === opt.value
                ? "text-black border-transparent"
                : "bg-white border-gray-300 text-gray-600 hover:border-blue-400"
            }`}
            style={
              value === opt.value
                ? { background: "var(--gradient-btn-blue)" }
                : {}
            }
            onClick={() => onChange(opt.value === value ? "" : opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SidebarFilter({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  options,
}: SidebarFilterProps) {
  const update = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetAll = () =>
    onFiltersChange({
      ...DEFAULT_FILTERS,
      areaMin: options.areaRange.min,
      areaMax: options.areaRange.max,
      priceMin: options.priceRange.min,
      priceMax: options.priceRange.max,
    });

  const activeCount = [
    filters.projectName.length,
    filters.categories.length,
    filters.tags.length,
    filters.developer.length,
    filters.location.length,
    filters.amenities.length,
    filters.intent.length,
    filters.unitTypes.length,
    filters.developmentStatus ? 1 : 0,
    filters.bestSuited ? 1 : 0,
    filters.possessionDate ? 1 : 0,
    filters.possessionWithinYears ? 1 : 0,
    filters.unitsAvailable ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const formatPrice = (value: number) => {
    if (!Number.isFinite(value)) return "-";
    if (value >= 10000000) return `Rs ${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)} L`;
    return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
  };

  const years = Array.from({ length: 10 }, (_, idx) => idx + 1);

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-label="Close filters"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-80 max-w-[90vw] z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "white", boxShadow: "var(--shadow-sidebar)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ background: "var(--gradient-header)" }}
        >
          <div>
            <h2
              className="text-white font-bold text-lg"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Filters
            </h2>
            {activeCount > 0 && (
              <p className="text-xs text-white/70">{activeCount} active</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={resetAll}
                className="text-xs text-white/80 hover:text-white underline underline-offset-2 transition-colors"
              >
                Reset All
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
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

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <SearchableMultiDropdown
            label="Project Name"
            options={options.projects.map(sanitizeLabel)}
            selected={filters.projectName}
            onChange={(value) => update("projectName", value)}
          />

          <SearchableMultiDropdown
            label="Category"
            options={options.categories.map(sanitizeLabel)}
            selected={filters.categories}
            onChange={(value) => update("categories", value)}
          />

          <SearchableMultiDropdown
            label="Amenities"
            options={options.amenities.map(sanitizeLabel)}
            selected={filters.amenities}
            onChange={(value) => update("amenities", value)}
          />

          <SearchableMultiDropdown
            label="Unit Type"
            options={options.unitTypes.map(sanitizeLabel)}
            selected={filters.unitTypes}
            onChange={(value) => update("unitTypes", value)}
          />

          <SearchableMultiDropdown
            label="Tags"
            options={options.tags.map(sanitizeLabel)}
            selected={filters.tags}
            onChange={(value) => update("tags", value)}
          />

          <SearchableMultiDropdown
            label="Intent"
            options={options.intents.map(sanitizeLabel)}
            selected={filters.intent}
            onChange={(value) => update("intent", value)}
          />

          <SearchableSingleDropdown
            label="Developer"
            options={options.developers.map(sanitizeLabel)}
            selected={filters.developer}
            onChange={(value) => update("developer", value)}
          />

          <SearchableSingleDropdown
            label="Location"
            options={options.locations.map(sanitizeLabel)}
            selected={filters.location}
            onChange={(value) => update("location", value)}
          />

          <ChipRadioGroup
            label="Development Status"
            options={options.developmentStatus}
            value={filters.developmentStatus}
            onChange={(value) => update("developmentStatus", value)}
          />

          <ChipRadioGroup
            label="Best Suited"
            options={options.bestSuited}
            value={filters.bestSuited}
            onChange={(value) => update("bestSuited", value)}
          />

          <div className="mb-4">
            <label className="label">Possession Date</label>
            <input
              type="date"
              className="input-field"
              value={filters.possessionDate}
              onChange={(e) => update("possessionDate", e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="label">Possession Within (Years)</label>
            <select
              className="input-field"
              value={filters.possessionWithinYears}
              onChange={(e) =>
                update("possessionWithinYears", Number(e.target.value))
              }
            >
              <option value={0}>Any time</option>
              {years.map((year) => (
                <option
                  key={year}
                  value={year}
                >{`Within ${year} year${year > 1 ? "s" : ""}`}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="label">Area Range (sq.ft)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className="input-field text-xs"
                value={filters.areaMin}
                min={options.areaRange.min}
                max={filters.areaMax}
                onChange={(e) => update("areaMin", Number(e.target.value))}
              />
              <input
                type="number"
                className="input-field text-xs"
                value={filters.areaMax}
                min={filters.areaMin}
                max={options.areaRange.max}
                onChange={(e) => update("areaMax", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Min Price</label>
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--color-secondary)" }}
              >
                {formatPrice(filters.priceMin)}
              </span>
            </div>
            <input
              type="range"
              className="w-full"
              min={options.priceRange.min}
              max={filters.priceMax}
              value={filters.priceMin}
              onChange={(e) => update("priceMin", Number(e.target.value))}
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Max Price</label>
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--color-secondary)" }}
              >
                {formatPrice(filters.priceMax)}
              </span>
            </div>
            <input
              type="range"
              className="w-full"
              min={filters.priceMin}
              max={options.priceRange.max}
              value={filters.priceMax}
              onChange={(e) => update("priceMax", Number(e.target.value))}
            />
          </div>

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

        <div className="px-4 pb-5 pt-3 border-t border-gray-100 flex gap-2 shrink-0">
          <button
            onClick={resetAll}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-black btn-primary"
          >
            Apply Filters
          </button>
        </div>
      </aside>
    </>
  );
}
