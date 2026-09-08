import { useState, useRef } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileArchive,
  FileCheck2,
  FileCode,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FolderLock,
  ImageIcon,
  Paperclip,
  Plus,
  Tag,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { MockNote, NoteAttachment } from "@/data/mock/platform";
import { useCaseList, useEvidenceList } from "@/data/mock/platformState";

interface NoteDetailsPanelProps {
  note: MockNote | null;
  onUpdateNote: (updates: Partial<MockNote>) => void;
  onInsertEvidence?: (evidenceName: string) => void;
  onInsertAttachment?: (attachmentMarkdown: string) => void;
  onClose?: () => void;
  className?: string;
}

const PRESET_TAGS = [
  "phishing",
  "malware",
  "credential-theft",
  "OSINT",
  "evidence",
  "follow-up",
  "high-priority",
  "forensic-image",
];

const STATUS_OPTIONS = ["Working", "In Review", "Finalized", "Archived"];

export function NoteDetailsPanel({
  note,
  onUpdateNote,
  onInsertEvidence,
  onInsertAttachment,
  onClose,
  className = "",
}: NoteDetailsPanelProps) {
  const cases = useCaseList();
  const evidenceList = useEvidenceList();
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isInsertingEvidence, setIsInsertingEvidence] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!note) {
    return (
      <div className={`p-6 text-center text-xs text-muted-foreground ${className}`}>
        Select or create a note to view metadata
      </div>
    );
  }

  // Extract evidence references from note body
  const detectedEvidence: string[] = [];
  const evMatch = note.body.matchAll(/(\[Evidence:\s*([^\]]+)\]|#EV-\d{4}-\d+)/g);
  for (const m of evMatch) {
    const ref = m[2] || m[1];
    if (!detectedEvidence.includes(ref)) {
      detectedEvidence.push(ref);
    }
  }

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (!clean) return;
    const currentTags = note.tags || [];
    if (!currentTags.includes(clean)) {
      onUpdateNote({ tags: [...currentTags, clean] });
    }
    setNewTagInput("");
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = note.tags || [];
    onUpdateNote({ tags: currentTags.filter((t) => t !== tagToRemove) });
  };

  // Handle File Upload for Attachments
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: NoteAttachment[] = [...(note.attachments || [])];

    Array.from(files).forEach((file) => {
      let sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
      if (file.size > 1024 * 1024) {
        sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      const newAtt: NoteAttachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: sizeStr,
        type: file.type || "application/octet-stream",
        uploadedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (loadEv) => {
          newAtt.url = loadEv.target?.result as string;
          onUpdateNote({
            attachments: [...(note.attachments || []), newAtt],
          });
        };
        reader.readAsDataURL(file);
      } else {
        newAttachments.push(newAtt);
      }
    });

    if (newAttachments.length > (note.attachments || []).length) {
      onUpdateNote({ attachments: newAttachments });
      toast.success(`Attached ${files.length} document(s) to note`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (attId: string) => {
    const currentAtts = note.attachments || [];
    onUpdateNote({ attachments: currentAtts.filter((a) => a.id !== attId) });
    toast.info("Attachment removed");
  };

  const handleDownloadAttachment = (att: NoteAttachment) => {
    if (att.url) {
      const a = document.createElement("a");
      a.href = att.url;
      a.download = att.name;
      a.click();
    } else {
      const blob = new Blob([`Forensic Attachment: ${att.name}\nSize: ${att.size}\nCase: ${note.caseNumber}`], {
        type: "text/plain",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.name;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success(`Downloading ${att.name}`);
  };

  const handleInsertAttachmentLink = (att: NoteAttachment) => {
    if (att.type.startsWith("image/") && att.url) {
      onInsertAttachment?.(`![${att.name}](${att.url})`);
    } else {
      onInsertAttachment?.(`\n[Attachment: ${att.name} (${att.size})]\n`);
    }
    toast.success(`Inserted ${att.name} into document`);
  };

  const getFileIcon = (type: string, name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (type.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "")) {
      return <ImageIcon className="h-4 w-4 text-pink-500" />;
    }
    if (type === "application/pdf" || ext === "pdf") {
      return <FileText className="h-4 w-4 text-rose-500" />;
    }
    if (["pcap", "cap", "e01", "raw", "bin"].includes(ext || "")) {
      return <FileCode className="h-4 w-4 text-cyan" />;
    }
    if (["csv", "xlsx", "xls", "tsv"].includes(ext || "")) {
      return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
    }
    if (["zip", "tar", "gz", "7z", "rar"].includes(ext || "")) {
      return <FileArchive className="h-4 w-4 text-amber-500" />;
    }
    return <Paperclip className="h-4 w-4 text-primary" />;
  };

  return (
    <div
      className={`flex h-full flex-col border-l border-border bg-card/95 p-4 space-y-5 overflow-y-auto backdrop-blur-xs select-none text-xs ${className}`}
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-bold tracking-tight text-foreground uppercase">Document Info</h3>
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            {note.id}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close Details Drawer"
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Case Selector */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
          <FolderLock className="h-3.5 w-3.5 text-cyan" />
          Associated Case
        </label>
        <select
          value={note.caseNumber}
          onChange={(e) => onUpdateNote({ caseNumber: e.target.value })}
          className="w-full rounded-xl border border-border bg-input px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition cursor-pointer"
        >
          {cases.map((c) => (
            <option key={c.id} value={c.caseNumber}>
              {c.caseNumber} — {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Status Selector */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          Investigation Status
        </label>
        <select
          value={note.status || "Working"}
          onChange={(e) => onUpdateNote({ status: e.target.value })}
          className="w-full rounded-xl border border-border bg-input px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition cursor-pointer"
        >
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Author & Timestamps */}
      <div className="rounded-xl border border-border/80 bg-muted/40 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3.5 w-3.5 text-primary" /> Investigator
          </span>
          <span className="font-semibold text-foreground">{note.author}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Created
          </span>
          <span className="font-mono text-[11px] text-foreground">{note.created || "Aug 1, 2026"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Last updated
          </span>
          <span className="font-mono text-[11px] text-foreground">{note.updatedAt}</span>
        </div>
      </div>

      {/* Attached Documents & Files Section */}
      <div className="space-y-2.5 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
            <Paperclip className="h-3.5 w-3.5 text-primary" /> Attached Documents ({note.attachments?.length || 0})
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
          >
            <Upload className="h-3 w-3" /> Attach File
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.csv,.json,.pcap,.cap,.e01,.raw,.png,.jpg,.jpeg,.zip"
        />

        {/* Attachment Cards List */}
        <div className="space-y-2">
          {(note.attachments || []).map((att) => (
            <div
              key={att.id}
              className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card p-2.5 shadow-2xs hover:border-primary/40 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted/80">
                    {getFileIcon(att.type, att.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground text-xs" title={att.name}>
                      {att.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {att.size} · {att.uploadedAt}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  title="Remove Attachment"
                  className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Action Buttons: Insert in note, Download */}
              <div className="flex items-center justify-end gap-1.5 border-t border-border/50 pt-1.5 mt-0.5">
                <button
                  type="button"
                  onClick={() => handleInsertAttachmentLink(att)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10 transition cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Insert in Note
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadAttachment(att)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                >
                  <Download className="h-3 w-3" /> Download
                </button>
              </div>
            </div>
          ))}

          {(!note.attachments || note.attachments.length === 0) && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-center hover:bg-muted/40 transition cursor-pointer"
            >
              <Upload className="h-5 w-5 text-muted-foreground/60 mb-1" />
              <p className="text-xs font-medium text-foreground">Click to attach documents</p>
              <p className="text-[10px] text-muted-foreground">PDFs, PCAP, Word docs, logs, images</p>
            </div>
          )}
        </div>
      </div>

      {/* Tags Manager */}
      <div className="space-y-2 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
            <Tag className="h-3.5 w-3.5 text-primary" /> Investigation Tags
          </label>
          <button
            type="button"
            onClick={() => setIsAddingTag(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
          >
            <Plus className="h-3 w-3" /> Add Tag
          </button>
        </div>

        {/* Active Tags */}
        <div className="flex flex-wrap gap-1.5">
          {(note.tags || []).map((tag) => (
            <span
              key={tag}
              className="group inline-flex items-center gap-1 rounded-lg border border-border bg-muted/80 px-2 py-0.5 text-xs font-medium text-foreground"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-border hover:text-foreground transition cursor-pointer"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          {(!note.tags || note.tags.length === 0) && (
            <p className="text-[11px] text-muted-foreground italic">No tags attached</p>
          )}
        </div>

        {/* Add Tag Input / Suggestions */}
        {isAddingTag && (
          <div className="mt-2 rounded-xl border border-border bg-card p-2.5 shadow-sm space-y-2">
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                type="text"
                placeholder="Type tag and press Enter…"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTag(newTagInput);
                  if (e.key === "Escape") setIsAddingTag(false);
                }}
                className="w-full rounded-lg border border-border bg-input px-2.5 py-1 text-xs text-foreground outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => handleAddTag(newTagInput)}
                className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white cursor-pointer"
              >
                Add
              </button>
            </div>
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 pt-1">
              {PRESET_TAGS.filter((t) => !(note.tags || []).includes(t)).slice(0, 5).map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => handleAddTag(pt)}
                  className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                >
                  +{pt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Evidence References in this note */}
      <div className="space-y-2 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
            <FileSearch className="h-3.5 w-3.5 text-cyan" /> Evidence References
          </label>
          <button
            type="button"
            onClick={() => setIsInsertingEvidence(!isInsertingEvidence)}
            className="flex items-center gap-1 text-[11px] font-semibold text-cyan hover:underline cursor-pointer"
          >
            <Plus className="h-3 w-3" /> Insert
          </button>
        </div>

        {/* Evidence picker dropdown */}
        {isInsertingEvidence && (
          <div className="rounded-xl border border-border bg-card p-2 shadow-md space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Select evidence to insert:</p>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {evidenceList.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => {
                    onInsertEvidence?.(ev.name);
                    setIsInsertingEvidence(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <span className="truncate">{ev.name}</span>
                  <span className="font-mono text-[10px] text-cyan shrink-0">{ev.caseNumber}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Detected evidence chips */}
        <div className="space-y-1.5">
          {detectedEvidence.length > 0 ? (
            detectedEvidence.map((evRef, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1.5 text-xs text-cyan dark:bg-cyan-950/20"
              >
                <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate font-mono text-[11px]">{evRef}</span>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-muted-foreground italic">
              No evidence referenced in note body yet. Use "+ Insert" above or type [Evidence: name].
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
