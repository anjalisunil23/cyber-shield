import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  DataTable,
  PageScaffold,
  Pagination,
  SelectFilter,
  Toolbar,
} from "@/components/ui-kit/PageKit";
import { EvidenceCard } from "@/components/ui-kit/Cards";
import { investigationApi } from "@/services/investigationApi";
import type { AdminEvidence } from "@/services/types";
import type { MockEvidence } from "@/data/mock/platform";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/investigator/evidence")({ component: Page });

function Page() {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [type, setType] = useState("All");
  const [evidence, setEvidence] = useState<AdminEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const loadAllEvidence = async () => {
    setLoading(true);
    try {
      const casesData = await investigationApi.listCases({ page_size: 100 });
      if (casesData.items && casesData.items.length > 0) {
        const promises = casesData.items.map((c) =>
          investigationApi.listEvidence(c.id).then((res) =>
            (res.items || []).map((e) => ({
              ...e,
              case_number: c.case_number,
            })),
          ),
        );
        const results = await Promise.all(promises);
        setEvidence(results.flat());
      } else {
        setEvidence([]);
      }
    } catch (err) {
      console.error("Failed to load evidence repository", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllEvidence();
  }, []);

  const filtered = evidence.filter((e) => {
    const matchesType = type === "All" || e.file_type.toLowerCase() === type.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      e.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.case_number || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <PageScaffold
      crumbs={[
        { label: "Investigator", to: "/investigator/dashboard" },
        { label: "Evidence Repository" },
      ]}
      title="Evidence Repository"
      subtitle="Search and view digital evidence items across all your cases"
    >
      <Toolbar
        search={searchQuery}
        onSearch={setSearchQuery}
        filters={
          <>
            <SelectFilter
              value={type}
              onChange={setType}
              options={["All", "image", "video", "audio", "pdf", "csv", "json"]}
            />
            <button
              type="button"
              className="rounded-xl border border-border px-3 py-2 text-xs bg-card text-foreground hover:bg-muted transition"
              onClick={() => setView(view === "grid" ? "table" : "grid")}
            >
              {view === "grid" ? "Table view" : "Grid view"}
            </button>
          </>
        }
      />
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading evidence repository...
        </div>
      ) : pageItems.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground shadow-xs">
          No evidence items found.
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((e) => (
            <Link key={e.id} to="/investigator/evidence/$evidenceId" params={{ evidenceId: e.id }}>
              <EvidenceCard
                item={{
                  id: e.id,
                  name: e.original_name,
                  type:
                    e.file_type === "pdf"
                      ? "pdf"
                      : ["image", "video", "audio", "document"].includes(e.file_type)
                        ? (e.file_type as MockEvidence["type"])
                        : "other",
                  size: `${(e.file_size / 1024).toFixed(1)} KB`,
                  caseNumber: e.case_number || "N/A",
                  uploadedBy: e.uploaded_by?.full_name || "Investigator",
                  uploadedAt: new Date(e.upload_date).toLocaleDateString(),
                  tags: e.tags || [],
                  sha256: e.sha256_hash,
                }}
              />
            </Link>
          ))}
        </div>
      ) : (
        <DataTable
          rows={pageItems}
          columns={[
            {
              key: "original_name",
              header: "File",
              render: (r: AdminEvidence) => (
                <Link
                  to="/investigator/evidence/$evidenceId"
                  params={{ evidenceId: r.id }}
                  className="text-primary hover:underline font-semibold"
                >
                  {r.original_name}
                </Link>
              ),
            },
            {
              key: "file_type",
              header: "Type",
              render: (r: AdminEvidence) => r.file_type.toUpperCase(),
            },
            {
              key: "case_number",
              header: "Case",
              render: (r: AdminEvidence) => r.case_number || "N/A",
            },
            {
              key: "file_size",
              header: "Size",
              render: (r: AdminEvidence) => `${(r.file_size / 1024).toFixed(1)} KB`,
            },
            {
              key: "upload_date",
              header: "Uploaded",
              render: (r: AdminEvidence) => new Date(r.upload_date).toLocaleDateString(),
            },
          ]}
        />
      )}
      <Pagination page={page} pages={totalPages} onPage={setPage} />
    </PageScaffold>
  );
}
