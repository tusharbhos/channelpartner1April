// lib/api.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central API service — replace MOCK data with these real Laravel calls
// ─────────────────────────────────────────────────────────────────────────────

function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
}

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    return normalizeApiBaseUrl(envUrl);
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }

  return "http://localhost:8000/api";
}

// ── Token helpers ─────────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cp_token");
}

export function setToken(token: string): void {
  localStorage.setItem("cp_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("cp_token");
}

// ── API Error type ────────────────────────────────────────────────────────────
export interface ApiError {
  status?: number;
  message?: string;
  errors?: Record<string, string[]>;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const url = `${getApiBaseUrl()}${endpoint}`;
  console.log("API Request:", url, options.method || "GET");

  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  // Check if response is JSON
  const contentType = res.headers.get("content-type") || "";
  const isJsonResponse = contentType.includes("application/json");

  if (!isJsonResponse) {
    const text = await res.text();
    console.error("Non-JSON response:", text.substring(0, 500));

    const looksLikeHtml =
      text.trim().startsWith("<") ||
      text.toLowerCase().includes("<!doctype html");

    let message =
      "Server returned non-JSON response. Please check if API endpoint is correct.";
    if (looksLikeHtml) {
      message =
        "Server returned HTML instead of JSON. Please verify API URL and backend deployment.";
    } else if (text.trim()) {
      message = text.trim().slice(0, 200);
    }

    const error: ApiError = {
      status: res.status,
      message,
    };
    throw error;
  }

  const data = await res.json();

  if (!res.ok) {
    // Throw structured error so callers can read .errors / .message
    const error: ApiError = { status: res.status, ...data };
    throw error;
  }

  return data as T;
}

// ══════════════════════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface ApiUser {
  id: number;
  company_id?: number;
  name: string;
  email: string;
  company_name: string;
  company_size?: string;
  profile_image?: string;
  profile_image_url?: string;
  rera_no: string;
  phone: string;
  city?: string;
  address: string;
  role: "user" | "admin";
  is_company_owner?: boolean;
  is_active: boolean;
  email_verified: boolean;
  experience_level?: string;
  primary_market?: string[];
  budget_segments?: string[];
  max_ticket_size?: string | number;
  buyer_types?: string[];
  project_preference?: string[];
  micro_markets?: string;
  sell_cities?: string;
  avg_leads_per_month?: number;
  avg_site_visits_per_month?: number;
  avg_closures_per_month?: number;
  selling_style?: string[];
  activation_intent?:
    | "immediately"
    | "in_7_days"
    | "in_15_plus_days"
    | "exploring";
  commitment_signal?: boolean;
  available_slots?: string[];
  channels_used?: string[];
  onboarding_step?: number;
  created_at: string;
}

// Project Meeting Interface
export interface ProjectMeeting {
  project_name: string;
  meeting_date: string;
  meeting_time: string;
  scheduled_at?: string;
  created_by_id?: number;
  created_by_name?: string;
  updated_by_id?: number;
  updated_by_name?: string;
  assigned_to_user_id?: number;
  assigned_to_user_name?: string;
}

// Customer Interface with multiple projects support
export interface Customer {
  id: number;
  user_id: number;
  user?: {
    id?: number;
    name: string;
    email?: string;
    company_name?: string;
    company_id?: number;
  };
  nickname: string;
  secret_code: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  company_id?: number;
  projects?: ProjectMeeting[]; // Array of multiple project meetings
  // Backward compatibility fields
  meeting_date?: string;
  meeting_time?: string;
  project_name?: string;
  notes?: string;
  status: "active" | "inactive" | "Booked";
  is_active?: number;
  created_at: string;
  updated_at: string;
}

export interface LinkedProjectCard {
  id?: number;
  title: string;
  developer?: string;
  location?: string;
  price?: string;
  image_url?: string;
  unit_types?: string;
  area?: string;
  possession?: string;
  status?: string;
  units_left?: number;
  mask_identity?: boolean | number;
  meeting_date?: string;
  meeting_time?: string;
  project_key?: string;
  attempt_count?: number;
  attempts_left?: number;
  is_locked?: boolean;
}

export interface CustomerProjectLink {
  id: number;
  user_id: number;
  customer_id: number;
  public_token: string;
  selected_projects: LinkedProjectCard[];
  liked_projects?: LinkedProjectCard[];
  mask_identity?: boolean;
  card_attempts?: Record<string, number>;
  locked_project_keys?: string[];
  expires_at?: string;
  is_disabled?: boolean;
  disabled_at?: string;
  status: string;
  sent_at?: string;
  opened_at?: string;
  last_interaction_at?: string;
  created_at: string;
  customer?: {
    id: number;
    nickname?: string;
    name?: string;
    phone?: string;
    secret_code?: string;
  };
  user?: {
    id: number;
    name?: string;
    company_name?: string;
  };
}

export interface PublicCustomerProjectLink {
  id: number;
  public_token: string;
  status: string;
  selected_projects: LinkedProjectCard[];
  liked_projects?: LinkedProjectCard[];
  mask_identity?: boolean;
  expires_at?: string;
  is_disabled?: boolean;
  max_attempts_per_card?: number;
  locked_project_keys?: string[];
  customer?: {
    id: number;
    nickname?: string;
    name?: string;
    phone?: string;
    secret_code?: string;
  };
}

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH API
// ══════════════════════════════════════════════════════════════════════════════

export interface RegisterPayload {
  name: string;
  company_name: string;
  company_size: string;
  rera_no: string;
  phone: string;
  city: string;
  email: string;
  address: string;
  password: string;
  password_confirmation: string;
}

export interface ProfileUpdatePayload {
  name?: string;
  company_name?: string;
  company_size?: string;
  profile_image?: File;
  rera_no?: string;
  phone?: string;
  city?: string;
  address?: string;
  experience_level?: string;
  primary_market?: string[];
  budget_segments?: string[];
  max_ticket_size?: number;
  buyer_types?: string[];
  project_preference?: string[];
  micro_markets?: string;
  sell_cities?: string;
  avg_leads_per_month?: number;
  avg_site_visits_per_month?: number;
  avg_closures_per_month?: number;
  selling_style?: string[];
  available_slots?: string[];
  channels_used?: string[];
  onboarding_step?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordSendCodePayload {
  email: string;
}

export interface ForgotPasswordResetPayload {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  message: string;
  user: ApiUser;
  token?: string;
  email_verified?: boolean;
}

export const AuthAPI = {
  register: (payload: RegisterPayload) =>
    apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logout: () =>
    apiFetch<{ message: string }>("/auth/logout", { method: "POST" }),

  me: () => apiFetch<{ user: ApiUser; email_verified: boolean }>("/auth/me"),

  updateProfile: (payload: ProfileUpdatePayload | FormData) => {
    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      return apiFetch<{ message: string; user: ApiUser }>("/auth/profile", {
        method: "POST",
        body: payload,
      });
    }

    return apiFetch<{ message: string; user: ApiUser }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  resendVerification: () =>
    apiFetch<{ message: string }>("/auth/email/resend", { method: "POST" }),

  forgotPasswordSendCode: (payload: ForgotPasswordSendCodePayload) =>
    apiFetch<{ message: string }>("/auth/forgot-password/send-code", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  forgotPasswordReset: (payload: ForgotPasswordResetPayload) =>
    apiFetch<{ message: string }>("/auth/forgot-password/reset", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN API
// ══════════════════════════════════════════════════════════════════════════════

export interface AdminStats {
  total_users: number;
  verified_users: number;
  unverified_users: number;
  active_users: number;
}

export type UpdateUserPayload = Partial<
  Pick<
    ApiUser,
    "name" | "company_name" | "rera_no" | "phone" | "address" | "is_active"
  >
>;

export const AdminAPI = {
  stats: () => apiFetch<AdminStats>("/admin/stats"),

  // Users
  listUsers: (search?: string, verified?: boolean) => {
    const params = new URLSearchParams();
    if (search !== undefined) params.set("search", search);
    if (verified !== undefined) params.set("verified", String(verified));
    const qs = params.toString() ? `?${params}` : "";
    return apiFetch<{ data: ApiUser[]; total: number }>(`/admin/users${qs}`);
  },

  updateUser: (id: number, payload: UpdateUserPayload) =>
    apiFetch<{ message: string; user: ApiUser }>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteUser: (id: number) =>
    apiFetch<{ message: string }>(`/admin/users/${id}`, { method: "DELETE" }),
};

// ══════════════════════════════════════════════════════════════════════════════
//  COMPANY USER API
// ══════════════════════════════════════════════════════════════════════════════

export interface CompanyUser {
  id: number;
  company_id?: number;
  company_name?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateCompanyUserPayload {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
  password_confirmation: string;
  is_active?: boolean;
}

export interface UpdateCompanyUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
  password?: string;
  password_confirmation?: string;
}

export const CompanyUserAPI = {
  list: (search?: string, isActive?: boolean) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeof isActive === "boolean")
      params.set("is_active", String(isActive));
    const qs = params.toString() ? `?${params}` : "";
    return apiFetch<{ data: CompanyUser[]; total: number }>(
      `/company-users${qs}`,
    );
  },

  get: (id: number) => apiFetch<{ data: CompanyUser }>(`/company-users/${id}`),

  create: (payload: CreateCompanyUserPayload) =>
    apiFetch<{ message: string; data: CompanyUser }>("/company-users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: UpdateCompanyUserPayload) =>
    apiFetch<{ message: string; data: CompanyUser }>(`/company-users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  delete: (id: number) =>
    apiFetch<{ message: string }>(`/company-users/${id}`, {
      method: "DELETE",
    }),
};

// ══════════════════════════════════════════════════════════════════════════════
//  CUSTOMER API
// ══════════════════════════════════════════════════════════════════════════════

export const CustomerAPI = {
  list: (companyId?: number) => {
    const params = companyId ? `?company_id=${companyId}` : "";
    return apiFetch<{ data: Customer[]; total: number }>(`/customers${params}`);
  },

  upcoming: () => apiFetch<{ data: Customer[] }>("/customers/upcoming"),

  generateCode: () =>
    apiFetch<{ secret_code: string }>("/customers/generate-code", {
      method: "POST",
    }),

  create: (data: Partial<Customer>) =>
    apiFetch<{ message: string; data: Customer }>("/customers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Customer>) =>
    apiFetch<{ message: string; data: Customer }>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiFetch<{ message: string }>(`/customers/${id}`, {
      method: "DELETE",
    }),

  get: (id: number) => apiFetch<{ data: Customer }>(`/customers/${id}`),

  // Schedule meeting for a project (adds to projects array)
  scheduleMeeting: (
    customerId: number,
    data: {
      meeting_date: string;
      meeting_time: string;
      project_name: string;
      assigned_to_user_id?: number;
    },
  ) =>
    apiFetch<{ message: string; data: Customer }>(
      `/customers/${customerId}/schedule-meeting`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  // Get all project meetings for a customer
  getProjectMeetings: (customerId: number) =>
    apiFetch<{
      data: {
        customer: string;
        projects: ProjectMeeting[];
        upcoming: ProjectMeeting[];
        completed: ProjectMeeting[];
      };
    }>(`/customers/${customerId}/project-meetings`),

  // Update a specific project meeting
  updateProjectMeeting: (
    customerId: number,
    projectName: string,
    data: {
      meeting_date: string;
      meeting_time: string;
      assigned_to_user_id?: number;
    },
  ) =>
    apiFetch<{ message: string; data: Customer }>(
      `/customers/${customerId}/project-meetings/${encodeURIComponent(projectName)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    ),

  // Delete a specific project meeting
  deleteProjectMeeting: (customerId: number, projectName: string) =>
    apiFetch<{ message: string; data: Customer }>(
      `/customers/${customerId}/project-meetings/${encodeURIComponent(projectName)}`,
      {
        method: "DELETE",
      },
    ),
};

export const CustomerProjectLinkAPI = {
  create: (data: {
    customer_id: number;
    selected_projects: LinkedProjectCard[];
    mask_identity?: boolean;
  }) =>
    apiFetch<{ message: string; data: CustomerProjectLink }>(
      "/customer-project-links",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  byCustomer: (customerId: number) =>
    apiFetch<{ data: CustomerProjectLink[]; total: number }>(
      `/customer-project-links/customer/${customerId}`,
    ),

  removeSelectedProject: (linkId: number, projectTitle: string) =>
    apiFetch<{ message: string; data: CustomerProjectLink }>(
      `/customer-project-links/${linkId}/projects/${encodeURIComponent(projectTitle)}`,
      {
        method: "DELETE",
      },
    ),

  publicShow: (token: string) =>
    apiFetch<{ data: PublicCustomerProjectLink }>(
      `/public/customer-project-links/${token}`,
    ),

  publicLike: (
    token: string,
    liked_projects: LinkedProjectCard[],
    attempt_project_key?: string,
  ) =>
    apiFetch<{
      message: string;
      data: {
        id: number;
        status: string;
        liked_projects: LinkedProjectCard[];
        expires_at?: string;
        is_disabled?: boolean;
        max_attempts_per_card?: number;
        locked_project_keys?: string[];
      };
    }>(`/public/customer-project-links/${token}/like`, {
      method: "POST",
      body: JSON.stringify({ liked_projects, attempt_project_key }),
    }),

  publicUrl: (token: string) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const base =
      appUrl || (typeof window !== "undefined" ? window.location.origin : "");
    return `${base}/customer-link/${token}`;
  },
};
// lib/api.ts - Add these lines

// ══════════════════════════════════════════════════════════════════════════════
//  PROJECT REQUEST API
// ══════════════════════════════════════════════════════════════════════════════

export interface ProjectRequest {
  id: number;
  user_id: number;
  developer_name: string;
  project_name?: string;
  manager_name: string;
  manager_phone: string;
  manager_email: string;
  status: "pending" | "contacted" | "activated" | "rejected";
  notes?: string;
  contacted_at?: string;
  activated_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    company_name: string;
  };
}

export interface CreateProjectRequestPayload {
  developer_name: string;
  project_name?: string;
  manager_name: string;
  manager_phone: string;
  manager_email: string;
}

export const ProjectRequestAPI = {
  // Create new project request
  create: (payload: CreateProjectRequestPayload) =>
    apiFetch<{ message: string; data: ProjectRequest }>("/project-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Get user's own project requests
  getMyRequests: () =>
    apiFetch<{ data: ProjectRequest[]; total: number }>(
      "/project-requests/my-requests",
    ),

  // Get single project request
  get: (id: number) =>
    apiFetch<{ data: ProjectRequest }>(`/project-requests/${id}`),

  // Admin: Get all project requests
  adminList: (status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    const qs = params.toString() ? `?${params}` : "";
    return apiFetch<{ data: ProjectRequest[]; total: number }>(
      `/admin/project-requests${qs}`,
    );
  },

  // Admin: Update project request status
  adminUpdate: (id: number, payload: { status: string; notes?: string }) =>
    apiFetch<{ message: string; data: ProjectRequest }>(
      `/admin/project-requests/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    ),
};

// ══════════════════════════════════════════════════════════════════════════════
//  ACTIVATION REQUEST API
// ══════════════════════════════════════════════════════════════════════════════

export interface ActivationRequestPayload {
  project_name: string;
  city: string;
  google_location: string;
  units_left_label: string;
  units_left: number;
  possession_date: string;
  price_range: string;
  location_type: string;
  unit_structure: string;
  buyer_type: string;
  sales_velocity: string;
  target_timeline: string;
  developer_positioning: string;
  contact_name: string;
  designation: string;
  phone: string;
  email: string;
  developer_name: string;
  assessment: string | null;
  submitted_at: string;
}

export interface ActivationRequestResponse {
  message: string;
  data: {
    id: number;
    project_name: string;
    city: string;
    status: string;
    created_at: string;
  };
}

export interface ActivationApprovalProject {
  id: number;
  project_name: string;
  developer_name: string;
  city: string;
  unit_structure?: string | null;
  price_range?: string | null;
  units_left?: number;
  approval_count?: number;
  my_approval_attempts?: number;
  status: string;
  created_at: string;
}

export const ActivationRequestAPI = {
  create: (payload: ActivationRequestPayload, token?: string | null) =>
    apiFetch<ActivationRequestResponse>("/activation-requests", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify(payload),
    }),

  getMyProjects: () =>
    apiFetch<{ data: ActivationApprovalProject[]; total: number }>(
      "/activation-requests/my-projects",
    ),

  approve: (id: number) =>
    apiFetch<{ message: string; data: ActivationApprovalProject }>(
      `/activation-requests/${id}/approve`,
      {
        method: "POST",
      },
    ),
};
