import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";

export const Route = createFileRoute("/dashboard/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => investigationApi.notifications(),
  });

  const markAll = useMutation({
    mutationFn: () => investigationApi.markAllRead(),
    onSuccess: () => {
      toast.success("All marked as read");
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Assignments, uploads, status changes, notes, and leads
          </p>
        </div>
        <button
          type="button"
          onClick={() => markAll.mutate()}
          className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
        >
          Mark all read
        </button>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <ul className="space-y-2">
        {(data || []).map((n) => (
          <li
            key={n.id}
            className={`rounded-2xl border px-4 py-3 transition-colors ${
              n.is_read
                ? "border-border bg-card/60 text-muted-foreground"
                : "border-primary/30 bg-primary/5 text-foreground"
            }`}
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={async () => {
                await investigationApi.markRead(n.id);
                void qc.invalidateQueries({ queryKey: ["notifications"] });
              }}
            >
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.message}</p>
              <p className="mt-1 text-xs text-muted-foreground/80">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </button>
          </li>
        ))}
        {!isLoading && !data?.length && <p className="text-sm text-muted-foreground">No notifications</p>}
      </ul>
    </div>
  );
}
