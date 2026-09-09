import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageScaffold, Panel, PrimaryButton, LoadingBlock } from "@/components/ui-kit/PageKit";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";
import { ThemeSwitch } from "@/components/ui/ThemeToggle";

export const Route = createFileRoute("/admin/settings")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: () => investigationApi.me() });
  const [displayName, setDisplayName] = useState("");
  const [emailDigests, setEmailDigests] = useState(true);
  const [caseAlerts, setCaseAlerts] = useState(true);

  useEffect(() => {
    if (me.data) setDisplayName(me.data.full_name);
  }, [me.data]);

  const save = useMutation({
    mutationFn: () => investigationApi.updateMe({ full_name: displayName }),
    onSuccess: () => {
      toast.success("Settings saved");
      void qc.invalidateQueries({ queryKey: ["me"] });
      localStorage.setItem("cs_admin_prefs", JSON.stringify({ emailDigests, caseAlerts }));
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cs_admin_prefs");
      if (!raw) return;
      const prefs = JSON.parse(raw) as {
        emailDigests?: boolean;
        caseAlerts?: boolean;
      };
      if (typeof prefs.emailDigests === "boolean") setEmailDigests(prefs.emailDigests);
      if (typeof prefs.caseAlerts === "boolean") setCaseAlerts(prefs.caseAlerts);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <PageScaffold
      crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Settings" }]}
      title="Settings"
      subtitle="Account and notification preferences"
    >
      {me.isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="General">
            <label className="block text-xs font-medium text-muted-foreground">
              Display name
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
              />
            </label>
            <p className="mt-2 text-xs text-muted-foreground">{me.data?.email}</p>
            <p className="text-xs text-muted-foreground">
              Department: {me.data?.department || "—"}
            </p>
            <PrimaryButton className="mt-4" onClick={() => save.mutate()}>
              {save.isPending ? "Saving…" : "Save"}
            </PrimaryButton>
          </Panel>
          <Panel title="Notifications">
            <label className="flex items-center justify-between text-sm text-foreground cursor-pointer">
              <span>Email digests</span>
              <input
                type="checkbox"
                checked={emailDigests}
                onChange={(e) => setEmailDigests(e.target.checked)}
                className="accent-primary h-4 w-4 rounded"
              />
            </label>
            <label className="mt-3 flex items-center justify-between text-sm text-foreground cursor-pointer">
              <span>Case assignment alerts</span>
              <input
                type="checkbox"
                checked={caseAlerts}
                onChange={(e) => setCaseAlerts(e.target.checked)}
                className="accent-primary h-4 w-4 rounded"
              />
            </label>
          </Panel>
          <Panel title="Theme">
            <ThemeSwitch label="Dark mode appearance" />
          </Panel>
        </div>
      )}
    </PageScaffold>
  );
}
