import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ApiError, registerUser, toApiRole } from "@/lib/api";
import { BackgroundAnimation } from "@/components/register/BackgroundAnimation";
import { RegisterCard } from "@/components/register/RegisterCard";
import { RegisterHero } from "@/components/register/RegisterHero";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account — CyberShield" },
      {
        name: "description",
        content: "Create a secure CyberShield investigator account with role-based access.",
      },
      { property: "og:title", content: "Create Account — CyberShield" },
      {
        property: "og:description",
        content: "Enterprise-grade registration for digital evidence investigation teams.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister(payload: {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
    role: string;
    department: string | null;
  }) {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await registerUser({
        full_name: payload.full_name,
        email: payload.email,
        password: payload.password,
        confirm_password: payload.confirm_password,
        role: toApiRole(payload.role),
        department: payload.department,
      });
      setSuccess("Account created. Redirecting to login…");
      setTimeout(() => {
        void navigate({ to: "/login" });
      }, 1000);
    } catch (err) {
      let message = "Could not create account.";
      if (err instanceof ApiError) {
        if (err.status === 502 || err.message.toLowerCase().includes("bad gateway")) {
          message = "Cannot reach the backend server (502 Bad Gateway). Please ensure the Python API is running on port 8001.";
        } else {
          message = err.message;
        }
      } else if (err instanceof TypeError) {
        message = "Cannot reach the API. Make sure the backend server is running on port 8001.";
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] text-slate-50">
      <BackgroundAnimation />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <RegisterHero />
        </div>
        <div className="order-1 flex items-center justify-center px-5 py-16 lg:order-2 lg:py-10">
          <RegisterCard
            onSubmit={handleRegister}
            submitting={submitting}
            error={error}
            success={success}
          />
        </div>
      </div>
    </div>
  );
}
