import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";
import { ThemeSwitch } from "@/components/ui/ThemeToggle";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => investigationApi.me() });
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");

  const save = useMutation({
    mutationFn: () =>
      investigationApi.updateMe({
        full_name: name || data?.full_name,
        department: department || data?.department || undefined,
      }),
    onSuccess: () => {
      toast.success("Profile updated");
      void qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Update your investigator profile</p>
      </div>
      <div className="max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xs">
        <p className="text-sm text-foreground">
          Signed in as <span className="font-semibold text-primary">{data?.email}</span> (
          {data?.role})
        </p>
        <label className="block text-xs font-medium text-muted-foreground">
          Full name
          <input
            defaultValue={data?.full_name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
          />
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Department
          <input
            defaultValue={data?.department || ""}
            onChange={(e) => setDepartment(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
          />
        </label>
        <div className="border-t border-border/50 pt-3">
          <ThemeSwitch label="Dark mode appearance" />
        </div>
        <button
          type="button"
          onClick={() => save.mutate()}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition shadow-xs"
        >
          Save profile
        </button>
      </div>
    </div>
  );
}
