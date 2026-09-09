import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageScaffold, Panel, StatusPill } from "@/components/ui-kit/PageKit";
import { investigationApi } from "@/services/investigationApi";
import type { EvidenceItem } from "@/services/types";
import { AlertTriangle, Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/investigator/evidence/$evidenceId")({ component: Page });

function Page() {
  const { evidenceId } = Route.useParams();
  const [e, setEvidence] = useState<EvidenceItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    investigationApi
      .getEvidence(evidenceId)
      .then((data: EvidenceItem) => {
        setEvidence(data);
      })
      .catch((err: unknown) => {
        console.error("Failed to load evidence details", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [evidenceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading evidence...
      </div>
    );
  }

  if (!e) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Evidence item not found or permission denied.
      </div>
    );
  }

  const downloadUrl = investigationApi.downloadEvidenceUrl(e.id);
  const hash = e.file_hash || e.sha256_hash;
  const exif = e.metadata_json?.exif;
  const warning =
    e.warning || (e.is_duplicate ? "Duplicate file detected (matching hash in case)" : null);

  return (
    <PageScaffold
      crumbs={[{ label: "Repository", to: "/investigator/evidence" }, { label: e.original_name }]}
      title="Evidence Viewer"
      subtitle={e.original_name}
    >
      {e.is_duplicate && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Preview" className="lg:col-span-2">
          <div className="flex flex-col items-center justify-center h-72 rounded-xl bg-muted/40 text-muted-foreground border border-border p-6 shadow-inner">
            <span className="font-bold text-sm uppercase text-primary tracking-wider mb-2">
              {e.file_type} File
            </span>
            <p className="text-xs text-muted-foreground mb-4">
              {e.mime_type || "Unknown MIME Type"}
            </p>
            <a
              href={downloadUrl}
              download={e.original_name}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-xs transition shadow-xs"
            >
              <Download className="h-4 w-4" /> Download Original File
            </a>
          </div>
        </Panel>

        <Panel title="Details & Hash">
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <dt className="text-muted-foreground">File size</dt>
              <dd className="font-medium text-foreground">{(e.file_size / 1024).toFixed(1)} KB</dd>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <dt className="text-muted-foreground">File Type</dt>
              <dd className="font-medium uppercase text-foreground">{e.file_type}</dd>
            </div>
            <div className="flex flex-col border-b border-border/50 pb-1.5">
              <dt className="text-muted-foreground mb-1">SHA-256 Hash</dt>
              <dd className="font-mono text-[10px] break-all bg-muted p-1.5 rounded border border-border text-primary select-all">
                {hash}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Duplicate</dt>
              <dd className="text-foreground">{e.is_duplicate ? "Yes (matching hash)" : "No"}</dd>
            </div>
          </dl>

          {exif && (
            <div className="mt-4 border-t border-border/50 pt-3">
              <span className="text-xs font-semibold text-primary block mb-1.5">
                📷 EXIF / Device Metadata
              </span>
              <div className="space-y-1 rounded-lg bg-muted p-2 font-mono text-[11px] text-foreground border border-border">
                {exif.Make && <p>Make: {exif.Make}</p>}
                {exif.Model && <p>Model: {exif.Model}</p>}
                {exif.DateTimeOriginal && <p>Timestamp: {exif.DateTimeOriginal}</p>}
                {exif.width && exif.height && (
                  <p>
                    Dimensions: {exif.width}x{exif.height}
                  </p>
                )}
                {exif.GPSInfo && <p>GPS: {JSON.stringify(exif.GPSInfo)}</p>}
              </div>
            </div>
          )}

          {e.tags && e.tags.length > 0 && (
            <div className="mt-4 border-t border-border/50 pt-3">
              <span className="text-xs text-muted-foreground block mb-1.5">Tags</span>
              <div className="flex flex-wrap gap-1">
                {e.tags.map((t) => (
                  <StatusPill key={t} value={t} />
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </PageScaffold>
  );
}
