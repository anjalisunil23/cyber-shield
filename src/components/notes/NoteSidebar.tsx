import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Copy,
  Edit2,
  FolderLock,
  MoreVertical,
  Pin,
  PinOff,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import type { MockNote } from "@/data/mock/platform";

interface NoteSidebarProps {
  notes: MockNote[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onTogglePin: (id: string) => void;
  onDuplicateNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onRenameNote: (id: string, newTitle: string) => void;
  onClose?: () => void;
  className?: string;
}

type FilterTab = "all" | "pinned" | "recent";

export function NoteSidebar({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onTogglePin,
  onDuplicateNote,
  onDeleteNote,
  onRenameNote,
  onClose,
  className = "",
}: NoteSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Filter by Tab
    if (activeTab === "pinned") {
      result = result.filter((n) => n.pinned);
    } else if (activeTab === "recent") {
      result.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.caseNumber.toLowerCase().includes(q) ||
          (n.tags && n.tags.some((t) => t.toLowerCase().includes(q))),
      );
    }

    return result;
  }, [notes, activeTab, searchQuery]);

  const handleStartRename = (note: MockNote) => {
    setRenamingId(note.id);
    setRenameValue(note.title);
    setActiveMenuId(null);
  };

  const handleCommitRename = (id: string) => {
    if (renameValue.trim()) {
      onRenameNote(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <aside
      className={`flex h-full flex-col border-r border-border bg-card/95 backdrop-blur-xs select-none ${className}`}
    >
      {/* Header & New Note */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-foreground uppercase">
              Investigation Notes
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              {notes.length}
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Close Notes Drawer"
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Create New Note Button */}
        <button
          type="button"
          onClick={onCreateNote}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-2xs hover:bg-primary/90 transition cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+ New Note Document</span>
        </button>

        {/* Search Bar */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, tags, cases…"
            className="w-full rounded-xl border border-border bg-input pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex-1 rounded-lg py-1 text-center font-medium transition cursor-pointer ${
              activeTab === "all"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pinned")}
            className={`flex-1 rounded-lg py-1 text-center font-medium transition cursor-pointer ${
              activeTab === "pinned"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pinned
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recent")}
            className={`flex-1 rounded-lg py-1 text-center font-medium transition cursor-pointer ${
              activeTab === "recent"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Recent
          </button>
        </div>

        {/* Match Counter */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
          <span>
            {searchQuery.trim()
              ? `${filteredNotes.length} ${filteredNotes.length === 1 ? "note" : "notes"} found`
              : `${filteredNotes.length} ${filteredNotes.length === 1 ? "note" : "notes"}`}
          </span>
          {activeTab !== "all" && (
            <span className="capitalize text-primary font-medium">{activeTab}</span>
          )}
        </div>
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 focus:outline-none scrollbar-thin">
        {filteredNotes.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <FolderLock className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-xs font-medium text-foreground">No notes found</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {searchQuery ? "Try a different search query" : "Click '+ New Note' to start writing"}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isSelected = note.id === selectedNoteId;
            const previewSnippet = note.body
              .replace(/^[#>\s-*]+/gm, "")
              .replace(/\[Evidence:[^\]]+\]/g, "Evidence")
              .replace(/`+/g, "")
              .trim()
              .slice(0, 90);

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`group relative rounded-xl border p-3 transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary/50 bg-primary/10 shadow-xs dark:bg-primary/15"
                    : "border-border/60 bg-card hover:border-border hover:bg-muted/40"
                }`}
              >
                {/* Top Row: Pin, Title, Actions Menu */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex-1 min-w-0">
                    {renamingId === note.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCommitRename(note.id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="w-full rounded border border-primary bg-input px-1.5 py-0.5 text-xs font-semibold text-foreground outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleCommitRename(note.id)}
                          className="rounded p-1 text-emerald-500 hover:bg-muted"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {note.pinned && (
                          <Pin className="h-3.5 w-3.5 shrink-0 text-cyan rotate-45" />
                        )}
                        <h3
                          className={`truncate text-xs font-bold ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {note.title || "Untitled Note"}
                        </h3>
                      </div>
                    )}
                  </div>

                  {/* 3-dot dropdown menu */}
                  <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === note.id ? null : note.id)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                      aria-label="Note options"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>

                    {activeMenuId === note.id && (
                      <div className="absolute right-0 top-6 z-30 w-36 rounded-xl border border-border bg-card p-1 shadow-lg animate-in fade-in zoom-in-95">
                        <button
                          type="button"
                          onClick={() => {
                            onTogglePin(note.id);
                            setActiveMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition cursor-pointer"
                        >
                          {note.pinned ? (
                            <>
                              <PinOff className="h-3.5 w-3.5 text-muted-foreground" />
                              Unpin note
                            </>
                          ) : (
                            <>
                              <Pin className="h-3.5 w-3.5 text-cyan" />
                              Pin note
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartRename(note)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDuplicateNote(note.id);
                            setActiveMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          Duplicate
                        </button>
                        <div className="my-1 border-t border-border" />
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete note "${note.title}"?`)) {
                              onDeleteNote(note.id);
                            }
                            setActiveMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Snippet Preview */}
                <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-relaxed">
                  {previewSnippet || "Empty note content..."}
                </p>

                {/* Footer: Date + Tags / Case */}
                <div className="mt-2.5 flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
                  <span className="font-mono text-cyan">{note.caseNumber}</span>
                  <span className="shrink-0">{note.updatedAt}</span>
                </div>

                {/* Tags preview */}
                {note.tags && note.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-muted text-muted-foreground"
                      >
                        <Tag className="h-2 w-2 opacity-60" />
                        {t}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{note.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
