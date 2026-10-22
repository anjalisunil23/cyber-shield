import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Outlet } from "@tanstack/react-router";
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
import { EvidencePreviewModal } from "@/components/evidence/EvidencePreviewModal";
import type { MockEvidence } from "@/data/mock/platform";

export const Route = createFileRoute("/superior/evidence")({ component: Page });

function Page() {
  const evidenceList = useEvidenceList();
  const navigate = useNavigate();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<MockEvidence | null>(null);

  const table = useClientTable(evidenceList, 6);

  // Check URL on mount or change to auto-open evidence if URL contains /superior/evidence/:id
  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    const match = path.match(/\/superior\/evidence\/([^/?#]+)/);
    if (match && match[1]) {
      const targetId = match[1];
      const found = evidenceList.find((x) => x.id === targetId);
      if (found) {
        setSelectedEvidence(found);
      }
    }
  }, [evidenceList]);

  const handleOpenEvidence = (item: MockEvidence) => {
    setSelectedEvidence(item);
    try {
      void navigate({
        to: "/superior/evidence/$evidenceId",
        params: { evidenceId: item.id },
      });
    } catch {
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", `/superior/evidence/${item.id}`);
      }
    }
  };

  const handleCloseEvidence = () => {
    setSelectedEvidence(null);
    try {
      void navigate({ to: "/superior/evidence" });
    } catch {
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", `/superior/evidence`);
      }
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete evidence "${name}"?`)) {
      if (selectedEvidence?.id === id) {
        setSelectedEvidence(null);
      }
      deleteEvidenceItem(id);
    }
  };

  return (
    <PageScaffold
      crumbs={[{ label: "Superior", to: "/superior/dashboard" }, { label: "Evidence Review" }]}
      title="Evidence Management"
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
              onOpen={() => handleOpenEvidence(e)}
              onDelete={() => handleDelete(e.id, e.name)}
            />
          ))}
        </div>
      )}

      <Pagination page={table.page} pages={table.pages} onPage={table.setPage} />

      <UploadEvidenceModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

      {/* Interactive Evidence Preview Modal */}
      {selectedEvidence && (
        <EvidencePreviewModal evidence={selectedEvidence} onClose={handleCloseEvidence} />
      )}

      {/* Support child route rendering if routed via TanStack Router */}
      <Outlet />
    </PageScaffold>
  );
}
