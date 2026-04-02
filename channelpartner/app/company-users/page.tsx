"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  CompanyUser,
  CompanyUserAPI,
  CreateCompanyUserPayload,
  UpdateCompanyUserPayload,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  password_confirmation: string;
  is_active: boolean;
};

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  password_confirmation: "",
  is_active: true,
};

export default function CompanyUsersPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<CompanyUser[]>([]);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow] = useState<CompanyUser | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const canManage = useMemo(() => Boolean(user?.is_company_owner), [user]);

  const canView = useMemo(
    () => canManage || user?.role === "admin",
    [canManage, user],
  );
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isLoading && isAuthenticated && !canView) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, canView, router]);

  const load = async () => {
    try {
      setLoadingData(true);
      setError("");
      const res = await CompanyUserAPI.list(search || undefined);
      setRows(res.data);
    } catch (e) {
      setError(
        (e as { message?: string }).message || "Failed to load company users.",
      );
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && canView) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, canView]);

  const openCreate = () => {
    setEditRow(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (row: CompanyUser) => {
    setEditRow(row);
    setForm({
      name: row.name,
      email: row.email,
      phone: row.phone || "",
      address: row.address || "",
      password: "",
      password_confirmation: "",
      is_active: row.is_active,
    });
    setShowModal(true);
  };

  const submit = async () => {
    try {
      setSaving(true);
      setError("");

      if (!form.name.trim() || !form.email.trim()) {
        setError("Name and email are required.");
        return;
      }

      if (!editRow) {
        if (!form.password || form.password.length < 8) {
          setError("Password minimum 8 characters required.");
          return;
        }
        if (form.password !== form.password_confirmation) {
          setError("Password confirmation does not match.");
          return;
        }

        const payload: CreateCompanyUserPayload = {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          address: form.address || undefined,
          password: form.password,
          password_confirmation: form.password_confirmation,
          is_active: form.is_active,
        };

        await CompanyUserAPI.create(payload);
      } else {
        const payload: UpdateCompanyUserPayload = {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          address: form.address || undefined,
          is_active: form.is_active,
        };

        if (form.password) {
          payload.password = form.password;
          payload.password_confirmation = form.password_confirmation;
        }

        await CompanyUserAPI.update(editRow.id, payload);
      }

      setShowModal(false);
      setForm(initialForm);
      setEditRow(null);
      await load();
    } catch (e) {
      setError((e as { message?: string }).message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (id: number) => {
    const ok = window.confirm("Delete this company user?");
    if (!ok) return;

    try {
      setDeletingId(id);
      await CompanyUserAPI.delete(id);
      await load();
    } catch (e) {
      setError((e as { message?: string }).message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading || !isAuthenticated || !canView) {
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
        <div
          className="px-4 md:px-8 py-5"
          style={{ background: "var(--gradient-header)" }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="page-banner-sub">Company Level Access</p>
              <h2 className="page-banner-title">Company User Management</h2>
            </div>
            {canManage && (
              <button className="btn btn-gold" onClick={openCreate}>
                + Create Company User
              </button>
            )}
          </div>
        </div>

        <div className="px-3 sm:px-4 md:px-8 py-4 md:py-6 max-w-7xl mx-auto">
          {error && <div className="alert alert-danger mb-4">{error}</div>}

          <div className="glass-card p-4 mb-4">
            <div className="flex gap-3 flex-wrap items-center">
              <input
                className="input-field"
                style={{ maxWidth: 320 }}
                placeholder="Search name, email, phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn btn-primary" onClick={load}>
                Search
              </button>
            </div>
          </div>

          <div className="glass-card p-0 overflow-hidden">
            <div className="table-responsive">
              <table className="data-table bg-white">
                <thead>
                  <tr>
                    <th>{isAdmin ? "Company / User" : "Name"}</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Created</th>
                    {canManage && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {loadingData ? (
                    <tr>
                      <td
                        colSpan={canManage ? 6 : 5}
                        className="text-center py-8"
                      >
                        <div className="spinner" />
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canManage ? 6 : 5}
                        className="text-center py-8"
                      >
                        No company users found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          {isAdmin ? (
                            <div className="leading-tight">
                              <div
                                className="text-xs"
                                style={{ color: "var(--color-text-muted)" }}
                              >
                                Company: {r.company_name ?? "—"}
                              </div>
                              <div
                                className="font-medium"
                                style={{ color: "var(--color-text-primary)" }}
                              >
                                User: {r.name}
                              </div>
                            </div>
                          ) : (
                            r.name
                          )}
                        </td>
                        <td>{r.email}</td>
                        <td>{r.phone || "-"}</td>
                        <td>
                          <span
                            className={
                              r.is_active
                                ? "badge badge-active"
                                : "badge badge-inactive"
                            }
                          >
                            {r.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                        {canManage && (
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                className="btn btn-ghost"
                                onClick={() => openEdit(r)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => removeRow(r.id)}
                                disabled={deletingId === r.id}
                              >
                                {deletingId === r.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {showModal && canManage && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editRow ? "Edit Company User" : "Create Company User"}
              </h3>
            </div>

            <div className="modal-body space-y-3">
              <input
                className="auth-form-input"
                placeholder="Name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
              <input
                className="auth-form-input"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
              <input
                className="auth-form-input"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
              />
              <input
                className="auth-form-input"
                placeholder="Address"
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  className="auth-form-input"
                  placeholder={editRow ? "New Password (optional)" : "Password"}
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                />
                <input
                  className="auth-form-input"
                  placeholder={
                    editRow ? "Confirm New Password" : "Confirm Password"
                  }
                  type="password"
                  value={form.password_confirmation}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      password_confirmation: e.target.value,
                    }))
                  }
                />
              </div>

              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, is_active: e.target.checked }))
                  }
                />
                Active User
              </label>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-gold"
                onClick={submit}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
