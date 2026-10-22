import { createFileRoute } from "@tanstack/react-router";
import { FolderUp, Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";
import { investigationApi } from "@/services/investigationApi";
import type { EvidenceItem } from "@/services/types";

export const Route = createFileRoute("/investigator/upload")({ component: Page });

function Page() {
  const [apiCases, setApiCases] = useState<{ id: string; caseNumber: string; title: string }[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "folder">("file");
  const [fileList, setFileList] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<EvidenceItem[]>([]);

  useEffect(() => {
    investigationApi
      .listCases({ page_size: 100 })
      .then((res) => {
        const items = (res.items || []).map((c) => ({
          id: c.id,
          caseNumber: c.case_number,
          title: c.title,
        }));
        setApiCases(items);
        if (items[0]) {
          setSelectedCaseId((prev) => prev || items[0].id);
        }
      })
      .catch(() => toast.error("Unable to load assigned cases"));
  }, []);

  const addFiles = (incoming: File[]) => {
    setFileList((prev) => [...prev, ...incoming]);
  };

  const handleUpload = async () => {
    if (!selectedCaseId) {
      toast.error("Select an assigned case first");
      return;
    }
    if (!fileList.length) {
      toast.error("Choose at least one evidence file");
      return;
    }
    setUploading(true);
    const uploaded: EvidenceItem[] = [];
    try {
      for (const file of fileList) {
        const item = await investigationApi.uploadEvidence(selectedCaseId, file);
        uploaded.push(item);
        if (item.is_duplicate || item.warning) {
          toast.warning(item.warning || `Duplicate detected for ${item.original_name}`);
        }
      }
      setResults(uploaded);
      setFileList([]);
      toast.success(`Uploaded ${uploaded.length} file(s).`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageScaffold
      crumbs={[
        { label: "Investigator", to: "/investigator/dashboard" },
        { label: "Upload Evidence" },
      ]}
      title="Upload"
    >
      <Panel>
        <div className="mb-4 flex rounded-xl bg-muted p-1 border border-border max-w-sm">
          <button
            type="button"
            onClick={() => {
              setUploadMode("file");
              setFileList([]);
            }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              uploadMode === "file"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Select File(s)
          </button>
          <button
            type="button"
            onClick={() => {
              setUploadMode("folder");
              setFileList([]);
            }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              uploadMode === "folder"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Select Entire Folder
          </button>
        </div>

        <label className="mb-3 block text-xs font-medium text-muted-foreground">
          Case
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
          >
            {apiCases.length === 0 && <option value="">No assigned cases</option>}
            {apiCases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.caseNumber} — {c.title}
              </option>
            ))}
          </select>
        </label>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            addFiles(Array.from(e.dataTransfer.files));
          }}
          className={`grid place-items-center rounded-2xl border border-dashed px-6 py-14 text-center transition ${
            drag ? "border-primary bg-primary/10" : "border-border bg-muted/30"
          }`}
        >
          {uploadMode === "folder" ? (
            <FolderUp className="mb-3 h-10 w-10 text-primary" />
          ) : (
            <Upload className="mb-3 h-10 w-10 text-primary" />
          )}
          <p className="text-sm font-medium text-foreground">
            {uploadMode === "folder" ? "Drop evidence folder here" : "Drop evidence files here"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            SHA-256 hash, duplicate detection, metadata, and AI extraction run after upload
          </p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition shadow-xs">
            {uploadMode === "folder" ? "Choose Folder" : "Browse Files"}
            {uploadMode === "file" ? (
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => addFiles(Array.from(e.target.files || []))}
              />
            ) : (
              <input
                type="file"
                {...({
                  webkitdirectory: "",
                  directory: "",
                } as React.InputHTMLAttributes<HTMLInputElement>)}
                multiple
                className="hidden"
                onChange={(e) => addFiles(Array.from(e.target.files || []))}
              />
            )}
          </label>
        </div>

        {!!fileList.length && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground font-semibold mb-2">
              {fileList.length} Item(s) Selected:
            </p>
            <ul className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-border bg-muted/50 p-2">
              {fileList.map((f, i) => (
                <li key={`${f.name}-${i}`} className="text-xs font-mono text-foreground truncate">
                  • {f.webkitRelativePath || f.name} ({(f.size / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}

        <PrimaryButton className="mt-4" onClick={uploading ? undefined : handleUpload}>
          {uploading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading & processing…
            </span>
          ) : (
            `Upload (${fileList.length ? `${fileList.length} items` : "Confirm"})`
          )}
        </PrimaryButton>
      </Panel>

      {results.length > 0 && (
        <Panel title="Upload results" className="mt-4">
          <ul className="space-y-2 text-xs">
            {results.map((item) => (
              <li key={item.id} className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="font-semibold text-foreground">{item.original_name}</p>
                <p className="font-mono text-[10px] text-muted-foreground break-all">
                  SHA-256: {item.sha256_hash}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Status: {item.processing_status || "UPLOADED"}
                  {item.is_duplicate ? " · Duplicate detected — matching record preserved" : ""}
                </p>
                {item.warning && <p className="mt-1 text-amber-600">{item.warning}</p>}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </PageScaffold>
  );
}
