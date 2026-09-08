import { useEffect, useState } from "react";
import { Upload, X } from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui-kit/PageKit";
import { addEvidenceItem, useCaseList } from "@/data/mock/platformState";
import { MockEvidence } from "@/data/mock/platform";
import { investigationApi } from "@/services/investigationApi";

export function UploadEvidenceModal({
  isOpen,
  onClose,
  defaultCaseNumber,
  onUploaded,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultCaseNumber?: string;
  onUploaded?: (item: MockEvidence) => void;
}) {
  const storedCases = useCaseList();
  const [apiCases, setApiCases] = useState<{ id: string; caseNumber: string; title: string }[]>([]);
  const [uploadMode, setUploadMode] = useState<"file" | "folder">("file");
  const [name, setName] = useState("");
  const [type, setType] = useState<MockEvidence["type"]>("document");
  const [caseNumber, setCaseNumber] = useState(defaultCaseNumber || "CS-2026-0142");
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  const combinedCases = [...apiCases];
  for (const sc of storedCases) {
    if (!combinedCases.some((c) => c.caseNumber === sc.caseNumber || c.id === sc.id)) {
      combinedCases.push({ id: sc.id, caseNumber: sc.caseNumber, title: sc.title });
    }
  }
  const caseOptions = combinedCases.length > 0 ? combinedCases : storedCases;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const primaryFile = files[0];
    const fileName = primaryFile
      ? files.length > 1
        ? `${primaryFile.name} (+${files.length - 1} files)`
        : primaryFile.name
      : name.trim() || "evidence_upload.bin";
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    const fileSize = files.length ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB` : "1.5 MB";
    const tagArray = tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [uploadMode === "folder" ? "folder_import" : "file_upload", "supervisor"];

    const created = addEvidenceItem({
      name: fileName,
      type,
      size: fileSize,
      caseNumber,
      uploadedBy: "Superior Officer",
      uploadedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      tags: tagArray,
      sha256: `${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`,
    });

    if (onUploaded) onUploaded(created);
    onClose();
    setName("");
    setTags("");
    setFiles([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/20 text-primary">
              <Upload className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Upload Evidence</h3>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="mt-4 flex rounded-xl bg-muted p-1 border border-border">
          <button
            type="button"
            onClick={() => {
              setUploadMode("file");
              setFiles([]);
            }}
            className={`flex-1 rounded-lg py-1 text-xs font-semibold transition-colors ${
              uploadMode === "file"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📄 File(s)
          </button>
          <button
            type="button"
            onClick={() => {
              setUploadMode("folder");
              setFiles([]);
            }}
            className={`flex-1 rounded-lg py-1 text-xs font-semibold transition-colors ${
              uploadMode === "folder"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📁 Folder
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              {uploadMode === "folder" ? "Folder Attachment *" : "File Attachment *"}
            </label>
            {uploadMode === "file" ? (
              <input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    const list = Array.from(e.target.files);
                    setFiles(list);
                    if (!name && list[0]) setName(list[0].name);
                  }
                }}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2 text-xs text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/20 file:px-3 file:py-1 file:text-xs file:text-primary hover:file:bg-primary/30"
              />
            ) : (
              <input
                type="file"
                {...({
                  webkitdirectory: "",
                  directory: "",
                } as React.InputHTMLAttributes<HTMLInputElement>)}
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    const list = Array.from(e.target.files);
                    setFiles(list);
                    if (!name && list[0])
                      setName(list[0].webkitRelativePath.split("/")[0] || list[0].name);
                  }
                }}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2 text-xs text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/20 file:px-3 file:py-1 file:text-xs file:text-primary hover:file:bg-primary/30"
              />
            )}
            {files.length > 0 && (
              <p className="mt-1 text-[11px] text-primary">
                ✓ {files.length} file(s) selected (
                {uploadMode === "folder" ? "Folder structure preserved" : "Batch upload"})
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Evidence Name / Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. disk_image_dump.raw"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground">Evidence Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MockEvidence["type"])}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="pdf">PDF Document</option>
                <option value="document">Text / Data Log</option>
                <option value="other">Other Binary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground">Associated Case</label>
              <select
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {caseOptions.map((c) => (
                  <option key={c.id} value={c.caseNumber}>
                    {c.caseNumber} - {c.title.length > 25 ? `${c.title.slice(0, 25)}...` : c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="forensics, disk, cctv"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <GhostButton type="button" onClick={onClose}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit">Upload Evidence</PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
