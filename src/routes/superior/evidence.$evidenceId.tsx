import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { PageScaffold, Panel, StatusPill, GhostButton } from "@/components/ui-kit/PageKit";
import { useEvidenceList, deleteEvidenceItem } from "@/data/mock/platformState";

export const Route = createFileRoute("/superior/evidence/$evidenceId")({ component: Page });

function Page() {
  const { evidenceId } = Route.useParams();
  const navigate = useNavigate();
  const evidenceList = useEvidenceList();
  const e = evidenceList.find((x) => x.id === evidenceId) || evidenceList[0];

  const handleDelete = () => {
    if (!e) return;
    if (window.confirm(`Are you sure you want to delete evidence item "${e.name}"?`)) {
      deleteEvidenceItem(e.id);
      navigate({ to: "/superior/evidence" });
    }
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

  return (
    <PageScaffold
      crumbs={[{ label: "Evidence", to: "/superior/evidence" }, { label: e.name }]}
      title={e.name}
      subtitle={`${e.type} · ${e.size}`}
      actions={
        <GhostButton
          onClick={handleDelete}
          className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
        >
          <Trash2 className="mr-1.5 inline h-4 w-4" /> Delete Evidence
        </GhostButton>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Viewer" className="lg:col-span-2">
          <div className="grid h-64 place-items-center rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
            {e.type === "image" && "Image viewer mock"}
            {e.type === "video" && "Video player mock"}
            {e.type === "audio" && "Audio player mock"}
            {e.type === "pdf" && "PDF viewer mock"}
            {(e.type === "document" || e.type === "other") && "Document viewer mock"}
          </div>
        </Panel>
        <Panel title="Metadata">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Case</dt>
              <dd className="text-cyan font-medium">{e.caseNumber}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">SHA256</dt>
              <dd className="font-mono text-xs text-foreground">{e.sha256}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Uploaded</dt>
              <dd className="text-foreground">{e.uploadedAt}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">By</dt>
              <dd className="text-foreground">{e.uploadedBy}</dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-1">
            {e.tags.map((t) => (
              <StatusPill key={t} value={t} />
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-muted-foreground">
            AI panel placeholder — OCR / objects / transcript
          </div>
        </Panel>
      </div>
    </PageScaffold>
  );
}
