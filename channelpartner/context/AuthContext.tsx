// context/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { AuthAPI, ApiUser, getToken, setToken, removeToken } from "@/lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  company_name: string;
  rera_no?: string;
  phone?: string;
  city?: string;
  address?: string;
  role: "user" | "admin";
  email_verified: boolean;
  is_active: boolean;
  experience_level?: string;
  primary_market?: string;
  budget_segments?: string[];
  max_ticket_size?: string | number;
  buyer_types?: string[];
  micro_markets?: string;
  sell_cities?: string;
  avg_leads_per_month?: number;
  avg_site_visits_per_month?: number;
  avg_closures_per_month?: number;
  selling_style?: "own_leads" | "developer_leads" | "both";
  activation_intent?:
    | "immediately"
    | "in_7_days"
    | "in_15_plus_days"
    | "exploring";
  commitment_signal?: boolean;
  available_slots?: string[];
  channels_used?: string[];
  onboarding_step?: number;
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{
    success: boolean;
    error?: string;
    needsVerification?: boolean;
  }>;
  register: (
    data: RegisterData,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  company_name: string;
  rera_no: string;
  phone: string;
  city: string;
  email: string;
  address: string;
  password: string;
  password_confirmation: string;
}

interface ApiError {
  status?: number;
  message?: string;
  errors?: Record<string, string[]>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Start true so we don't flash redirect before token check
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await AuthAPI.me();
      setUser(response.user as unknown as User);
    } catch {
      // Token invalid / expired — clear silently
      removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On mount — restore session from stored token
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ── Refresh user data (call after updates) ───────────
  const refreshUser = useCallback(async () => {
    try {
      const response = await AuthAPI.me();
      setUser(response.user as unknown as User);
    } catch {
      // ignore
    }
  }, []);

  // ── Login ─────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    try {
      const response = await AuthAPI.login({ email, password });

      setToken(response.token);

      if (!response.user.email_verified) {
        return {
          success: false,
          error:
            "Please verify your email before logging in. Check your inbox.",
          needsVerification: true,
        };
      }

      if (!response.user.is_active) {
        return {
          success: false,
          error: "Your account has been disabled. Contact administrator.",
        };
      }

      setUser(response.user as unknown as User);
      return { success: true };
    } catch (error: unknown) {
      const e = error as ApiError;
      return {
        success: false,
        error: e.message || "Invalid email or password.",
      };
    }
  };

  // ── Register ──────────────────────────────────────────
  const register = async (data: RegisterData) => {
    try {
      const response = await AuthAPI.register(data);
      setToken(response.token);
      setUser(response.user as unknown as User);
      return { success: true };
    } catch (error: unknown) {
      const e = error as ApiError;

      if (e.errors && typeof e.errors === "object") {
        const firstKey = Object.keys(e.errors)[0];
        if (firstKey) {
          return {
            success: false,
            error: e.errors[firstKey][0] || "Registration failed.",
          };
        }
      }
      return {
        success: false,
        error: e.message || "Registration failed. Please try again.",
      };
    }
  };

  // ── Logout ────────────────────────────────────────────
  const logout = async () => {
    try {
      await AuthAPI.logout();
    } catch {
      // ignore
    } finally {
      removeToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
