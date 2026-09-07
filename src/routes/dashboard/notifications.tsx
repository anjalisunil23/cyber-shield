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
          <h1 className="text-2xl font-bold text-slate-50">Notifications</h1>
          <p className="text-sm text-slate-400">
            Assignments, uploads, status changes, notes, and leads
          </p>
        </div>
        <button
          type="button"
          onClick={() => markAll.mutate()}
          className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
        >
          Mark all read
        </button>
      </div>
      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      <ul className="space-y-2">
        {(data || []).map((n) => (
          <li
            key={n.id}
            className={`rounded-2xl border px-4 py-3 ${
              n.is_read ? "border-white/5 bg-[#111827]/50" : "border-cyan/20 bg-cyan/5"
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
              <p className="text-sm font-medium text-slate-100">{n.title}</p>
              <p className="text-sm text-slate-400">{n.message}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </button>
          </li>
        ))}
        {!isLoading && !data?.length && <p className="text-sm text-slate-500">No notifications</p>}
      </ul>
    </div>
  );
}
