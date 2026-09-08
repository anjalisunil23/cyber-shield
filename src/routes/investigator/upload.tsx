import { createFileRoute } from "@tanstack/react-router";
import { FolderUp, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useCaseList } from "@/data/mock/platformState";
import { PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";
import { investigationApi } from "@/services/investigationApi";

export const Route = createFileRoute("/investigator/upload")({ component: Page });

function Page() {
  const storedCases = useCaseList();
  const [apiCases, setApiCases] = useState<{ id: string; caseNumber: string; title: string }[]>([]);
  const [uploadMode, setUploadMode] = useState<"file" | "folder">("file");
  const [files, setFiles] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    investigationApi
      .listCases({ page_size: 100 })
      .then((res) => {
        if (res.items) {
          setApiCases(
            res.items.map((c) => ({ id: c.id, caseNumber: c.case_number, title: c.title })),
          );
        }
      })
      .catch(() => {});
  }, []);

  const combinedCases = [...apiCases];
  for (const sc of storedCases) {
    if (!combinedCases.some((c) => c.caseNumber === sc.caseNumber || c.id === sc.id)) {
      combinedCases.push({ id: sc.id, caseNumber: sc.caseNumber, title: sc.title });
    }
  }
  const caseOptions = combinedCases.length > 0 ? combinedCases : storedCases;

  return (
    <PageScaffold
      crumbs={[
        { label: "Investigator", to: "/investigator/dashboard" },
        { label: "Upload Evidence" },
      ]}
      title="Upload Evidence"
      subtitle="Drag & drop or browse files and folders"
    >
      <Panel>
        <div className="mb-4 flex rounded-xl bg-muted p-1 border border-border max-w-sm">
          <button
            type="button"
            onClick={() => {
              setUploadMode("file");
              setFiles([]);
            }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              uploadMode === "file"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📄 Select File(s)
          </button>
          <button
            type="button"
            onClick={() => {
              setUploadMode("folder");
              setFiles([]);
            }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              uploadMode === "folder"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📁 Select Entire Folder
          </button>
        </div>

        <label className="mb-3 block text-xs font-medium text-muted-foreground">
          Case
          <select className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60">
            {caseOptions.map((c) => (
              <option key={c.id}>
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
            const names = Array.from(e.dataTransfer.files).map((f) => f.name);
            setFiles((p) => [...p, ...names]);
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
            {uploadMode === "folder"
              ? "Preserves directory hierarchy and all nested files"
              : "Images, video, audio, PDF, documents, exports"}
          </p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition shadow-xs">
            {uploadMode === "folder" ? "Choose Folder" : "Browse Files"}
            {uploadMode === "file" ? (
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) =>
                  setFiles((p) => [...p, ...Array.from(e.target.files || []).map((f) => f.name)])
                }
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
                onChange={(e) =>
                  setFiles((p) => [
                    ...p,
                    ...Array.from(e.target.files || []).map((f) => f.webkitRelativePath || f.name),
                  ])
                }
              />
            )}
          </label>
        </div>

        {!!files.length && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground font-semibold mb-2">
              {files.length} Item(s) Selected:
            </p>
            <ul className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-border bg-muted/50 p-2">
              {files.map((f, i) => (
                <li key={i} className="text-xs font-mono text-foreground truncate">
                  • {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        <PrimaryButton className="mt-4" onClick={() => setFiles([])}>
          Upload ({files.length ? `${files.length} items` : "Confirm"})
        </PrimaryButton>
      </Panel>
    </PageScaffold>
  );
}
