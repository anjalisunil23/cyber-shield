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
    <div className="min-h-screen bg-background px-4 py-8 text-foreground transition-colors">
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
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading notifications...
            </div>
          ) : shown.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground shadow-xs">
              <Bell className="mx-auto h-8 w-8 opacity-40 mb-2" />
              <p>No notifications found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {shown.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={`flex items-start justify-between rounded-xl border p-4 transition shadow-xs ${
                    n.is_read
                      ? "border-border bg-card/60 text-muted-foreground"
                      : "border-primary/30 bg-primary/10 text-foreground hover:border-primary/50 cursor-pointer"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{n.title}</span>
                      {!n.is_read && (
                        <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground">
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
