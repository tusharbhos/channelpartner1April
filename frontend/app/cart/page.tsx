"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddCustomerModal from "@/components/AddCustomerModal";
import {
  Customer,
  CustomerAPI,
  CustomerProjectLinkAPI,
  LinkedProjectCard,
} from "@/lib/api";
import {
  ApiProject,
  fetchAllProjects,
  mediaUrl,
  normalize,
  toCardPrice,
  toNumber,
  toStatusLabel,
} from "@/lib/conectr";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "under construction": { bg: "rgba(249,115,22,0.12)", color: "#b47a00" },
  ready: { bg: "rgba(22,163,74,0.12)", color: "#15803d" },
  "ready to move": { bg: "rgba(22,163,74,0.12)", color: "#15803d" },
  default: { bg: "rgba(30,69,128,0.1)", color: "#1e4580" },
};

function statusStyle(label: string) {
  const key = label.toLowerCase();
  return STATUS_COLORS[key] ?? STATUS_COLORS.default;
}

function mapProjectCard(project: ApiProject): LinkedProjectCard {
  const units = project.units ?? [];
  const unitTypes = Array.from(
    new Set(units.map((u) => normalize(u.unit_type)).filter(Boolean)),
  );
  const areaMin = units.map((u) => toNumber(u.area_min)).filter((v) => v > 0);
  const areaMax = units.map((u) => toNumber(u.area_max)).filter((v) => v > 0);
  const areaText =
    areaMin.length || areaMax.length
      ? `${Math.min(...(areaMin.length ? areaMin : areaMax)).toLocaleString("en-IN")} – ${Math.max(...(areaMax.length ? areaMax : areaMin)).toLocaleString("en-IN")} sq.ft`
      : "-";
  const developmentStatusRaw = normalize(project.development_status);
  return {
    id: project.id,
    title: normalize(project.title) || "Untitled Project",
    developer: normalize(project.developer) || "",
    location: normalize(project.location) || "-",
    price: toCardPrice(project) || "-",
    image_url:
      mediaUrl(project.background_image_mobile) ||
      mediaUrl(project.background_image_desktop) ||
      mediaUrl(project.main_logo) ||
      "",
    unit_types: unitTypes.length ? unitTypes.join(" / ") : "-",
    area: areaText,
    possession: normalize(project.possession_date) || "-",
    status: developmentStatusRaw ? toStatusLabel(developmentStatusRaw) : "-",
    units_left:
      typeof project.available_units === "number"
        ? project.available_units
        : undefined,
  };
}

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { cartItems, removeFromCart, addToCart, clearCart } = useCart();

  // All projects
  const [allProjects, setAllProjects] = useState<ApiProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Derived cart IDs
  const cartProjectIds = useMemo(
    () => cartItems.map((item) => item.id),
    [cartItems],
  );

  // Customer selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // Project search
  const [projectSearch, setProjectSearch] = useState("");

  // Sending state
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [includeDetails, setIncludeDetails] = useState(true);

  // Contact fields for sending
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  const openExternalTab = useCallback((url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // Load all projects
  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;
    setProjectsLoading(true);

    fetchAllProjects()
      .then((res) => {
        if (!active) return;
        setAllProjects(res?.projects || []);
      })
      .catch((e) => {
        if (!active) return;
        console.error("Failed to load projects:", e);
      })
      .finally(() => {
        if (active) setProjectsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Load customers
  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;
    setCustomersLoading(true);

    CustomerAPI.list()
      .then((res) => {
        if (!active) return;
        setCustomers(res.data || []);
      })
      .catch((e) => {
        if (!active) return;
        console.error("Failed to load customers:", e);
      })
      .finally(() => {
        if (active) setCustomersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Filter projects by search
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return allProjects;
    const query = projectSearch.toLowerCase();
    return allProjects.filter(
      (p) =>
        normalize(p.title)?.toLowerCase().includes(query) ||
        normalize(p.developer)?.toLowerCase().includes(query) ||
        normalize(p.location)?.toLowerCase().includes(query),
    );
  }, [allProjects, projectSearch]);

  // Cart projects
  const cartProjects = useMemo(
    () => allProjects.filter((p) => cartProjectIds.includes(p.id)),
    [allProjects, cartProjectIds],
  );

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  // Toggle project in cart
  const toggleCartProject = (projectId: number) => {
    if (cartProjectIds.includes(projectId)) {
      removeFromCart(projectId);
    } else {
      const project = allProjects.find((p) => p.id === projectId);
      if (project) {
        const title = normalize(project.title) || "Untitled Project";
        const image_url =
          mediaUrl(project.background_image_mobile) ||
          mediaUrl(project.background_image_desktop) ||
          mediaUrl(project.main_logo) ||
          "";
        addToCart({
          id: projectId,
          title,
          image_url,
        });
      }
    }
  };

  // Add customer
  const handleCustomerAdded = (customer: Customer) => {
    setCustomers((prev) => [customer, ...prev]);
    setSelectedCustomerId(customer.id);
    setShowAddCustomer(false);
  };

  // Send link
  const handleSendLink = async () => {
    setError("");
    setSuccess("");

    if (!selectedCustomerId) {
      setError("Please select a customer first.");
      return;
    }

    if (!cartProjects.length) {
      setError("Please add at least one project to cart.");
      return;
    }

    setIsSending(true);
    try {
      const payload: LinkedProjectCard[] = cartProjects.map((project) => ({
        ...mapProjectCard(project),
        mask_identity: !includeDetails,
      }));
      const result = await CustomerProjectLinkAPI.create({
        customer_id: selectedCustomerId,
        selected_projects: payload,
      });

      const publicUrl = CustomerProjectLinkAPI.publicUrl(
        result.data.public_token || "",
      );

      // Build WhatsApp message
      const message = cartProjects
        .map((project, index) => {
          const title = normalize(project.title) || "*****";
          const developer = normalize(project.developer) || "*****";
          const header = `${index + 1}. *${title}* by ${developer}`;

          const units = project.units ?? [];
          const unitTypes = Array.from(
            new Set(units.map((u) => normalize(u.unit_type)).filter(Boolean)),
          );
          const areaMin = units
            .map((u) => toNumber(u.area_min))
            .filter((v) => v > 0);
          const areaMax = units
            .map((u) => toNumber(u.area_max))
            .filter((v) => v > 0);
          const areaText =
            areaMin.length || areaMax.length
              ? `${Math.min(...(areaMin.length ? areaMin : areaMax)).toLocaleString("en-IN")} – ${Math.max(...(areaMax.length ? areaMax : areaMin)).toLocaleString("en-IN")} sq.ft`
              : "-";
          const statusText =
            toStatusLabel(normalize(project.development_status)) || "-";
          const unitsLeftValue =
            typeof project.available_units === "number"
              ? String(project.available_units)
              : "-";

          const detailsOnly = [
            `   📍 ${normalize(project.location) || "-"}`,
            `   💰 ${toCardPrice(project)}`,
            `   🏠 Type: ${unitTypes.length ? unitTypes.join(" / ") : "-"}`,
            `   📐 Area: ${areaText}`,
            `   📅 Possession: ${normalize(project.possession_date) || "-"}`,
            `   🏗️ Units Left: ${unitsLeftValue}`,
            `   🚧 Development Status: ${statusText}`,
          ].join("\n");

          // ON: full message (name+developer+details), OFF: only detail fields.
          if (includeDetails) {
            return [header, detailsOnly].join("\n");
          }
          return detailsOnly;
        })
        .join("\n\n");

      // Try WhatsApp if phone available
      if (recipientPhone?.trim()) {
        const phone = recipientPhone.replace(/\D/g, "");
        if (phone) {
          const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message + "\n\n" + publicUrl)}`;
          openExternalTab(whatsappUrl);
          setSuccess("Opening WhatsApp...");
          clearCart();
          return;
        }
      }

      // Fallback to email
      if (recipientEmail?.trim()) {
        const emailSubject = `Project options (${cartProjects.length})`;
        const emailBody = `${message}\n\n${publicUrl}`;
        const mailUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.location.href = mailUrl;
        setSuccess("Opening email...");
        clearCart();
        return;
      }

      // If no contact, just copy public URL
      setSuccess(`Link created: ${publicUrl}`);
      clearCart();
    } catch (e: unknown) {
      setError(
        (e as { message?: string }).message || "Failed to generate link.",
      );
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-main flex flex-col">
      <Header variant="app" />
      <main
        className="flex-1 p-6"
        style={{ paddingTop: "calc(var(--header-height) + 1.5rem)" }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">My Cart</h1>
              <p className="text-gray-600 mt-2">
                {cartProjectIds.length} project
                {cartProjectIds.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Projects */}
            <div className="lg:col-span-2">
              {/* Search Projects */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search projects by name, developer, or location..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Cart Items - Responsive Grid */}
              <div className="mb-12">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  🛒 Your Selected Projects ({cartProjectIds.length})
                </h2>
                {cartProjectIds.length === 0 ? (
                  <div className="p-8 bg-linear-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-200 text-center">
                    <p className="text-gray-700 font-semibold text-lg">
                      Your cart is empty 📭
                    </p>
                    <p className="text-gray-600 text-sm mt-2">
                      Add projects from the list below to get started!
                    </p>
                    <button
                      onClick={() => router.push("/home")}
                      className="btn btn-primary mt-4"
                      style={{
                        padding: "0.7rem 1.1rem",
                        fontSize: "0.82rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Add To Cart From Home
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {cartProjects.map((project) => {
                      const image =
                        mediaUrl(project.background_image_mobile) ||
                        mediaUrl(project.background_image_desktop) ||
                        mediaUrl(project.main_logo);
                      const units = project.units ?? [];
                      const unitTypes = Array.from(
                        new Set(
                          units
                            .map((u) => normalize(u.unit_type))
                            .filter(Boolean),
                        ),
                      );
                      const areaMin = units
                        .map((u) => toNumber(u.area_min))
                        .filter((v) => v > 0);
                      const areaMax = units
                        .map((u) => toNumber(u.area_max))
                        .filter((v) => v > 0);
                      const areaText =
                        areaMin.length || areaMax.length
                          ? `${Math.min(...(areaMin.length ? areaMin : areaMax)).toLocaleString("en-IN")} - ${Math.max(...(areaMax.length ? areaMax : areaMin)).toLocaleString("en-IN")} sq.ft`
                          : "—";
                      const typeText = unitTypes.length
                        ? unitTypes.join(" / ")
                        : "—";
                      const possession =
                        normalize(project.possession_date) || "—";
                      const status = toStatusLabel(
                        normalize(project.development_status),
                      );
                      const sc = statusStyle(status);

                      return (
                        <article
                          key={project.id}
                          className="card glass-card project-card-glow flex flex-col"
                          style={{
                            borderRadius: "var(--radius-xl)",
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.2)",
                            border: "1px solid rgba(255,255,255,0.45)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(10px)",
                          }}
                        >
                          {image ? (
                            <div
                              style={{
                                height: "clamp(120px,22vw,152px)",
                                overflow: "hidden",
                                background: "#f1f5f9",
                                position: "relative",
                              }}
                            >
                              <img
                                src={image}
                                alt={project.title || "Project"}
                                loading="lazy"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                height: "clamp(120px,22vw,152px)",
                                background:
                                  "linear-gradient(135deg,var(--navy-900) 0%,var(--navy-700) 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative",
                              }}
                            >
                              <span className="text-white text-3xl">🏢</span>
                            </div>
                          )}

                          <div
                            className="p-3.5 md:p-4 flex flex-col"
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
                                {normalize(project.title)}
                              </h3>
                              <p
                                className="text-xs truncate mt-0.5"
                                style={{ color: "var(--color-text-muted)" }}
                              >
                                {normalize(project.developer)}
                              </p>
                            </div>

                            <p
                              className="text-xs"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              📍 {normalize(project.location)}
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

                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                { key: "type", label: "Type", val: typeText },
                                { key: "area", label: "Area", val: areaText },
                                {
                                  key: "possession",
                                  label: "Possession",
                                  val: possession,
                                },
                                {
                                  key: "units",
                                  label: "Units Left",
                                  val: `${toNumber(project.available_units) || 0}`,
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
                                  <p
                                    style={{
                                      fontSize: "9px",
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.04em",
                                      color: "var(--color-text-hint)",
                                    }}
                                  >
                                    {info.label}
                                  </p>
                                  <p
                                    className="text-xs font-semibold truncate"
                                    style={{
                                      color: "var(--color-text-primary)",
                                    }}
                                  >
                                    {info.val}
                                  </p>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-1">
                              <span
                                className="text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ background: sc.bg, color: sc.color }}
                              >
                                {status}
                              </span>
                              <button
                                onClick={() => removeFromCart(project.id)}
                                className="btn btn-ghost"
                                style={{
                                  fontSize: "0.72rem",
                                  padding: "0.34rem 0.6rem",
                                  color: "#b91c1c",
                                  border: "1px solid rgba(185,28,28,0.2)",
                                  background: "rgba(254,226,226,0.7)",
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Summary & Send */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                {/* Customer Selection */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Customer
                  </h3>
                  {customersLoading ? (
                    <p className="text-sm text-gray-600">
                      Loading customers...
                    </p>
                  ) : (
                    <div>
                      <select
                        value={selectedCustomerId || ""}
                        onChange={(e) =>
                          setSelectedCustomerId(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">Select a customer...</option>
                        {customers.map((customer) => {
                          return (
                            <option key={customer.id} value={customer.id}>
                              {customer.secret_code}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        onClick={() => setShowAddCustomer(true)}
                        className="w-full mt-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200 transition"
                      >
                        + Add New Customer
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact Fields */}
                <div className="mb-6 pb-6 border-b">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Send Via
                  </h3>

                  {/* Message format toggle */}
                  <div
                    className="mb-4 p-3 rounded-lg"
                    style={{
                      background: "var(--slate-50)",
                      border: "1px solid var(--slate-200)",
                    }}
                  >
                    <p className="text-xs font-bold text-gray-700 mb-2">
                      Message Format
                    </p>
                    <button
                      onClick={() => setIncludeDetails((v) => !v)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          width: "42px",
                          height: "24px",
                          borderRadius: "999px",
                          background: includeDetails ? "#1e4580" : "#cbd5e1",
                          position: "relative",
                          transition: "background 0.2s",
                          flexShrink: 0,
                          display: "inline-block",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: "4px",
                            left: includeDetails ? "22px" : "4px",
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: "#fff",
                            transition: "left 0.2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                          }}
                        />
                      </span>
                      <span style={{ textAlign: "left" }}>
                        <span
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            color: includeDetails
                              ? "var(--navy-900)"
                              : "var(--color-text-muted)",
                            display: "block",
                          }}
                        >
                          {includeDetails
                            ? "Include all details"
                            : "Details only (No Developer Name/ Project name)"}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--color-text-hint)",
                          }}
                        >
                          {includeDetails
                            ? "Project + developer + location, price, type, area, possession…"
                            : "Tap to include project + developer also"}
                        </span>
                      </span>
                    </button>
                  </div>

                  {/* WhatsApp */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                    <button
                      onClick={() => {
                        if (!recipientPhone.trim()) {
                          setError("Please enter a phone number for WhatsApp.");
                          return;
                        }
                        handleSendLink();
                      }}
                      disabled={isSending}
                      className="w-full mt-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {isSending ? "Sending..." : "Send via WhatsApp"}
                    </button>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    />
                    <button
                      onClick={() => {
                        if (!recipientEmail.trim()) {
                          setError("Please enter an email address.");
                          return;
                        }
                        handleSendLink();
                      }}
                      disabled={isSending}
                      className="w-full mt-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {isSending ? "Sending..." : "Send via Email"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onAdded={handleCustomerAdded}
        />
      )}
    </div>
  );
}
