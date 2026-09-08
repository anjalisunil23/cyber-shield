import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import {
  PageScaffold,
  Toolbar,
  useClientTable,
  Pagination,
  PrimaryButton,
} from "@/components/ui-kit/PageKit";
import { EvidenceCard } from "@/components/ui-kit/Cards";
import { useEvidenceList, deleteEvidenceItem } from "@/data/mock/platformState";
import { UploadEvidenceModal } from "@/components/superior/UploadEvidenceModal";

export const Route = createFileRoute("/superior/evidence")({ component: Page });

function Page() {
  const evidenceList = useEvidenceList();
  const navigate = useNavigate();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const table = useClientTable(evidenceList, 6);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete evidence "${name}"?`)) {
      deleteEvidenceItem(id);
    }
  };

  return (
    <PageScaffold
      crumbs={[{ label: "Superior", to: "/superior/dashboard" }, { label: "Evidence Review" }]}
      title="Evidence Management"
      subtitle="Upload, inspect, and delete case evidence"
      actions={
        <PrimaryButton onClick={() => setIsUploadOpen(true)}>
          <Upload className="mr-1.5 inline h-4 w-4" /> Upload Evidence
        </PrimaryButton>
      }
    >
      <Toolbar search={table.search} onSearch={table.setSearch} />

      {table.rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No evidence records found. Click "Upload Evidence" above to add evidence.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {table.rows.map((e) => (
            <EvidenceCard
              key={e.id}
              item={e}
              onOpen={() =>
                navigate({ to: "/superior/evidence/$evidenceId", params: { evidenceId: e.id } })
              }
              onDelete={() => handleDelete(e.id, e.name)}
            />
          ))}
        </div>
      )}

      <Pagination page={table.page} pages={table.pages} onPage={table.setPage} />

      <UploadEvidenceModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </PageScaffold>
  );
}
