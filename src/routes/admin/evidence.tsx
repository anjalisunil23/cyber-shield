import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EvidenceCard } from "@/components/ui-kit/Cards";
import { EvidencePreviewModal } from "@/components/evidence/EvidencePreviewModal";
import {
  ConfirmDialog,
  ErrorState,
  LoadingBlock,
  Modal,
  PageScaffold,
  Pagination,
  SelectFilter,
  Toolbar,
  GhostButton,
} from "@/components/ui-kit/PageKit";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";
import type { AdminEvidence } from "@/services/types";

export const Route = createFileRoute("/admin/evidence")({ component: Page });

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminEvidence | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      q: search || undefined,
      file_type: cat === "All" ? undefined : cat,
      page,
      page_size: 6,
    }),
    [search, cat, page],
  );

  const evidence = useQuery({
    queryKey: ["admin-evidence", params],
    queryFn: () => investigationApi.adminListEvidence(params),
  });
  const storage = useQuery({
    queryKey: ["admin-evidence-storage"],
    queryFn: () => investigationApi.adminEvidenceStorage(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => investigationApi.adminDeleteEvidence(id),
    onSuccess: () => {
      toast.success("Evidence deleted");
      setDeleteId(null);
      setSelected(null);
      void qc.invalidateQueries({ queryKey: ["admin-evidence"] });
      void qc.invalidateQueries({ queryKey: ["admin-evidence-storage"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const cards = (evidence.data?.items || []).map((e) => ({
    id: e.id,
    name: e.original_name,
    type: (["image", "video", "audio", "pdf", "document", "other"].includes(e.file_type)
      ? e.file_type
      : "other") as "image" | "video" | "audio" | "pdf" | "document" | "other",
    size: formatBytes(e.file_size),
    caseNumber: e.case_number || e.case_id,
    uploadedBy: e.uploaded_by?.full_name || "—",
    uploadedAt: new Date(e.upload_date).toLocaleString(),
    tags: e.tags || [],
    sha256: e.sha256_hash,
    raw: e,
  }));

  return (
    <PageScaffold
      crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Evidence" }]}
      title="Evidence"
    >
      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        filters={
          <SelectFilter
            value={cat}
            onChange={(v) => {
              setCat(v);
              setPage(1);
            }}
            options={["All", "image", "video", "audio", "pdf", "document", "other"]}
          />
        }
      />
      {evidence.isLoading && <LoadingBlock />}
      {evidence.isError && <ErrorState message={apiMessage(evidence.error)} />}
      {!evidence.isLoading && !evidence.isError && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((e) => (
              <EvidenceCard key={e.id} item={e} onOpen={() => setSelected(e.raw)} />
            ))}
          </div>
          <Pagination
            page={evidence.data?.page || 1}
            pages={evidence.data?.pages || 1}
            onPage={setPage}
          />
        </>
      )}

      {selected && (
        <EvidencePreviewModal
          evidence={{
            id: selected.id,
            name: selected.original_name,
            type:
              selected.file_type === "pdf"
                ? "pdf"
                : ["image", "video", "audio", "document"].includes(selected.file_type)
                  ? (selected.file_type as "image" | "video" | "audio" | "document" | "pdf")
                  : "other",
            size: formatBytes(selected.file_size),
            caseNumber: selected.case_number || "CASE-REF",
            uploadedBy: selected.uploaded_by?.full_name || "Investigator",
            uploadedAt: new Date(selected.upload_date).toLocaleDateString(),
            tags: selected.tags || [selected.file_type],
            sha256: selected.sha256_hash,
          }}
          onClose={() => setSelected(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete evidence?"
        message="This permanently removes the file from storage."
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />
    </PageScaffold>
  );
}
