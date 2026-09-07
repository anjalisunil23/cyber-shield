import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageScaffold, GhostButton, SelectFilter } from "@/components/ui-kit/PageKit";
import { investigationApi } from "@/services/investigationApi";
import type { NotificationItem } from "@/services/types";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/notifications")({ component: Page });

function Page() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await investigationApi.notifications();
      setItems(data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await investigationApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // fallback local update
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await investigationApi.markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    }
  };

  const shown = items.filter((n) =>
    filter === "All" ? true : filter === "Unread" ? !n.is_read : n.is_read,
  );

  return (
    <div className="min-h-screen bg-[#020617] px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <PageScaffold
          crumbs={[{ label: "App" }, { label: "Notifications" }]}
          title="Notification Center"
          subtitle="Alerts and unread system events"
          actions={
            <GhostButton onClick={handleMarkAllRead}>
              <CheckCheck className="mr-1.5 h-4 w-4" />
              Mark all read
            </GhostButton>
          }
        >
          <div className="mb-4">
            <SelectFilter value={filter} onChange={setFilter} options={["All", "Unread", "Read"]} />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading notifications...
            </div>
          ) : shown.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-8 text-center text-slate-400">
              <Bell className="mx-auto h-8 w-8 opacity-40 mb-2" />
              <p>No notifications found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {shown.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={`flex items-start justify-between rounded-xl border p-4 transition ${
                    n.is_read
                      ? "border-white/5 bg-slate-900/40 text-slate-400"
                      : "border-purple-500/30 bg-purple-950/20 text-slate-100 hover:border-purple-500/50 cursor-pointer"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{n.title}</span>
                      {!n.is_read && (
                        <span className="inline-block h-2 w-2 rounded-full bg-purple-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300">{n.message}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageScaffold>
      </div>
    </div>
  );
}
