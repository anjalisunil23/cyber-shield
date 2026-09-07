/** Role-based access helpers for CyberShield (Phase 1). */

export type AppRole = "major_admin" | "admin" | "supervisor" | "investigator";

export const ROLE_HOME: Record<AppRole, string> = {
  major_admin: "/major-admin/dashboard",
  admin: "/admin/dashboard",
  supervisor: "/superior/dashboard",
  investigator: "/investigator/dashboard",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  major_admin: "Major Admin",
  admin: "Admin",
  supervisor: "Supervisor",
  investigator: "Investigator",
};

export function normalizeRole(role: string | null | undefined): AppRole | null {
  if (!role) return null;
  const cleaned = role.toLowerCase().trim();
  if (cleaned === "major_admin" || cleaned === "super_admin") return "major_admin";
  if (cleaned === "admin") return "admin";
  if (cleaned === "supervisor" || cleaned === "superior_officer" || cleaned === "superior")
    return "supervisor";
  if (cleaned === "investigator") return "investigator";
  return null;
}

export function isAppRole(value: string | null | undefined): value is AppRole {
  return normalizeRole(value) !== null;
}

export function homeForRole(role: string | null | undefined): string {
  const norm = normalizeRole(role);
  if (norm) return ROLE_HOME[norm];
  return "/login";
}

/** Decode JWT payload without verifying (routing only; API still validates). */
export function roleFromAccessToken(token: string | null): AppRole | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    return normalizeRole(payload.role);
  } catch {
    return null;
  }
}
