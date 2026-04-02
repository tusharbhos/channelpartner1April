"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { AuthAPI, ProfileUpdatePayload } from "@/lib/api";

type Step = 1 | 2 | 3;

type ProfileForm = {
  name: string;
  company_name: string;
  rera_no: string;
  phone: string;
  city: string;
  address: string;
  experience_level: string;
  primary_market: string;
  budget_segments: string[];
  max_ticket_size: string;
  buyer_types: string[];
  project_preference: string[];
  micro_markets: string;
  sell_cities: string;
  avg_leads_per_month: string;
  avg_site_visits_per_month: string;
  avg_closures_per_month: string;
  selling_style: "" | "own_leads" | "developer_leads" | "both";
  available_slots: string[];
  channels_used: string[];
};

const budgetOptions = [
  "<50L",
  "50L-1.5CR",
  "1.5CR-3CR",
  "3CR-5CR",
  "5CR-10CR",
  "10CR-25CR",
  "25CR-50CR",
  "50CR+",
];
const buyerTypeOptions = ["End Users", "Investors", "NRIs", "Mix"];
const slotOptions = ["Weekday evenings", "Weekends", "Flexible"];
const channelOptions = [
  "WhatsApp",
  "Instagram",
  "Broker Network",
  "NRI Network",
];
const projectPreferenceOptions = [
  "Ready to Move",
  "Nearing Possession",
  "Under Construction",
  "Premium Projects",
  "Bulk Inventory Projects",
];
const monthlyVolumeOptions = [
  { label: "1-5", value: "5" },
  { label: "5-15", value: "15" },
  { label: "15-50", value: "50" },
  { label: "50-100", value: "100" },
  { label: "100-200", value: "200" },
  { label: "200-500", value: "500" },
  { label: "500+", value: "501" },
];

function toVolumeLabel(value: string): string {
  const found = monthlyVolumeOptions.find((opt) => opt.value === value);
  return found ? found.label : "-";
}

function toPrimaryMarketLabel(value: string): string {
  if (value === "residential") return "Residential";
  if (value === "commercial") return "Commercial";
  if (value === "both") return "Both";
  return "-";
}

function toSellingStyleLabel(value: ProfileForm["selling_style"]): string {
  if (value === "own_leads") return "Generate your own leads";
  if (value === "developer_leads") return "Work on developer leads";
  if (value === "both") return "Both";
  return "-";
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  const [form, setForm] = useState<ProfileForm>(() => ({
    name: user?.name ?? "",
    company_name: user?.company_name ?? "",
    rera_no: user?.rera_no ?? "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    address: user?.address ?? "",
    experience_level: user?.experience_level ?? "",
    primary_market: user?.primary_market ?? "",
    budget_segments: user?.budget_segments ?? [],
    max_ticket_size: user?.max_ticket_size ? String(user.max_ticket_size) : "",
    buyer_types: user?.buyer_types ?? [],
    project_preference: user?.project_preference ?? [],
    micro_markets: user?.micro_markets ?? "",
    sell_cities: user?.sell_cities ?? "",
    avg_leads_per_month: user?.avg_leads_per_month
      ? String(user.avg_leads_per_month)
      : "",
    avg_site_visits_per_month: user?.avg_site_visits_per_month
      ? String(user.avg_site_visits_per_month)
      : "",
    avg_closures_per_month: user?.avg_closures_per_month
      ? String(user.avg_closures_per_month)
      : "",
    selling_style: (user?.selling_style as ProfileForm["selling_style"]) ?? "",
    available_slots: user?.available_slots ?? [],
    channels_used: user?.channels_used ?? [],
  }));

  useEffect(() => {
    if (!user) return;
    setShowSummary(true);
    setForm({
      name: user.name ?? "",
      company_name: user.company_name ?? "",
      rera_no: user.rera_no ?? "",
      phone: user.phone ?? "",
      city: user.city ?? "",
      address: user.address ?? "",
      experience_level: user.experience_level ?? "",
      primary_market: user.primary_market ?? "",
      budget_segments: user.budget_segments ?? [],
      max_ticket_size: user.max_ticket_size ? String(user.max_ticket_size) : "",
      buyer_types: user.buyer_types ?? [],
      project_preference: user.project_preference ?? [],
      micro_markets: user.micro_markets ?? "",
      sell_cities: user.sell_cities ?? "",
      avg_leads_per_month: user.avg_leads_per_month
        ? String(user.avg_leads_per_month)
        : "",
      avg_site_visits_per_month: user.avg_site_visits_per_month
        ? String(user.avg_site_visits_per_month)
        : "",
      avg_closures_per_month: user.avg_closures_per_month
        ? String(user.avg_closures_per_month)
        : "",
      selling_style: (user.selling_style as ProfileForm["selling_style"]) ?? "",
      available_slots: user.available_slots ?? [],
      channels_used: user.channels_used ?? [],
    });
    if (user.onboarding_step && [1, 2, 3].includes(user.onboarding_step)) {
      setStep(user.onboarding_step as Step);
    }
  }, [user]);

  const canAccess = useMemo(
    () => !isLoading && isAuthenticated,
    [isLoading, isAuthenticated],
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const setValue = <K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage("");
  };

  const toggleArray = (
    key:
      | "budget_segments"
      | "buyer_types"
      | "project_preference"
      | "available_slots"
      | "channels_used",
    value: string,
  ) => {
    setForm((prev) => {
      const has = prev[key].includes(value);
      return {
        ...prev,
        [key]: has
          ? prev[key].filter((v) => v !== value)
          : [...prev[key], value],
      };
    });
    setMessage("");
  };

  const saveStep = async (targetStep?: Step) => {
    if (!user) return;

    const payload: ProfileUpdatePayload = {
      name: form.name,
      company_name: form.company_name,
      rera_no: form.rera_no,
      phone: form.phone,
      city: form.city,
      address: form.address,
      experience_level: form.experience_level || undefined,
      primary_market: form.primary_market || undefined,
      budget_segments: form.budget_segments.length
        ? form.budget_segments
        : undefined,
      max_ticket_size: form.max_ticket_size
        ? Number(form.max_ticket_size)
        : undefined,
      buyer_types: form.buyer_types.length ? form.buyer_types : undefined,
      project_preference: form.project_preference.length
        ? form.project_preference
        : undefined,
      micro_markets: form.micro_markets || undefined,
      sell_cities: form.sell_cities || undefined,
      avg_leads_per_month: form.avg_leads_per_month
        ? Number(form.avg_leads_per_month)
        : undefined,
      avg_site_visits_per_month: form.avg_site_visits_per_month
        ? Number(form.avg_site_visits_per_month)
        : undefined,
      avg_closures_per_month: form.avg_closures_per_month
        ? Number(form.avg_closures_per_month)
        : undefined,
      selling_style: form.selling_style || undefined,
      available_slots: form.available_slots.length
        ? form.available_slots
        : undefined,
      channels_used: form.channels_used.length ? form.channels_used : undefined,
      onboarding_step: targetStep ?? step,
    };

    setSaving(true);
    try {
      await AuthAPI.updateProfile(payload);
      await refreshUser();
      setMessage("Saved successfully.");
      if (targetStep) {
        setStep(targetStep);
      } else {
        setShowSummary(true);
      }
    } catch {
      setMessage("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-main">
      <Header variant="app" />
      <main className="flex-1" style={{ paddingTop: "var(--header-height)" }}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="glass-card p-5 md:p-7">
            <h1
              className="text-xl font-bold mb-2"
              style={{
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-display)",
              }}
            >
              Help us show you better projects
            </h1>
            <p className="text-sm auth-text-muted mb-5">
              {showSummary ? "Profile Summary" : `Step ${step} of 3`}
            </p>

            {showSummary && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="auth-text-muted">Name:</span>{" "}
                    {form.name || "-"}
                  </div>
                  <div>
                    <span className="auth-text-muted">Mobile:</span>{" "}
                    {form.phone || "-"}
                  </div>
                  <div>
                    <span className="auth-text-muted">Company Name:</span>{" "}
                    {form.company_name || "-"}
                  </div>
                  <div>
                    <span className="auth-text-muted">RERA No:</span>{" "}
                    {form.rera_no || "-"}
                  </div>
                  <div>
                    <span className="auth-text-muted">City:</span>{" "}
                    {form.city || "-"}
                  </div>
                  <div>
                    <span className="auth-text-muted">Address:</span>{" "}
                    {form.address || "-"}
                  </div>
                  <div>
                    <span className="auth-text-muted">Experience:</span>{" "}
                    {form.experience_level || "-"}
                  </div>
                  <div>
                    <span className="auth-text-muted">Primary Market:</span>{" "}
                    {toPrimaryMarketLabel(form.primary_market)}
                  </div>
                  <div>
                    <span className="auth-text-muted">Budget Expertise:</span>{" "}
                    {form.budget_segments.length
                      ? form.budget_segments.join(", ")
                      : "-"}
                  </div>
                  <div>
                    <span className="auth-text-muted">
                      Max Ticket Size Handled:
                    </span>{" "}
                    {form.max_ticket_size || "-"}
                  </div>
                  <div>
                    <span className="auth-text-muted">Buyer Type:</span>{" "}
                    {form.buyer_types.length
                      ? form.buyer_types.join(", ")
                      : "-"}
                  </div>
                  <div>
                    <span className="auth-text-muted">Avg Leads/Month:</span>{" "}
                    {toVolumeLabel(form.avg_leads_per_month)}
                  </div>
                  <div>
                    <span className="auth-text-muted">
                      Avg Site Visits/Month:
                    </span>{" "}
                    {toVolumeLabel(form.avg_site_visits_per_month)}
                  </div>
                  <div>
                    <span className="auth-text-muted">Avg Closures/Month:</span>{" "}
                    {toVolumeLabel(form.avg_closures_per_month)}
                  </div>
                  <div>
                    <span className="auth-text-muted">Selling Style:</span>{" "}
                    {toSellingStyleLabel(form.selling_style)}
                  </div>
                  <div>
                    <span className="auth-text-muted">Project Preference:</span>{" "}
                    {form.project_preference.length
                      ? form.project_preference.join(", ")
                      : "-"}
                  </div>
                  <div>
                    <span className="auth-text-muted">Micro-markets:</span>{" "}
                    {form.micro_markets || "-"}
                  </div>
                  <div>
                    <span className="auth-text-muted">Selling Cities:</span>{" "}
                    {form.sell_cities || "-"}
                  </div>
                  <div>
                    <span className="auth-text-muted">Available Slots:</span>{" "}
                    {form.available_slots.length
                      ? form.available_slots.join(", ")
                      : "-"}
                  </div>
                  <div>
                    <span className="auth-text-muted">Channels Used:</span>{" "}
                    {form.channels_used.length
                      ? form.channels_used.join(", ")
                      : "-"}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    className="btn btn-gold"
                    onClick={() => {
                      setShowSummary(false);
                      setStep(1);
                    }}
                  >
                    Update Profile
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => router.push("/dashboard")}
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}

            {!showSummary && step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="auth-form-label">Name</label>
                    <input
                      className="auth-form-input"
                      value={form.name}
                      onChange={(e) => setValue("name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="auth-form-label">Mobile</label>
                    <input
                      className="auth-form-input"
                      value={form.phone}
                      onChange={(e) =>
                        setValue(
                          "phone",
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="auth-form-label">City</label>
                    <input
                      className="auth-form-input"
                      value={form.city}
                      onChange={(e) => setValue("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="auth-form-label">Company Name</label>
                    <input
                      className="auth-form-input"
                      value={form.company_name}
                      onChange={(e) => setValue("company_name", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="auth-form-label">RERA No</label>
                    <input
                      className="auth-form-input"
                      value={form.rera_no}
                      onChange={(e) => setValue("rera_no", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="auth-form-label">Address</label>
                    <input
                      className="auth-form-input"
                      value={form.address}
                      onChange={(e) => setValue("address", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    className="btn btn-gold"
                    disabled={saving}
                    onClick={() => saveStep(2)}
                  >
                    {saving ? "Saving..." : "Save & Next"}
                  </button>
                </div>
              </div>
            )}

            {!showSummary && step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="auth-form-label">
                      Experience (in Years)
                    </label>
                    <select
                      className="auth-form-input"
                      value={form.experience_level}
                      onChange={(e) =>
                        setValue("experience_level", e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      <option value="0-2">0-2</option>
                      <option value="2-5">2-5</option>
                      <option value="5-10">5-10</option>
                      <option value="10-15">10-15</option>
                      <option value="15-20">15-20</option>
                      <option value="20+">20+</option>
                    </select>
                  </div>
                  <div>
                    <label className="auth-form-label">Primary Market</label>
                    <select
                      className="auth-form-input"
                      value={form.primary_market}
                      onChange={(e) =>
                        setValue("primary_market", e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="auth-form-label">Budget Expertise</label>
                  <div className="flex flex-wrap gap-2">
                    {budgetOptions.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`btn ${form.budget_segments.includes(v) ? "btn-gold" : "btn-ghost"}`}
                        onClick={() => toggleArray("budget_segments", v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="auth-form-label">
                      Max ticket size handled till date
                    </label>
                    <input
                      className="auth-form-input"
                      value={form.max_ticket_size}
                      onChange={(e) =>
                        setValue(
                          "max_ticket_size",
                          e.target.value.replace(/[^0-9.]/g, ""),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="auth-form-label">Buyer Type</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {buyerTypeOptions.map((v) => (
                        <button
                          key={v}
                          type="button"
                          className={`btn ${form.buyer_types.includes(v) ? "btn-gold" : "btn-ghost"}`}
                          onClick={() => toggleArray("buyer_types", v)}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="auth-form-label">Avg Leads / Month</label>
                    <select
                      className="auth-form-input"
                      value={form.avg_leads_per_month}
                      onChange={(e) =>
                        setValue("avg_leads_per_month", e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      {monthlyVolumeOptions.map((opt) => (
                        <option key={`leads-${opt.value}`} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="auth-form-label">
                      Avg Site Visits / Month
                    </label>
                    <select
                      className="auth-form-input"
                      value={form.avg_site_visits_per_month}
                      onChange={(e) =>
                        setValue("avg_site_visits_per_month", e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      {monthlyVolumeOptions.map((opt) => (
                        <option key={`visits-${opt.value}`} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="auth-form-label">
                      Avg Closures / Month
                    </label>
                    <select
                      className="auth-form-input"
                      value={form.avg_closures_per_month}
                      onChange={(e) =>
                        setValue("avg_closures_per_month", e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      {monthlyVolumeOptions.map((opt) => (
                        <option key={`closures-${opt.value}`} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    className="btn btn-gold"
                    disabled={saving}
                    onClick={() => saveStep(3)}
                  >
                    {saving ? "Saving..." : "Save & Next"}
                  </button>
                </div>
              </div>
            )}

            {!showSummary && step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="auth-form-label">Selling Style</label>
                  <select
                    className="auth-form-input"
                    value={form.selling_style}
                    onChange={(e) =>
                      setValue(
                        "selling_style",
                        e.target.value as ProfileForm["selling_style"],
                      )
                    }
                  >
                    <option value="">Select</option>
                    <option value="own_leads">Generate your own leads</option>
                    <option value="developer_leads">
                      Work on developer leads
                    </option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="auth-form-label">Project Preference</label>
                  <div className="flex flex-wrap gap-2">
                    {projectPreferenceOptions.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`btn ${form.project_preference.includes(v) ? "btn-gold" : "btn-ghost"}`}
                        onClick={() => toggleArray("project_preference", v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="auth-form-label">
                      Micro-markets (comma separated)
                    </label>
                    <input
                      className="auth-form-input"
                      value={form.micro_markets}
                      onChange={(e) =>
                        setValue("micro_markets", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="auth-form-label">
                      Selling Cities (comma separated)
                    </label>
                    <input
                      className="auth-form-input"
                      value={form.sell_cities}
                      onChange={(e) => setValue("sell_cities", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="auth-form-label">Available Slots</label>
                  <div className="flex flex-wrap gap-2">
                    {slotOptions.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`btn ${form.available_slots.includes(v) ? "btn-gold" : "btn-ghost"}`}
                        onClick={() => toggleArray("available_slots", v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="auth-form-label">Channels Used</label>
                  <div className="flex flex-wrap gap-2">
                    {channelOptions.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`btn ${form.channels_used.includes(v) ? "btn-gold" : "btn-ghost"}`}
                        onClick={() => toggleArray("channels_used", v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    className="btn btn-ghost"
                    disabled={saving}
                    onClick={() => setStep(2)}
                  >
                    Back
                  </button>
                  <button
                    className="btn btn-gold"
                    disabled={saving}
                    onClick={() => saveStep()}
                  >
                    {saving ? "Saving..." : "Submit Profile"}
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div
                className={`alert mt-4 ${message.includes("failed") ? "alert-danger" : "alert-success"}`}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
