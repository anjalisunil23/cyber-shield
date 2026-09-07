/** Shared API helpers for Cyber Shield backend. */

// Prefer explicit VITE_API_URL; otherwise use same-origin `/api` (Vite proxy → backend).
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "" : "http://127.0.0.1:8001");

export type ApiErrorBody = {
  success?: boolean;
  message?: string;
  detail?: string | { message?: string };
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiErrorBody;
    if (typeof data.message === "string") return data.message;
    if (typeof data.detail === "string") return data.detail;
    if (data.detail && typeof data.detail === "object" && data.detail.message) {
      return data.detail.message;
    }
  } catch {
    // ignore parse failures
  }
  return res.statusText || "Request failed";
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type UserRoleApi =
  "major_admin" | "admin" | "supervisor" | "superior_officer" | "investigator";

export type UserResponse = {
  id: string;
  full_name: string;
  email: string;
  role: UserRoleApi;
  department: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  role?: string;
  user_id?: string;
};

export function registerUser(body: {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  role: UserRoleApi;
  department?: string | null;
}) {
  return apiRequest<UserResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function loginUser(body: { email: string; password: string }) {
  return apiRequest<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function forgotPassword(email: string) {
  return apiRequest<{ success: boolean; message: string; reset_token?: string }>(
    "/api/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

export function resetPassword(token: string, new_password: string) {
  return apiRequest<{ success: boolean; message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password }),
  });
}

/** Map UI role labels to API enum values. */
export function toApiRole(label: string): UserRoleApi {
  const map: Record<string, UserRoleApi> = {
    Investigator: "investigator",
    Supervisor: "supervisor",
    "Superior Officer": "supervisor",
    "Head of Investigation": "supervisor",
    Admin: "admin",
    Administrator: "admin",
    "Major Admin": "major_admin",
    "Super Admin": "major_admin",
  };
  return map[label] ?? "investigator";
}

export function storeToken(token: string, refresh?: string) {
  localStorage.setItem("cs_access_token", token);
  if (refresh) localStorage.setItem("cs_refresh_token", refresh);
}

export function clearStoredToken() {
  localStorage.removeItem("cs_access_token");
  localStorage.removeItem("cs_refresh_token");
}
