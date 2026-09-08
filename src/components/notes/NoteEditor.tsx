import { useEffect, useRef, useState, useCallback } from "react";
import {
  BookOpen,
  Copy,
  Download,
  Eye,
  FileCode,
  FileDown,
  FileText,
  FolderOpen,
  ImageIcon,
  Info,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Paperclip,
  Printer,
  Save,
  Search,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { MockNote, NoteAttachment } from "@/data/mock/platform";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  markdownToHtml,
  htmlToMarkdown,
  exportAsWordDoc,
  exportAsMarkdownFile,
  exportAsPdfDocument,
  printNoteDocument,
} from "./editorUtils";
import { WordRibbon, type RibbonTab, type ActiveFormats } from "./WordRibbon";

interface NoteEditorProps {
  note: MockNote | null;
  onSave: (noteId: string, updates: Partial<MockNote>) => void;
  onEvidenceClick?: (ref: string) => void;
  onOpenNotesDrawer?: () => void;
  onOpenDetailsDrawer?: () => void;
  className?: string;
}

type EditorMode = "visual" | "markdown" | "preview";
type SaveStatus = "saved" | "saving" | "unsaved";

const DEFAULT_FORMATS: ActiveFormats = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  ul: false,
  ol: false,
  alignLeft: true,
  alignCenter: false,
  alignRight: false,
  heading: null,
  blockquote: false,
  code: false,
};

// Forensic Preset SVGs for sample images
const FORENSIC_IMAGE_PRESETS = [
  {
    name: "Phishing Redirect Flow",
    caption: "Attacker C2 domain redirect telemetry graph",
    dataUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='200' viewBox='0 0 600 200' fill='%230f172a'><rect width='600' height='200' rx='12' fill='%230b1220' stroke='%230284c7' stroke-width='2'/><text x='30' y='40' fill='%2338bdf8' font-family='monospace' font-size='14' font-weight='bold'>[FORENSIC CAPTURE] Network Traffic Flow</text><rect x='40' y='70' width='140' height='60' rx='8' fill='%231e293b' stroke='%2338bdf8'/><text x='55' y='105' fill='%23e2e8f0' font-family='sans-serif' font-size='12'>Victim Client</text><path d='M190 100 L250 100' stroke='%23ef4444' stroke-width='2' stroke-dasharray='4'/><rect x='260' y='70' width='140' height='60' rx='8' fill='%233b0764' stroke='%23d946ef'/><text x='275' y='105' fill='%23f5d0fe' font-family='sans-serif' font-size='12'>Spoofed Gateway</text><path d='M410 100 L470 100' stroke='%23ef4444' stroke-width='2'/><rect x='480' y='70' width='100' height='60' rx='8' fill='%23450a0a' stroke='%23ef4444'/><text x='495' y='105' fill='%23fecaca' font-family='sans-serif' font-size='12'>C2 Exfil Server</text><text x='30' y='170' fill='%2394a3b8' font-family='monospace' font-size='11'>MD5: a8f4b234e6c71092 · Preserved in evidence locker</text></svg>",
  },
  {
    name: "Memory Hex Dump",
    caption: "Volatile memory string extraction at offset 0x004F2A",
    dataUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='200' viewBox='0 0 600 200' fill='%230b1220'><rect width='600' height='200' rx='12' fill='%23030712' stroke='%2322c55e' stroke-width='2'/><text x='30' y='35' fill='%234ade80' font-family='monospace' font-size='13' font-weight='bold'>VOLATILE MEMORY INSPECTION - 0x004F2000</text><text x='30' y='70' fill='%2394a3b8' font-family='monospace' font-size='11'>0x004F2000: 48 65 78 20 44 75 6d 70 20 54 65 73 74 20 30 31  | Hex Dump Test 01 |</text><text x='30' y='95' fill='%2394a3b8' font-family='monospace' font-size='11'>0x004F2010: 61 70 69 2d 76 61 75 6c 74 2d 73 79 6e 63 2e 6e  | api-vault-sync.n |</text><text x='30' y='120' fill='%23f87171' font-family='monospace' font-size='11'>0x004F2020: 65 74 2f 63 6f 6c 6c 65 63 74 20 50 4f 53 54 20  | et/collect POST  |</text><text x='30' y='145' fill='%2394a3b8' font-family='monospace' font-size='11'>0x004F2030: 75 73 65 72 3d 61 64 6d 69 6e 26 70 61 73 73 3d  | user=admin&amp;pass= |</text><text x='30' y='175' fill='%234ade80' font-family='monospace' font-size='11'>[+] Cleartext credential harvest signature confirmed</text></svg>",
  },
];

export function NoteEditor({
  note,
  onSave,
  onEvidenceClick,
  onOpenNotesDrawer,
  onOpenDetailsDrawer,
  className = "",
}: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [mode, setMode] = useState<EditorMode>("visual");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(DEFAULT_FORMATS);

  // Word Ribbon & View State
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>("home");
  const [zoom, setZoom] = useState<number>(100);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Dialog & Menu States
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkText, setLinkText] = useState("");
  const savedSelectionRangeRef = useRef<Range | null>(null);

  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageTab, setImageTab] = useState<"upload" | "url" | "presets">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const documentFileInputRef = useRef<HTMLInputElement | null>(null);

  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Refs
  const editorRef = useRef<HTMLDivElement | null>(null);
  const rawTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const currentNoteIdRef = useRef<string | null>(null);
  const isTypingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Undo/Redo history stack
  const historyRef = useRef<{ title: string; body: string }[]>([]);
  const historyIdxRef = useRef<number>(-1);

  // Word & Character count calculations
  const cleanBody = bodyMarkdown.trim();
  const wordCount = cleanBody ? cleanBody.split(/\s+/).filter(Boolean).length : 0;
  const charCount = bodyMarkdown.length;
  const lineCount = bodyMarkdown ? bodyMarkdown.split("\n").length : 1;

  // Format state inspection
  const updateToolbarStates = useCallback(() => {
    if (typeof window === "undefined") return;
    const selection = window.getSelection();
    if (
      !selection ||
      !editorRef.current ||
      !editorRef.current.contains(selection.anchorNode)
    ) {
      return;
    }

    try {
      const isBold = document.queryCommandState("bold");
      const isItalic = document.queryCommandState("italic");
      const isUnderline = document.queryCommandState("underline");
      const isStrike = document.queryCommandState("strikeThrough");
      const isUl = document.queryCommandState("insertUnorderedList");
      const isOl = document.queryCommandState("insertOrderedList");
      const isJustifyLeft = document.queryCommandState("justifyLeft");
      const isJustifyCenter = document.queryCommandState("justifyCenter");
      const isJustifyRight = document.queryCommandState("justifyRight");

      let node: Node | null = selection.anchorNode;
      let currentHeading: "h1" | "h2" | "h3" | null = null;
      let isBlockquote = false;
      let isCode = false;

      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = (node as HTMLElement).tagName.toLowerCase();
          if (tag === "h1") currentHeading = "h1";
          if (tag === "h2") currentHeading = "h2";
          if (tag === "h3") currentHeading = "h3";
          if (tag === "blockquote") isBlockquote = true;
          if (tag === "code" || tag === "pre") isCode = true;
        }
        node = node.parentNode;
      }

      setActiveFormats({
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
        strike: isStrike,
        ul: isUl,
        ol: isOl,
        alignLeft: isJustifyLeft,
        alignCenter: isJustifyCenter,
        alignRight: isJustifyRight,
        heading: currentHeading,
        blockquote: isBlockquote,
        code: isCode,
      });
    } catch {
      // Ignore queryCommandState edge case errors
    }
  }, []);

  // Sync state when active note changes
  useEffect(() => {
    if (note && note.id !== currentNoteIdRef.current) {
      currentNoteIdRef.current = note.id;
      setTitle(note.title);
      setBodyMarkdown(note.body);
      setSaveStatus("saved");
      historyRef.current = [{ title: note.title, body: note.body }];
      historyIdxRef.current = 0;

      // Populate Visual ContentEditable Canvas
      if (editorRef.current) {
        editorRef.current.innerHTML = markdownToHtml(note.body);
      }
    }
  }, [note]);

  // Push to history
  const pushHistory = useCallback((newTitle: string, newBody: string) => {
    const nextHistory = historyRef.current.slice(0, historyIdxRef.current + 1);
    nextHistory.push({ title: newTitle, body: newBody });
    if (nextHistory.length > 50) nextHistory.shift();
    historyRef.current = nextHistory;
    historyIdxRef.current = nextHistory.length - 1;
  }, []);

  // Trigger Debounced Save
  const triggerDebouncedSave = useCallback(
    (newTitle: string, newBody: string) => {
      if (!note) return;
      setSaveStatus("unsaved");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus("saving");
        onSave(note.id, { title: newTitle, body: newBody });
        setTimeout(() => setSaveStatus("saved"), 400);
      }, 800);
    },
    [note, onSave]
  );

  // Handle Visual Editor Input
  const handleEditorInput = useCallback(() => {
    if (!editorRef.current) return;
    isTypingRef.current = true;
    const html = editorRef.current.innerHTML;
    const markdown = htmlToMarkdown(html);
    setBodyMarkdown(markdown);
    pushHistory(title, markdown);
    triggerDebouncedSave(title, markdown);
    updateToolbarStates();
    setTimeout(() => {
      isTypingRef.current = false;
    }, 100);
  }, [title, pushHistory, triggerDebouncedSave, updateToolbarStates]);

  // Handle Manual Save
  const handleManualSave = useCallback(() => {
    if (!note) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus("saving");
    let currentBody = bodyMarkdown;
    if (mode === "visual" && editorRef.current) {
      currentBody = htmlToMarkdown(editorRef.current.innerHTML);
      setBodyMarkdown(currentBody);
    }
    onSave(note.id, { title, body: currentBody });
    setTimeout(() => {
      setSaveStatus("saved");
      toast.success("Document saved successfully");
    }, 300);
  }, [note, mode, title, bodyMarkdown, onSave]);

  // Handle Export PDF
  const handleExportPdf = useCallback(() => {
    if (!note) return;
    const bodyHtml =
      mode === "visual" && editorRef.current
        ? editorRef.current.innerHTML
        : markdownToHtml(bodyMarkdown);
    exportAsPdfDocument(title, bodyHtml, {
      author: note.author,
      caseNumber: note.caseNumber,
      date: note.updatedAt,
      tags: note.tags,
    });
    toast.success("Generated PDF document");
  }, [note, mode, title, bodyMarkdown]);

  // History Undo
  const handleUndo = () => {
    if (historyIdxRef.current > 0) {
      historyIdxRef.current -= 1;
      const prev = historyRef.current[historyIdxRef.current];
      setTitle(prev.title);
      setBodyMarkdown(prev.body);
      if (editorRef.current && mode === "visual") {
        editorRef.current.innerHTML = markdownToHtml(prev.body);
      }
      if (note) onSave(note.id, { title: prev.title, body: prev.body });
    }
  };

  // History Redo
  const handleRedo = () => {
    if (historyIdxRef.current < historyRef.current.length - 1) {
      historyIdxRef.current += 1;
      const next = historyRef.current[historyIdxRef.current];
      setTitle(next.title);
      setBodyMarkdown(next.body);
      if (editorRef.current && mode === "visual") {
        editorRef.current.innerHTML = markdownToHtml(next.body);
      }
      if (note) onSave(note.id, { title: next.title, body: next.body });
    }
  };

  // Execute standard rich text command
  const execFormat = (cmd: string, val: string = "") => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, val);
    handleEditorInput();
  };

  // Toggle Heading (H1, H2, H3)
  const toggleHeading = (level: "h1" | "h2" | "h3") => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.focus();
    if (activeFormats.heading === level) {
      document.execCommand("formatBlock", false, "<p>");
    } else {
      document.execCommand("formatBlock", false, `<${level}>`);
    }
    handleEditorInput();
  };

  // Toggle Blockquote
  const toggleBlockquote = () => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.focus();
    if (activeFormats.blockquote) {
      document.execCommand("formatBlock", false, "<p>");
    } else {
      document.execCommand("formatBlock", false, "<blockquote>");
    }
    handleEditorInput();
  };

  // Insert Interactive Task Checklist
  const insertChecklist = () => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.focus();
    const itemHtml =
      `<div class="notepad-checklist-item flex items-start gap-2.5 my-1.5 group select-text" data-checked="false">` +
      `<input type="checkbox" class="notepad-checkbox mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0" />` +
      `<span class="checklist-text flex-1 outline-none text-foreground/90">Task item...</span>` +
      `</div><p><br></p>`;
    document.execCommand("insertHTML", false, itemHtml);
    handleEditorInput();
  };

  // Insert Observation Callout
  const insertObservation = () => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.focus();
    const calloutHtml =
      `<div class="notepad-callout-observation my-3 flex items-start gap-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-950/20 p-3.5 shadow-xs text-foreground">` +
      `<span contenteditable="false" class="select-none rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-cyan shrink-0">OBSERVATION</span>` +
      `<div class="callout-body flex-1 outline-none leading-relaxed text-sm text-foreground/95">State key technical observation here...</div>` +
      `</div><p><br></p>`;
    document.execCommand("insertHTML", false, calloutHtml);
    handleEditorInput();
  };

  // Insert Finding Callout
  const insertFinding = () => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.focus();
    const calloutHtml =
      `<div class="notepad-callout-finding my-3 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-3.5 shadow-xs text-foreground">` +
      `<span contenteditable="false" class="select-none rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 shrink-0">FINDING</span>` +
      `<div class="callout-body flex-1 outline-none leading-relaxed text-sm text-foreground/95">State forensic finding description here...</div>` +
      `</div><p><br></p>`;
    document.execCommand("insertHTML", false, calloutHtml);
    handleEditorInput();
  };

  // Insert Inline Code
  const insertInlineCode = () => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    const text = selection?.toString() || "code";
    const codeHtml = `<code class="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-primary font-medium">${text}</code>&nbsp;`;
    document.execCommand("insertHTML", false, codeHtml);
    handleEditorInput();
  };

  // Insert Code Block
  const insertCodeBlock = () => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.focus();
    const preHtml =
      `<pre class="notepad-code-block my-3 p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-border/80"><code class="language-bash">// Insert forensic commands, network logs, or code here...</code></pre><p><br></p>`;
    document.execCommand("insertHTML", false, preHtml);
    handleEditorInput();
  };

  // Insert Table
  const insertTable = () => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.focus();
    const tableHtml =
      `<table class="my-4 w-full border-collapse border border-border text-xs rounded-lg overflow-hidden">` +
      `<thead><tr class="bg-muted/60 text-foreground font-semibold">` +
      `<th class="border border-border p-2 text-left">Artifact Item</th>` +
      `<th class="border border-border p-2 text-left">Hash / Value</th>` +
      `<th class="border border-border p-2 text-left">Status</th>` +
      `</tr></thead><tbody>` +
      `<tr><td class="border border-border p-2">Malicious Payload</td><td class="border border-border p-2 font-mono">e4d909c290d0fb1ca068ffaddf22cbd0</td><td class="border border-border p-2 text-rose-500 font-semibold">Flagged</td></tr>` +
      `<tr><td class="border border-border p-2">C2 Domain</td><td class="border border-border p-2 font-mono">auth-service-login.net</td><td class="border border-border p-2 text-amber-500 font-semibold">Blocked</td></tr>` +
      `</tbody></table><p><br></p>`;
    document.execCommand("insertHTML", false, tableHtml);
    handleEditorInput();
  };

  // Insert Page Break / Divider
  const insertDivider = () => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("insertHorizontalRule");
    handleEditorInput();
  };

  // Apply Font Family
  const applyFontFamily = (fontFamily: string) => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("fontName", false, fontFamily);
    handleEditorInput();
  };

  // Apply Font Size
  const applyFontSize = (fontSize: string) => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("fontSize", false, fontSize);
    handleEditorInput();
  };

  // Apply Highlight Color
  const applyHighlight = (color: string) => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.focus();
    if (color === "clear") {
      document.execCommand("hiliteColor", false, "transparent");
    } else {
      document.execCommand("hiliteColor", false, color);
    }
    handleEditorInput();
  };

  // Apply Text Color
  const applyTextColor = (color: string) => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("foreColor", false, color);
    handleEditorInput();
  };

  // Image insertion
  const handleOpenImageDialog = () => {
    if (mode !== "visual" || !editorRef.current) return;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRangeRef.current = selection.getRangeAt(0);
    }
    setShowImageDialog(true);
  };

  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!imageCaption) {
      setImageCaption(file.name.replace(/\.[^/.]+$/, ""));
    }

    const reader = new FileReader();
    reader.onload = (loadEv) => {
      const dataUrl = loadEv.target?.result as string;
      setUploadedImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleInsertImage = (src: string, alt: string) => {
    if (!editorRef.current || !src) return;
    editorRef.current.focus();
    if (savedSelectionRangeRef.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedSelectionRangeRef.current);
    }

    const cleanAlt = alt || "Investigation Image";
    const imageHtml =
      `<figure class="notepad-image-card my-3 inline-block max-w-full" contenteditable="false">` +
      `<img src="${src}" alt="${cleanAlt}" class="rounded-xl border border-border shadow-xs max-h-96 object-contain" />` +
      (cleanAlt
        ? `<figcaption class="mt-1 text-center text-xs text-muted-foreground italic">${cleanAlt}</figcaption>`
        : "") +
      `</figure><p><br></p>`;

    document.execCommand("insertHTML", false, imageHtml);
    setShowImageDialog(false);
    setUploadedImagePreview(null);
    setImageUrl("");
    setImageCaption("");
    handleEditorInput();
    toast.success("Image inserted into document");
  };

  // Document attachment upload
  const handleToolbarDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !note) return;

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
      newAttachments.push(newAtt);

      // Insert attachment chip into current document position
      if (mode === "visual" && editorRef.current) {
        editorRef.current.focus();
        const chipHtml = `<span contenteditable="false" class="attachment-chip inline-flex items-center gap-1.5 mx-1 px-2.5 py-1 rounded-lg font-medium text-xs border border-border bg-muted/80 text-foreground select-none hover:bg-muted" data-attachment="${file.name}" data-size="${sizeStr}"><span class="text-primary">📎</span><span>${file.name}</span><span class="text-[10px] text-muted-foreground font-mono">(${sizeStr})</span></span>&nbsp;`;
        document.execCommand("insertHTML", false, chipHtml);
        handleEditorInput();
      }
    });

    onSave(note.id, { attachments: newAttachments });
    toast.success(`Attached ${files.length} document(s) to note`);

    if (documentFileInputRef.current) {
      documentFileInputRef.current.value = "";
    }
  };

  // Direct clipboard paste handling
  const handleCanvasPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (loadEv) => {
          const dataUrl = loadEv.target?.result as string;
          handleInsertImage(dataUrl, "Pasted Screenshot");
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  // Link dialog
  const handleOpenLinkDialog = () => {
    if (mode !== "visual" || !editorRef.current) return;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRangeRef.current = selection.getRangeAt(0);
      setLinkText(selection.toString());
    }
    setShowLinkDialog(true);
  };

  const handleApplyLink = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    if (savedSelectionRangeRef.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedSelectionRangeRef.current);
    }
    const label = linkText.trim() || linkUrl;
    const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:text-primary/80 font-medium">${label}</a>&nbsp;`;
    document.execCommand("insertHTML", false, linkHtml);
    setShowLinkDialog(false);
    setLinkUrl("https://");
    setLinkText("");
    handleEditorInput();
  };

  // Interactive Checkbox click handling in canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    if (
      target.tagName.toLowerCase() === "input" &&
      (target as HTMLInputElement).type === "checkbox"
    ) {
      const checkbox = target as HTMLInputElement;
      const parentItem = checkbox.closest(".notepad-checklist-item");
      if (parentItem) {
        parentItem.setAttribute("data-checked", checkbox.checked ? "true" : "false");
        const textSpan = parentItem.querySelector(".checklist-text");
        if (textSpan) {
          if (checkbox.checked) {
            textSpan.classList.add("line-through", "text-muted-foreground", "opacity-70");
          } else {
            textSpan.classList.remove("line-through", "text-muted-foreground", "opacity-70");
          }
        }
        handleEditorInput();
      }
    }

    const evidenceChip = target.closest(".evidence-chip");
    if (evidenceChip) {
      const ref = evidenceChip.getAttribute("data-evidence") || evidenceChip.textContent || "";
      if (ref && onEvidenceClick) {
        onEvidenceClick(ref.replace(/^[🔍📎\s]+/, ""));
      }
    }
  };

  // Switch Editor Mode
  const handleSwitchMode = (newMode: EditorMode) => {
    if (newMode === mode) return;

    if (mode === "visual" && editorRef.current) {
      const currentMd = htmlToMarkdown(editorRef.current.innerHTML);
      setBodyMarkdown(currentMd);
    } else if (mode === "markdown" && rawTextareaRef.current) {
      setBodyMarkdown(rawTextareaRef.current.value);
    }

    setMode(newMode);

    if (newMode === "visual") {
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = markdownToHtml(bodyMarkdown);
        }
      }, 0);
    }
  };

  // Keyboard Shortcuts
  const handleCanvasKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (modifier && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleManualSave();
      return;
    }
    if (modifier && e.key.toLowerCase() === "p") {
      e.preventDefault();
      handleExportPdf();
      return;
    }
    if (modifier && e.key.toLowerCase() === "k") {
      e.preventDefault();
      handleOpenLinkDialog();
      return;
    }
    if (e.key === "Escape" && isFocusMode) {
      setIsFocusMode(false);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        document.execCommand("outdent");
      } else {
        document.execCommand("indent");
      }
      handleEditorInput();
      return;
    }
  };

  // Global keydown for Escape in Focus Mode
  useEffect(() => {
    const handleGlobalEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener("keydown", handleGlobalEsc);
    return () => window.removeEventListener("keydown", handleGlobalEsc);
  }, [isFocusMode]);

  // Selection change listener for active formatting highlights
  useEffect(() => {
    const onSelectionChange = () => {
      if (mode === "visual") {
        updateToolbarStates();
      }
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [mode, updateToolbarStates]);

  if (!note) {
    return (
      <div
        className={`flex h-full flex-col items-center justify-center p-8 text-center bg-slate-100 dark:bg-[#020617] ${className}`}
      >
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-card border border-border mb-4 shadow-sm">
          <FileText className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-base font-bold text-foreground">No Document Open</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          Select an investigation record from the Notes navigation panel to open it in the document editor.
        </p>
        {onOpenNotesDrawer && (
          <button
            type="button"
            onClick={onOpenNotesDrawer}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition cursor-pointer"
          >
            <FolderOpen className="h-4 w-4" />
            <span>Open Notes Navigation</span>
          </button>
        )}
      </div>
    );
  }

  // Format subtitle info: Case · Author · Date
  const subtitleInfo = `${note.caseNumber || "CS-2026-0142"} · ${
    note.author || "Alex Mercer"
  } · Last edited ${note.updatedAt || "Sep 8, 2026"}`;

  return (
    <div
      className={`flex flex-col bg-slate-100 dark:bg-[#020617] text-foreground select-text relative transition-all ${
        isFocusMode
          ? "fixed inset-0 z-50 h-screen w-screen overflow-hidden"
          : `h-full overflow-hidden ${className}`
      }`}
    >
      {/* Hidden File Input for Document Attachments */}
      <input
        ref={documentFileInputRef}
        type="file"
        multiple
        onChange={handleToolbarDocumentUpload}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.csv,.json,.pcap,.cap,.e01,.raw,.png,.jpg,.jpeg,.zip"
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP DOCUMENT BAR                                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 shrink-0 gap-4 shadow-2xs z-20">
        {/* Left: Notes Drawer Toggle & Editable Document Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onOpenNotesDrawer && (
            <button
              type="button"
              onClick={onOpenNotesDrawer}
              title="Open Notes Navigation Panel"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer shrink-0"
            >
              <FolderOpen className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Notes</span>
            </button>
          )}

          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                pushHistory(e.target.value, bodyMarkdown);
                triggerDebouncedSave(e.target.value, bodyMarkdown);
              }}
              placeholder="Untitled Document"
              className="w-full bg-transparent text-base sm:text-lg font-bold tracking-tight text-foreground placeholder:text-muted-foreground/50 outline-none border-b border-transparent focus:border-primary/40 pb-0.5 transition truncate"
            />
            <p className="text-[11px] text-muted-foreground font-mono truncate hidden sm:block">
              {subtitleInfo}
            </p>
          </div>
        </div>

        {/* Right: Autosave Status, Save, PDF, Details, Focus, More Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Autosave Status Badge */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
            {saveStatus === "saved" && (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-2xs" />
                <span className="font-mono text-[11px] text-muted-foreground hidden md:inline">
                  Saved ✓
                </span>
              </>
            )}
            {saveStatus === "saving" && (
              <>
                <span className="h-2 w-2 rounded-full bg-cyan animate-ping" />
                <span className="font-mono text-[11px] text-cyan hidden md:inline">
                  Saving…
                </span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="font-mono text-[11px] text-amber-500 hidden md:inline">
                  Unsaved
                </span>
              </>
            )}
          </div>

          {/* Primary Save Button */}
          <button
            type="button"
            onClick={handleManualSave}
            title="Save Document (Ctrl+S)"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-primary/90 transition cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Direct PDF Download Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            title="Download / Print Document as PDF (Ctrl+P)"
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer shadow-2xs"
          >
            <FileDown className="h-3.5 w-3.5 text-rose-500" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Details Drawer Toggle */}
          {onOpenDetailsDrawer && (
            <button
              type="button"
              onClick={onOpenDetailsDrawer}
              title="Open Document Info / Details Drawer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer shadow-2xs"
            >
              <Info className="h-3.5 w-3.5 text-cyan" />
              <span className="hidden md:inline">Details</span>
            </button>
          )}

          {/* Focus Mode Button */}
          <button
            type="button"
            onClick={() => setIsFocusMode(!isFocusMode)}
            title={isFocusMode ? "Exit Focus Mode (Esc)" : "Distraction-Free Focus Mode"}
            className={`p-1.5 rounded-lg border transition cursor-pointer shadow-2xs ${
              isFocusMode
                ? "bg-primary text-white border-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* More Actions Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              title="More Actions"
              className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer shadow-2xs"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showMoreMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-border bg-card p-1.5 shadow-xl space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setShowMoreMenu(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleExportPdf();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-foreground hover:bg-rose-500/10 hover:text-rose-500 transition cursor-pointer"
                >
                  <FileDown className="h-4 w-4 text-rose-500" />
                  <span className="font-semibold">Export PDF Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportAsWordDoc(
                      title,
                      editorRef.current?.innerHTML || markdownToHtml(bodyMarkdown),
                      { author: note.author, caseNumber: note.caseNumber, date: note.updatedAt }
                    );
                    setShowMoreMenu(false);
                    toast.success("Exported Word Document (.doc)");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <FileDown className="h-4 w-4 text-primary" />
                  <span>Export Word Document (.doc)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportAsMarkdownFile(title, bodyMarkdown);
                    setShowMoreMenu(false);
                    toast.success("Exported Markdown (.md)");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <FileCode className="h-4 w-4 text-cyan" />
                  <span>Export Markdown (.md)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    printNoteDocument(title);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <Printer className="h-4 w-4 text-emerald-500" />
                  <span>Print Document</span>
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(bodyMarkdown);
                    setShowMoreMenu(false);
                    toast.success("Copied raw note text to clipboard");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Raw Content</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. WORD-STYLE RIBBON TOOLBAR                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <WordRibbon
        activeTab={ribbonTab}
        onTabChange={setRibbonTab}
        activeFormats={activeFormats}
        onExecFormat={execFormat}
        onToggleHeading={toggleHeading}
        onToggleBlockquote={toggleBlockquote}
        onInsertChecklist={insertChecklist}
        onInsertObservation={insertObservation}
        onInsertFinding={insertFinding}
        onInsertInlineCode={insertInlineCode}
        onInsertCodeBlock={insertCodeBlock}
        onInsertTable={insertTable}
        onInsertDivider={insertDivider}
        onOpenImageDialog={handleOpenImageDialog}
        onOpenAttachmentUpload={() => documentFileInputRef.current?.click()}
        onOpenLinkDialog={handleOpenLinkDialog}
        onApplyHighlight={applyHighlight}
        onApplyTextColor={applyTextColor}
        onApplyFontFamily={applyFontFamily}
        onApplyFontSize={applyFontSize}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearFormatting={() => execFormat("removeFormat")}
        zoom={zoom}
        onZoomChange={setZoom}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
        isMarkdownMode={mode === "markdown"}
        onToggleMarkdownMode={() => handleSwitchMode(mode === "markdown" ? "visual" : "markdown")}
        onOpenNotesDrawer={onOpenNotesDrawer || (() => {})}
        onOpenDetailsDrawer={onOpenDetailsDrawer || (() => {})}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        stats={{ chars: charCount, words: wordCount, lines: lineCount }}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. DOCUMENT CANVAS (CENTERED A4 PAPER SHEET)                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 flex justify-center bg-slate-100 dark:bg-[#020617] scrollbar-thin">
        <div
          style={{
            transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className="w-full max-w-[820px] shrink-0"
        >
          {/* A4 Realistic White Paper Sheet */}
          <div className="w-full min-h-[1050px] bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#1E293B] shadow-[0_4px_25px_rgba(15,23,42,0.08)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.6)] rounded-sm px-10 sm:px-16 md:px-20 py-12 sm:py-16 md:py-20 flex flex-col justify-between">
            {/* Document Internal Header */}
            <div className="mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] dark:text-[#F8FAFC]">
                {title || "Untitled Document"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Case: <strong className="text-slate-700 dark:text-slate-200 font-mono">{note.caseNumber || "CS-2026-0142"}</strong></span>
                <span>·</span>
                <span>Investigator: <strong className="text-slate-700 dark:text-slate-200">{note.author || "Alex Mercer"}</strong></span>
                <span>·</span>
                <span>Date: <strong className="text-slate-700 dark:text-slate-200">{note.updatedAt || "September 8, 2026"}</strong></span>
              </div>
            </div>

            {/* Document Body: WYSIWYG / Markdown Source / Preview */}
            <div className="flex-1 min-h-[700px]">
              {mode === "visual" && (
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  onKeyUp={updateToolbarStates}
                  onMouseUp={updateToolbarStates}
                  onKeyDown={handleCanvasKeyDown}
                  onClick={handleCanvasClick}
                  onPaste={handleCanvasPaste}
                  data-placeholder="Click anywhere here to begin typing investigation notes, technical findings, or inserting evidence..."
                  className="w-full min-h-[650px] outline-none font-sans text-sm sm:text-base leading-relaxed text-[#111827] dark:text-[#F8FAFC] selection:bg-primary/25 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 dark:empty:before:text-slate-500 empty:before:pointer-events-none"
                />
              )}

              {mode === "markdown" && (
                <textarea
                  ref={rawTextareaRef}
                  value={bodyMarkdown}
                  onChange={(e) => {
                    setBodyMarkdown(e.target.value);
                    pushHistory(title, e.target.value);
                    triggerDebouncedSave(title, e.target.value);
                  }}
                  onKeyDown={handleCanvasKeyDown}
                  placeholder="Type raw Markdown here…"
                  className="h-full min-h-[650px] w-full resize-none bg-transparent font-mono text-xs sm:text-sm leading-relaxed text-[#111827] dark:text-[#F8FAFC] placeholder:text-slate-400 outline-none border-none selection:bg-primary/25"
                />
              )}

              {mode === "preview" && (
                <div className="w-full">
                  <MarkdownRenderer
                    content={bodyMarkdown}
                    onEvidenceClick={onEvidenceClick}
                  />
                </div>
              )}
            </div>

            {/* Document Bottom Footer Line (A4 Page standard) */}
            <div className="mt-12 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 select-none">
              <span>CyberShield Digital Investigation Record</span>
              <span className="font-mono">Page 1 of 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. WORD-STYLE BOTTOM STATUS BAR                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-border bg-card px-4 py-1.5 text-[11px] text-muted-foreground select-none shrink-0 z-20">
        {/* Left: Page count, Char count, Word count */}
        <div className="flex items-center gap-3">
          <span className="font-medium text-foreground">Page 1 of 1</span>
          <span>·</span>
          <span>{charCount.toLocaleString()} characters</span>
          <span>·</span>
          <span>{wordCount.toLocaleString()} words</span>
        </div>

        {/* Center / Right: Language, Zoom slider, Saved Status */}
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">English (US)</span>
          <span>·</span>

          {/* Quick Zoom Bar */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom(Math.max(75, zoom - 10))}
              title="Zoom Out (−)"
              className="hover:text-foreground font-bold px-1"
            >
              −
            </button>
            <span className="font-mono text-[10px] min-w-[32px] text-center">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              title="Zoom In (+)"
              className="hover:text-foreground font-bold px-1"
            >
              +
            </button>
          </div>

          <span>·</span>

          {/* Saved Status badge */}
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {saveStatus === "saved" ? "Saved ✓" : saveStatus === "saving" ? "Saving…" : "Unsaved"}
          </span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Floating Exit Button for Focus Mode                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isFocusMode && (
        <button
          type="button"
          onClick={() => setIsFocusMode(false)}
          className="fixed top-3 right-4 z-50 flex items-center gap-1.5 rounded-full bg-slate-900/90 text-white px-3.5 py-1.5 text-xs font-semibold shadow-2xl hover:bg-slate-800 transition cursor-pointer border border-slate-700"
        >
          <X className="h-3.5 w-3.5" />
          <span>Exit Focus Mode (Esc)</span>
        </button>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. INSERT IMAGE DIALOG MODAL                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showImageDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-pink-500" />
                Insert Image into Document
              </h4>
              <button
                type="button"
                onClick={() => setShowImageDialog(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs: Upload / Web URL / Forensic Presets */}
            <div className="flex rounded-xl bg-muted/60 p-1 border border-border text-xs">
              <button
                type="button"
                onClick={() => setImageTab("upload")}
                className={`flex-1 rounded-lg py-1 font-semibold transition cursor-pointer ${
                  imageTab === "upload" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setImageTab("url")}
                className={`flex-1 rounded-lg py-1 font-semibold transition cursor-pointer ${
                  imageTab === "url" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Web URL
              </button>
              <button
                type="button"
                onClick={() => setImageTab("presets")}
                className={`flex-1 rounded-lg py-1 font-semibold transition cursor-pointer ${
                  imageTab === "presets" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Forensic Samples
              </button>
            </div>

            {/* Upload File Tab */}
            {imageTab === "upload" && (
              <div className="space-y-3">
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileSelected}
                  className="hidden"
                />
                <div
                  onClick={() => imageFileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center hover:bg-muted/30 transition cursor-pointer"
                >
                  {uploadedImagePreview ? (
                    <img
                      src={uploadedImagePreview}
                      alt="Preview"
                      className="max-h-36 rounded-lg object-contain border border-border shadow-xs"
                    />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground/60 mb-2" />
                      <p className="text-xs font-semibold text-foreground">Click to select image file</p>
                      <p className="text-[11px] text-muted-foreground">PNG, JPG, WEBP, GIF</p>
                    </>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Caption / Alt Text
                  </label>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="e.g. Malicious login page capture"
                    className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Web URL Tab */}
            {imageTab === "url" && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Image URL
                  </label>
                  <input
                    type="url"
                    autoFocus
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.example.com/screenshot.png"
                    className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Caption / Alt Text
                  </label>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="e.g. Forensic artifact capture"
                    className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Forensic Presets Tab */}
            {imageTab === "presets" && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {FORENSIC_IMAGE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertImage(preset.dataUrl, preset.caption)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 p-2.5 text-left hover:border-primary/50 hover:bg-muted/60 transition cursor-pointer"
                  >
                    <img
                      src={preset.dataUrl}
                      alt={preset.name}
                      className="h-12 w-20 rounded-md object-cover border border-border shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-xs">{preset.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{preset.caption}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowImageDialog(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              {imageTab !== "presets" && (
                <button
                  type="button"
                  onClick={() => {
                    const src = imageTab === "upload" ? uploadedImagePreview : imageUrl;
                    if (src) {
                      handleInsertImage(src, imageCaption);
                    } else {
                      toast.error("Please provide an image first");
                    }
                  }}
                  className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary/90 cursor-pointer shadow-xs"
                >
                  Insert Image
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. LINK DIALOG MODAL                                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                Insert Hyperlink
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkDialog(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Link Text / Label
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Investigation Report, VirusTotal"
                  className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Target URL
                </label>
                <input
                  type="url"
                  autoFocus
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkDialog(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyLink}
                className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary/90 cursor-pointer shadow-xs"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
