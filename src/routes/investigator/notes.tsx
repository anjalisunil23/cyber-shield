import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  addNoteItem,
  deleteNoteItem,
  duplicateNoteItem,
  togglePinNote,
  updateNoteItem,
  useNotesList,
} from "@/data/mock/platformState";
import { NoteSidebar } from "@/components/notes/NoteSidebar";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NoteDetailsPanel } from "@/components/notes/NoteDetailsPanel";
import type { MockNote } from "@/data/mock/platform";

export const Route = createFileRoute("/investigator/notes")({
  component: InvestigatorNotesPage,
});

function InvestigatorNotesPage() {
  const notes = useNotesList();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Drawer States for Slide-Out Panels
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  // Automatically select first note if none selected or if selected note was deleted
  useEffect(() => {
    if (notes.length > 0) {
      if (!selectedNoteId || !notes.some((n) => n.id === selectedNoteId)) {
        setSelectedNoteId(notes[0].id);
      }
    } else {
      setSelectedNoteId(null);
    }
  }, [notes, selectedNoteId]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  const handleCreateNote = useCallback(() => {
    const newNote = addNoteItem({
      title: "Untitled Investigation Note",
      body: "## Initial Triage\n\n**Observation**\nLanding page mirrors legitimate banking portal.\n\n**Findings**\nThe SSL certificate does not match the expected banking domain.\n\n**Next Steps**\n- [ ] Verify domain ownership\n- [ ] Review DNS history\n- [ ] Preserve certificate information\n",
      caseNumber: selectedNote?.caseNumber || "CS-2026-0142",
      tags: ["investigation"],
    });
    setSelectedNoteId(newNote.id);
    setIsNotesDrawerOpen(false);
    toast.success("New investigation document created");
  }, [selectedNote]);

  const handleSaveNote = useCallback((noteId: string, updates: Partial<MockNote>) => {
    updateNoteItem(noteId, updates);
  }, []);

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      deleteNoteItem(noteId);
      toast.success("Document deleted");
      const remaining = notes.filter((n) => n.id !== noteId);
      if (remaining.length > 0) {
        setSelectedNoteId(remaining[0].id);
      } else {
        setSelectedNoteId(null);
      }
    },
    [notes]
  );

  const handleDuplicateNote = useCallback((noteId: string) => {
    const copy = duplicateNoteItem(noteId);
    if (copy) {
      setSelectedNoteId(copy.id);
      setIsNotesDrawerOpen(false);
      toast.success("Document duplicated");
    }
  }, []);

  const handleTogglePin = useCallback((noteId: string) => {
    togglePinNote(noteId);
  }, []);

  const handleRenameNote = useCallback((noteId: string, newTitle: string) => {
    updateNoteItem(noteId, { title: newTitle });
    toast.success("Document renamed");
  }, []);

  const handleInsertEvidence = useCallback(
    (evidenceRef: string) => {
      if (!selectedNote) return;
      const refTag = `\n[Evidence: ${evidenceRef}]\n`;
      updateNoteItem(selectedNote.id, {
        body: selectedNote.body ? `${selectedNote.body}\n${refTag}` : refTag,
      });
      toast.success(`Inserted evidence reference: ${evidenceRef}`);
    },
    [selectedNote]
  );

  const handleInsertAttachment = useCallback(
    (attachmentMarkdown: string) => {
      if (!selectedNote) return;
      updateNoteItem(selectedNote.id, {
        body: selectedNote.body ? `${selectedNote.body}\n${attachmentMarkdown}` : attachmentMarkdown,
      });
      toast.success("Attachment linked in document");
    },
    [selectedNote]
  );

  // Global keyboard shortcuts (Ctrl+Alt+N for new note)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleCreateNote();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleCreateNote]);

  return (
    <div className="relative flex h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Primary Investigation Document Editor Canvas */}
      <NoteEditor
        note={selectedNote}
        onSave={handleSaveNote}
        onEvidenceClick={(ref) => {
          toast.info(`Evidence reference: ${ref}`);
        }}
        onOpenNotesDrawer={() => setIsNotesDrawerOpen(true)}
        onOpenDetailsDrawer={() => setIsDetailsDrawerOpen(true)}
        className="h-full"
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Slide-Out Notes Navigation Drawer                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isNotesDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative flex w-full max-w-sm flex-1 flex-col bg-card shadow-2xl border-r border-border animate-in slide-in-from-left duration-200">
            <NoteSidebar
              notes={notes}
              selectedNoteId={selectedNoteId}
              onSelectNote={(id) => {
                setSelectedNoteId(id);
                setIsNotesDrawerOpen(false);
              }}
              onCreateNote={handleCreateNote}
              onTogglePin={handleTogglePin}
              onDuplicateNote={handleDuplicateNote}
              onDeleteNote={handleDeleteNote}
              onRenameNote={handleRenameNote}
              onClose={() => setIsNotesDrawerOpen(false)}
              className="h-full border-r-0"
            />
          </div>
          {/* Backdrop Click */}
          <div className="flex-1" onClick={() => setIsNotesDrawerOpen(false)} />
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Slide-Out Note Details / Metadata Drawer                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isDetailsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
          {/* Backdrop Click */}
          <div className="flex-1" onClick={() => setIsDetailsDrawerOpen(false)} />
          <div className="relative flex w-full max-w-sm flex-col bg-card shadow-2xl border-l border-border animate-in slide-in-from-right duration-200">
            <NoteDetailsPanel
              note={selectedNote}
              onUpdateNote={(updates) => {
                if (selectedNote) {
                  handleSaveNote(selectedNote.id, updates);
                }
              }}
              onInsertEvidence={handleInsertEvidence}
              onInsertAttachment={handleInsertAttachment}
              onClose={() => setIsDetailsDrawerOpen(false)}
              className="h-full border-l-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
