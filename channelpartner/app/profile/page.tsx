"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { AuthAPI, ProfileUpdatePayload } from "@/lib/api";

type Step = 1 | 2 | 3;

type ProfileForm = {
  name: string;
  company_name: string;
  company_size: string;
  profile_image_url: string;
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

const companySizeOptions = [
  { label: "Individual", value: "individual" },
  { label: "1-2", value: "1-2" },
  { label: "5-10", value: "5-10" },
  { label: "10-20", value: "10-20" },
  { label: "20-50", value: "20-50" },
  { label: "50-100", value: "50-100" },
  { label: "100+", value: "100+" },
];

function toCompanySizeLabel(value: string): string {
  const found = companySizeOptions.find((opt) => opt.value === value);
  return found ? found.label : value || "-";
}

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
  const initializedRef = useRef(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");

  const [form, setForm] = useState<ProfileForm>(() => ({
    name: user?.name ?? "",
    company_name: user?.company_name ?? "",
    company_size: user?.company_size ?? "",
    profile_image_url: user?.profile_image_url ?? "",
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

    if (!initializedRef.current) {
      setShowSummary(true);
      initializedRef.current = true;
    }

    setForm({
      name: user.name ?? "",
      company_name: user.company_name ?? "",
      company_size: user.company_size ?? "",
      profile_image_url: user.profile_image_url ?? "",
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
    setProfileImageFile(null);
    setProfileImagePreview(user.profile_image_url ?? "");
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

    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("company_name", form.company_name);
    if (form.company_size) payload.append("company_size", form.company_size);
    payload.append("rera_no", form.rera_no);
    payload.append("phone", form.phone);
    payload.append("city", form.city);
    payload.append("address", form.address);
    if (form.experience_level)
      payload.append("experience_level", form.experience_level);
    if (form.primary_market)
      payload.append("primary_market", form.primary_market);
    form.budget_segments.forEach((value) =>
      payload.append("budget_segments[]", value),
    );
    if (form.max_ticket_size)
      payload.append("max_ticket_size", String(Number(form.max_ticket_size)));
    form.buyer_types.forEach((value) => payload.append("buyer_types[]", value));
    form.project_preference.forEach((value) =>
      payload.append("project_preference[]", value),
    );
    if (form.micro_markets) payload.append("micro_markets", form.micro_markets);
    if (form.sell_cities) payload.append("sell_cities", form.sell_cities);
    if (form.avg_leads_per_month)
      payload.append("avg_leads_per_month", form.avg_leads_per_month);
    if (form.avg_site_visits_per_month)
      payload.append(
        "avg_site_visits_per_month",
        form.avg_site_visits_per_month,
      );
    if (form.avg_closures_per_month)
      payload.append("avg_closures_per_month", form.avg_closures_per_month);
    if (form.selling_style) payload.append("selling_style", form.selling_style);
    form.available_slots.forEach((value) =>
      payload.append("available_slots[]", value),
    );
    form.channels_used.forEach((value) =>
      payload.append("channels_used[]", value),
    );
    payload.append("onboarding_step", String(targetStep ?? step));
    if (profileImageFile) payload.append("profile_image", profileImageFile);

    setSaving(true);
    try {
      await AuthAPI.updateProfile(payload);
      await refreshUser();
      setMessage("Saved successfully.");
      if (targetStep) {
        setShowSummary(false);
        setStep(targetStep);
      } else {
        setStep(3);
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
                    <span className="auth-text-muted">Company Size:</span>{" "}
                    {toCompanySizeLabel(form.company_size)}
                  </div>
                  <div>
                    <span className="auth-text-muted">Profile Image:</span>{" "}
                    {profileImagePreview ? (
                      <img
                        src={profileImagePreview}
                        alt="Profile"
                        style={{
                          width: 56,
                          height: 56,
                          objectFit: "cover",
                          borderRadius: 999,
                          display: "inline-block",
                          verticalAlign: "middle",
                          border: "2px solid var(--navy-100)",
                        }}
                      />
                    ) : (
                      "-"
                    )}
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
                <div
                  className="flex items-center gap-4 p-3 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(255,255,255,0.45)",
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 999,
                      overflow: "hidden",
                      background: "var(--navy-50)",
                      border: "2px solid var(--navy-100)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {profileImagePreview ? (
                      <img
                        src={profileImagePreview}
                        alt="Profile preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: "1.4rem",
                          fontWeight: 800,
                          color: "var(--navy-700)",
                        }}
                      >
                        {form.name?.trim()?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="auth-form-label">Profile Image</label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="auth-form-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setProfileImageFile(file);
                        if (file) {
                          setProfileImagePreview(URL.createObjectURL(file));
                        } else {
                          setProfileImagePreview(form.profile_image_url || "");
                        }
                      }}
                    />
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Upload JPG, PNG or WEBP up to 2MB.
                    </p>
                  </div>
                </div>

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
                    <label className="auth-form-label">Company Size</label>
                    <select
                      className="auth-form-input"
                      value={form.company_size}
                      onChange={(e) => setValue("company_size", e.target.value)}
                    >
                      <option value="">Select</option>
                      {companySizeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div />
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
                    className="btn btn-ghost"
                    disabled={saving}
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
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
