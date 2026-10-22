import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEvidenceList } from "@/data/mock/platformState";
import { EvidencePreviewModal } from "@/components/evidence/EvidencePreviewModal";
import { PageScaffold, Panel } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/superior/evidence/$evidenceId")({ component: Page });

function Page() {
  const { evidenceId } = Route.useParams();
  const navigate = useNavigate();
  const evidenceList = useEvidenceList();
  const e = evidenceList.find((x) => x.id === evidenceId) || evidenceList[0];

  const handleClose = () => {
    navigate({ to: "/superior/evidence" });
  };

  if (!e) {
    return (
      <PageScaffold
        crumbs={[{ label: "Evidence", to: "/superior/evidence" }, { label: "Not Found" }]}
        title="Evidence Not Found"
      >
        <Panel>
          <p className="text-sm text-muted-foreground">
            The requested evidence item does not exist or has been deleted.
          </p>
        </Panel>
      </PageScaffold>
    );
  }

  return <EvidencePreviewModal evidence={e} onClose={handleClose} />;
}
