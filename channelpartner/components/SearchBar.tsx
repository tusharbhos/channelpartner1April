// components/SearchBar.tsx
"use client";

import React from "react";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onFilterClick: () => void;
  activeFilterCount?: number;
}

export default function SearchBar({ value, onChange, onFilterClick, activeFilterCount = 0 }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2.5 w-full max-w-3xl mx-auto">
      {/* Search input */}
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--navy-400)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search projects, developers, locations…"
          className=" pl-10 pr-9 py-2.5"
          style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 2px 8px rgba(10,22,40,0.08)" }}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold transition-colors hover:bg-black/10"
            style={{ color: "var(--color-text-muted)" }}
          >
            ×
          </button>
        )}
      </div>

      {/* Filter button */}
      <div className="relative flex-shrink-0">
        <button
          onClick={onFilterClick}
          className="btn flex items-center gap-2 py-2.5 px-4"
          style={{
            background: activeFilterCount > 0 ? "var(--gradient-btn-gold)" : "rgba(255,255,255,0.95)",
            color:      activeFilterCount > 0 ? "#fff" : "var(--navy-700)",
            border:     activeFilterCount > 0 ? "none" : "1.5px solid rgba(255,255,255,0.5)",
            boxShadow:  "0 2px 8px rgba(10,22,40,0.1)",
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 9h10M10 14h4M12 19h0" />
          </svg>
          <span className="hidden sm:inline font-semibold">Filters</span>
        </button>
        {activeFilterCount > 0 && (
          <span
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center border-2 border-white"
            style={{ background: "var(--red-600)", color: "#fff" }}
          >
            {activeFilterCount}
          </span>
        )}
      </div>
    </div>
  );
}