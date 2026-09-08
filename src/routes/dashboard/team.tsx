import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { investigationApi } from "@/services/investigationApi";

export const Route = createFileRoute("/dashboard/team")({
  component: TeamPage,
});

function TeamPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => investigationApi.listUsers(),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Investigators</h1>
        <p className="text-sm text-muted-foreground">Team directory for case assignment</p>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((u) => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="px-4 py-3 text-foreground font-medium">{u.full_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3 text-primary font-mono">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
