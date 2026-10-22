import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  DataTable,
  EmptyState,
  LoadingBlock,
  PageScaffold,
  Pagination,
  SelectFilter,
  Toolbar,
} from "@/components/ui-kit/PageKit";
import { EvidenceCard } from "@/components/ui-kit/Cards";
import { SecureVaultVisual } from "@/components/cyber/SecureVaultVisual";
import { investigationApi } from "@/services/investigationApi";
import type { AdminEvidence } from "@/services/types";
import type { MockEvidence } from "@/data/mock/platform";
import { EvidencePreviewModal } from "@/components/evidence/EvidencePreviewModal";

export const Route = createFileRoute("/investigator/evidence")({ component: Page });

function Page() {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [type, setType] = useState("All");
  const [evidence, setEvidence] = useState<AdminEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MockEvidence | null>(null);

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
      crumbs={[{ label: "Investigator", to: "/investigator/dashboard" }, { label: "Evidence" }]}
      title="Evidence"
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
        <LoadingBlock rows={8} />
      ) : pageItems.length === 0 ? (
        <EmptyState title="No evidence uploaded yet." visual={<SecureVaultVisual />} />
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((e) => {
            const cardItem: MockEvidence = {
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
            };
            return (
              <EvidenceCard key={e.id} item={cardItem} onOpen={() => setSelectedItem(cardItem)} />
            );
          })}
        </div>
      ) : (
        <DataTable
          rows={pageItems}
          columns={[
            {
              key: "original_name",
              header: "File",
              render: (r: AdminEvidence) => (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedItem({
                      id: r.id,
                      name: r.original_name,
                      type:
                        r.file_type === "pdf"
                          ? "pdf"
                          : ["image", "video", "audio", "document"].includes(r.file_type)
                            ? (r.file_type as MockEvidence["type"])
                            : "other",
                      size: `${(r.file_size / 1024).toFixed(1)} KB`,
                      caseNumber: r.case_number || "N/A",
                      uploadedBy: r.uploaded_by?.full_name || "Investigator",
                      uploadedAt: new Date(r.upload_date).toLocaleDateString(),
                      tags: r.tags || [],
                      sha256: r.sha256_hash,
                    })
                  }
                  className="text-primary hover:underline font-semibold text-left cursor-pointer"
                >
                  {r.original_name}
                </button>
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

      {selectedItem && (
        <EvidencePreviewModal evidence={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
      <Outlet />
    </PageScaffold>
  );
}
