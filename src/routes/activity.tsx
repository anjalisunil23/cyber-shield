import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DataTable, PageScaffold, Pagination, Toolbar } from "@/components/ui-kit/PageKit";
import { investigationApi } from "@/services/investigationApi";
import type { ActivityItem } from "@/services/types";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/activity")({ component: Page });

function Page() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await investigationApi.activity(page);
      setActivities(data.items || []);
      setTotalPages(data.pages || 1);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [page]);

  const filteredActivities = searchQuery
    ? activities.filter(
        (act) =>
          act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          act.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (act.user?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : activities;

  return (
    <div className="min-h-screen bg-[#020617] px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <PageScaffold
          crumbs={[{ label: "App" }, { label: "Activity Logs" }]}
          title="Activity Logs"
          subtitle="Audit records of platform operations"
        >
          <Toolbar search={searchQuery} onSearch={setSearchQuery} />
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading activity logs...
            </div>
          ) : (
            <>
              <DataTable
                rows={filteredActivities}
                columns={[
                  {
                    key: "action",
                    header: "Action",
                    render: (r) => (
                      <span className="text-purple-400 font-semibold uppercase text-xs">
                        {r.action}
                      </span>
                    ),
                  },
                  {
                    key: "description",
                    header: "Description",
                    render: (r) => <span>{r.description}</span>,
                  },
                  { key: "user", header: "Actor", render: (r) => r.user?.full_name || "System" },
                  {
                    key: "created_at",
                    header: "Time",
                    render: (r) => new Date(r.created_at).toLocaleString(),
                  },
                ]}
              />
              <Pagination page={page} pages={totalPages} onPage={setPage} />
            </>
          )}
        </PageScaffold>
      </div>
    </div>
  );
}
