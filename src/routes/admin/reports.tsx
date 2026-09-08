import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ReportCard } from "@/components/ui-kit/Cards";
import {
  ErrorState,
  LoadingBlock,
  PageScaffold,
  Pagination,
  Panel,
  PrimaryButton,
  Toolbar,
} from "@/components/ui-kit/PageKit";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";

export const Route = createFileRoute("/admin/reports")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reportType, setReportType] = useState<"case" | "department" | "investigator" | "evidence">(
    "department",
  );
  const [format, setFormat] = useState<"csv" | "html" | "pdf">("csv");
  const [caseId, setCaseId] = useState("");
  const [investigatorId, setInvestigatorId] = useState("");

  const reports = useQuery({
    queryKey: ["admin-reports", page],
    queryFn: () => investigationApi.adminListReports(page),
  });
  const cases = useQuery({
    queryKey: ["admin-cases-report"],
    queryFn: () => investigationApi.adminListCases({ page_size: 100 }),
  });
  const investigators = useQuery({
    queryKey: ["admin-investigators-report"],
    queryFn: () => investigationApi.adminListUsers({ role: "investigator", page_size: 100 }),
  });

  const generate = useMutation({
    mutationFn: () =>
      investigationApi.adminGenerateReport({
        report_type: reportType,
        format,
        case_id: caseId || undefined,
        investigator_id: investigatorId || undefined,
      }),
    onSuccess: (data) => {
      toast.success("Report generated");
      const blob = new Blob([data.content], {
        type: data.format === "csv" ? "text/csv" : "text/html",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.report_type}-report.${data.format === "csv" ? "csv" : "html"}`;
      a.click();
      URL.revokeObjectURL(url);
      void qc.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const filtered = (reports.data?.items || []).filter((r) =>
    !search.trim() ? true : JSON.stringify(r).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageScaffold
      crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Reports" }]}
      title="Reports"
      subtitle="Generate and review investigation reports"
    >
      <Panel title="Generate">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            generate.mutate();
          }}
        >
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as typeof reportType)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="department">Department Report</option>
            <option value="case">Case Report</option>
            <option value="investigator">Investigator Report</option>
            <option value="evidence">Evidence Report</option>
          </select>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as typeof format)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="csv">Export CSV</option>
            <option value="html">Export PDF/HTML</option>
            <option value="pdf">Export PDF</option>
          </select>
          {reportType === "case" && (
            <select
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select case</option>
              {(cases.data?.items || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number}
                </option>
              ))}
            </select>
          )}
          {reportType === "investigator" && (
            <select
              value={investigatorId}
              onChange={(e) => setInvestigatorId(e.target.value)}
              className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select investigator</option>
              {(investigators.data?.items || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          )}
          <PrimaryButton type="submit">
            {generate.isPending ? "Generating…" : "Generate & Export"}
          </PrimaryButton>
        </form>
      </Panel>

      <Toolbar search={search} onSearch={setSearch} />
      {reports.isLoading && <LoadingBlock />}
      {reports.isError && <ErrorState message={apiMessage(reports.error)} />}
      {!reports.isLoading && !reports.isError && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((r) => (
              <ReportCard
                key={r.id}
                title={r.title}
                format={r.format}
                author="Admin"
                created={new Date(r.created_at).toLocaleString()}
                onPreview={() => {
                  if (!r.content) {
                    toast.message("No preview content");
                    return;
                  }
                  const blob = new Blob([r.content], {
                    type: r.format === "csv" ? "text/csv" : "text/html",
                  });
                  const url = URL.createObjectURL(blob);
                  window.open(url, "_blank");
                }}
              />
            ))}
          </div>
          <Pagination
            page={reports.data?.page || 1}
            pages={reports.data?.pages || 1}
            onPage={setPage}
          />
        </>
      )}
    </PageScaffold>
  );
}
