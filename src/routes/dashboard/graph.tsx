import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { investigationApi } from "@/services/investigationApi";

export const Route = createFileRoute("/dashboard/graph")({
  component: GraphHubPage,
});

function GraphHubPage() {
  const casesQ = useQuery({
    queryKey: ["cases", "graph-hub"],
    queryFn: () => investigationApi.listCases({ page_size: 30 }),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relationship Graph</h1>
        <p className="text-sm text-muted-foreground">
          Manual entity links (evidence ↔ person/device/location). AI auto-linking arrives in Phase
          2.
        </p>
      </div>
      <ul className="space-y-2">
        {(casesQ.data?.items || []).map((c) => (
          <li key={c.id}>
            <Link
              to="/dashboard/cases/$caseId"
              params={{ caseId: c.id }}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/40 shadow-sm transition-colors"
            >
              <span className="text-sm text-foreground font-medium">{c.title}</span>
              <span className="text-xs text-primary font-medium">Manage relationships →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
