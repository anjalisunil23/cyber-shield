import { useState, useEffect } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  ChevronDown,
  Code,
  FileCode,
  FolderOpen,
  Highlighter,
  ImagePlus,
  Info,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  Paperclip,
  Plus,
  Quote,
  Redo,
  RemoveFormatting,
  Search,
  ShieldAlert,
  Sparkles,
  SplitSquareVertical,
  Strikethrough,
  Table,
  Type,
  Underline,
  Undo,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

export type RibbonTab = "home" | "insert" | "review" | "view";

export interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  ul: boolean;
  ol: boolean;
  alignLeft: boolean;
  alignCenter: boolean;
  alignRight: boolean;
  alignJustify?: boolean;
  heading: "h1" | "h2" | "h3" | null;
  blockquote: boolean;
  code: boolean;
  fontFamily?: string;
  fontSize?: string;
}

interface WordRibbonProps {
  activeTab: RibbonTab;
  onTabChange: (tab: RibbonTab) => void;
  activeFormats: ActiveFormats;
  onExecFormat: (cmd: string, val?: string) => void;
  onToggleHeading: (level: "h1" | "h2" | "h3") => void;
  onToggleBlockquote: () => void;
  onInsertChecklist: () => void;
  onInsertObservation: () => void;
  onInsertFinding: () => void;
  onInsertInlineCode: () => void;
  onInsertCodeBlock: () => void;
  onInsertTable: () => void;
  onInsertDivider: () => void;
  onOpenImageDialog: () => void;
  onOpenAttachmentUpload: () => void;
  onOpenLinkDialog: () => void;
  onApplyHighlight: (color: string) => void;
  onApplyTextColor: (color: string) => void;
  onApplyFontFamily: (font: string) => void;
  onApplyFontSize: (size: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearFormatting: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  isMarkdownMode: boolean;
  onToggleMarkdownMode: () => void;
  onOpenNotesDrawer: () => void;
  onOpenDetailsDrawer: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  stats: { chars: number; words: number; lines: number };
}

const FONT_FAMILIES = [
  { label: "Inter (Default)", value: "Inter, sans-serif" },
  { label: "Segoe UI", value: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  { label: "JetBrains Mono (Code)", value: "'JetBrains Mono', monospace" },
  { label: "Georgia (Serif)", value: "Georgia, serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
];

const FONT_SIZES = [
  { label: "12 pt", value: "2" },
  { label: "14 pt", value: "3" },
  { label: "16 pt", value: "4" },
  { label: "18 pt", value: "5" },
  { label: "24 pt", value: "6" },
];

const HIGHLIGHT_COLORS = [
  { name: "Yellow", color: "#fef08a" },
  { name: "Cyan", color: "#a5f3fc" },
  { name: "Green", color: "#bbf7d0" },
  { name: "Pink", color: "#fbcfe8" },
  { name: "Amber", color: "#fed7aa" },
];

const TEXT_COLORS = [
  { name: "Default (Slate 900)", color: "#0f172a" },
  { name: "CyberShield Blue", color: "#2563eb" },
  { name: "Cyan Forensics", color: "#0284c7" },
  { name: "Incident Red", color: "#dc2626" },
  { name: "Warning Amber", color: "#d97706" },
  { name: "Mitigated Green", color: "#16a34a" },
  { name: "Purple Indicator", color: "#9333ea" },
];

const ZOOM_PRESETS = [75, 80, 90, 100, 110, 125, 150];

export function WordRibbon({
  activeTab,
  onTabChange,
  activeFormats,
  onExecFormat,
  onToggleHeading,
  onToggleBlockquote,
  onInsertChecklist,
  onInsertObservation,
  onInsertFinding,
  onInsertInlineCode,
  onInsertCodeBlock,
  onInsertTable,
  onInsertDivider,
  onOpenImageDialog,
  onOpenAttachmentUpload,
  onOpenLinkDialog,
  onApplyHighlight,
  onApplyTextColor,
  onApplyFontFamily,
  onApplyFontSize,
  onUndo,
  onRedo,
  onClearFormatting,
  zoom,
  onZoomChange,
  isFocusMode,
  onToggleFocusMode,
  isMarkdownMode,
  onToggleMarkdownMode,
  onOpenNotesDrawer,
  onOpenDetailsDrawer,
  searchQuery,
  onSearchChange,
  stats,
}: WordRibbonProps) {
  // Dropdown states
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showTextColorMenu, setShowTextColorMenu] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".ribbon-dropdown-container")) {
        setShowFontMenu(false);
        setShowSizeMenu(false);
        setShowHighlightMenu(false);
        setShowTextColorMenu(false);
        setShowZoomMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col border-b border-border bg-card/95 backdrop-blur-xs select-none shadow-xs shrink-0">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Ribbon Tab Headers: HOME | INSERT | REVIEW | VIEW            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 pt-1.5 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTabChange("home")}
            className={`px-3.5 py-1 text-xs font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
              activeTab === "home"
                ? "border-primary text-primary bg-card/80 rounded-t-md shadow-2xs"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-t-md"
            }`}
          >
            HOME
          </button>
          <button
            type="button"
            onClick={() => onTabChange("insert")}
            className={`px-3.5 py-1 text-xs font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
              activeTab === "insert"
                ? "border-primary text-primary bg-card/80 rounded-t-md shadow-2xs"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-t-md"
            }`}
          >
            INSERT
          </button>
          <button
            type="button"
            onClick={() => onTabChange("review")}
            className={`px-3.5 py-1 text-xs font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
              activeTab === "review"
                ? "border-primary text-primary bg-card/80 rounded-t-md shadow-2xs"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-t-md"
            }`}
          >
            REVIEW
          </button>
          <button
            type="button"
            onClick={() => onTabChange("view")}
            className={`px-3.5 py-1 text-xs font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
              activeTab === "view"
                ? "border-primary text-primary bg-card/80 rounded-t-md shadow-2xs"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-t-md"
            }`}
          >
            VIEW
          </button>
        </div>

        {/* Quick Drawer Shortcuts in Tab Bar */}
        <div className="flex items-center gap-1.5 pb-1">
          <button
            type="button"
            onClick={onOpenNotesDrawer}
            title="Open Notes Navigation Drawer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition cursor-pointer"
          >
            <FolderOpen className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Notes</span>
          </button>
          <button
            type="button"
            onClick={onOpenDetailsDrawer}
            title="Open Document Info / Metadata Panel"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition cursor-pointer"
          >
            <Info className="h-3.5 w-3.5 text-cyan" />
            <span className="hidden sm:inline">Details</span>
          </button>
          <button
            type="button"
            onClick={onToggleFocusMode}
            title={isFocusMode ? "Exit Focus Mode" : "Enter Distraction-Free Focus Mode"}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition border border-border/60 cursor-pointer ${
              isFocusMode
                ? "bg-primary text-white border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {isFocusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">Focus</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Ribbon Body Toolbar: Logically Grouped by Tab                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center overflow-x-auto px-3 py-1.5 text-xs min-h-[46px] gap-1.5 scrollbar-thin">
        {/* ========================================================= */}
        {/* TAB 1: HOME                                               */}
        {/* ========================================================= */}
        {activeTab === "home" && (
          <div className="flex items-center gap-2 min-w-max">
            {/* GROUP 1: CLIPBOARD / HISTORY */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onUndo}
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              >
                <Undo className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onRedo}
                title="Redo (Ctrl+Y)"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              >
                <Redo className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="h-5 w-px bg-border shrink-0" />

            {/* GROUP 2: FONT CONTROLS */}
            <div className="flex items-center gap-1 ribbon-dropdown-container">
              {/* Font Family Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFontMenu(!showFontMenu)}
                  title="Font Family"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-card text-foreground text-[11px] font-medium hover:bg-muted transition cursor-pointer"
                >
                  <span className="truncate max-w-[90px]">Inter</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {showFontMenu && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-card p-1 shadow-lg space-y-0.5 animate-in fade-in-50">
                    {FONT_FAMILIES.map((font) => (
                      <button
                        key={font.label}
                        type="button"
                        onClick={() => {
                          onApplyFontFamily(font.value);
                          setShowFontMenu(false);
                        }}
                        style={{ fontFamily: font.value }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-xs hover:bg-muted hover:text-primary transition cursor-pointer truncate"
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Font Size Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSizeMenu(!showSizeMenu)}
                  title="Font Size"
                  className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-card text-foreground text-[11px] font-medium hover:bg-muted transition cursor-pointer"
                >
                  <span>14</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {showSizeMenu && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-24 rounded-lg border border-border bg-card p-1 shadow-lg space-y-0.5 animate-in fade-in-50">
                    {FONT_SIZES.map((sz) => (
                      <button
                        key={sz.label}
                        type="button"
                        onClick={() => {
                          onApplyFontSize(sz.value);
                          setShowSizeMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-xs hover:bg-muted hover:text-primary transition cursor-pointer"
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Font Format Toggles: Bold, Italic, Underline, Strikethrough */}
              <button
                type="button"
                onClick={() => onExecFormat("bold")}
                title="Bold (Ctrl+B)"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  activeFormats.bold
                    ? "bg-primary/20 text-primary font-bold shadow-2xs border border-primary/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onExecFormat("italic")}
                title="Italic (Ctrl+I)"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  activeFormats.italic
                    ? "bg-primary/20 text-primary font-bold shadow-2xs border border-primary/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onExecFormat("underline")}
                title="Underline (Ctrl+U)"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  activeFormats.underline
                    ? "bg-primary/20 text-primary font-bold shadow-2xs border border-primary/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Underline className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onExecFormat("strikeThrough")}
                title="Strikethrough"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  activeFormats.strike
                    ? "bg-primary/20 text-primary font-bold shadow-2xs border border-primary/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Strikethrough className="h-3.5 w-3.5" />
              </button>

              {/* Text Color Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTextColorMenu(!showTextColorMenu)}
                  title="Font Text Color"
                  className="flex items-center gap-0.5 p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                >
                  <Type className="h-3.5 w-3.5 text-foreground font-bold" />
                  <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
                {showTextColorMenu && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-card p-1.5 shadow-lg space-y-1 animate-in fade-in-50">
                    <p className="text-[10px] font-bold text-muted-foreground px-1 uppercase">
                      Text Color
                    </p>
                    {TEXT_COLORS.map((tc) => (
                      <button
                        key={tc.name}
                        type="button"
                        onClick={() => {
                          onApplyTextColor(tc.color);
                          setShowTextColorMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-2 py-1 rounded-md text-xs text-foreground hover:bg-muted transition cursor-pointer text-left"
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-border shrink-0"
                          style={{ backgroundColor: tc.color }}
                        />
                        <span className="truncate">{tc.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Highlighter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowHighlightMenu(!showHighlightMenu)}
                  title="Text Highlight Color"
                  className="flex items-center gap-0.5 p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                >
                  <Highlighter className="h-3.5 w-3.5 text-amber-500" />
                  <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
                {showHighlightMenu && (
                  <div className="absolute left-0 top-full mt-1 z-50 rounded-lg border border-border bg-card p-2 shadow-lg flex items-center gap-1.5 animate-in fade-in-50">
                    {HIGHLIGHT_COLORS.map((hc) => (
                      <button
                        key={hc.name}
                        type="button"
                        onClick={() => {
                          onApplyHighlight(hc.color);
                          setShowHighlightMenu(false);
                        }}
                        title={`${hc.name} Highlight`}
                        className="h-5 w-5 rounded-full hover:scale-110 transition border border-border cursor-pointer shadow-2xs"
                        style={{ backgroundColor: hc.color }}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        onApplyHighlight("clear");
                        setShowHighlightMenu(false);
                      }}
                      title="Clear Highlight"
                      className="px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded border border-border cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Clear Formatting */}
              <button
                type="button"
                onClick={onClearFormatting}
                title="Clear Formatting"
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              >
                <RemoveFormatting className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="h-5 w-px bg-border shrink-0" />

            {/* GROUP 3: PARAGRAPH & ALIGNMENT */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onExecFormat("insertUnorderedList")}
                title="Bulleted List"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  activeFormats.ul
                    ? "bg-primary/20 text-primary font-bold shadow-2xs border border-primary/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onExecFormat("insertOrderedList")}
                title="Numbered List"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  activeFormats.ol
                    ? "bg-primary/20 text-primary font-bold shadow-2xs border border-primary/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onInsertChecklist}
                title="Interactive Checklist"
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              >
                <CheckSquare className="h-3.5 w-3.5 text-cyan" />
              </button>

              <div className="h-4 w-px bg-border/60 mx-1 shrink-0" />

              <button
                type="button"
                onClick={() => onExecFormat("outdent")}
                title="Decrease Indent"
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onExecFormat("indent")}
                title="Increase Indent"
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>

              <div className="h-4 w-px bg-border/60 mx-1 shrink-0" />

              <button
                type="button"
                onClick={() => onExecFormat("justifyLeft")}
                title="Align Left"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  activeFormats.alignLeft
                    ? "bg-primary/20 text-primary shadow-2xs border border-primary/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onExecFormat("justifyCenter")}
                title="Align Center"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  activeFormats.alignCenter
                    ? "bg-primary/20 text-primary shadow-2xs border border-primary/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onExecFormat("justifyRight")}
                title="Align Right"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  activeFormats.alignRight
                    ? "bg-primary/20 text-primary shadow-2xs border border-primary/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <AlignRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onExecFormat("justifyFull")}
                title="Justify"
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              >
                <AlignJustify className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="h-5 w-px bg-border shrink-0" />

            {/* GROUP 4: STYLES / HEADINGS */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onExecFormat("formatBlock", "<p>")}
                title="Normal Text Style"
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  activeFormats.heading === null
                    ? "bg-primary/20 text-primary border border-primary/30 shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => onToggleHeading("h1")}
                title="Heading 1"
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  activeFormats.heading === "h1"
                    ? "bg-primary/20 text-primary border border-primary/30 shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Heading 1
              </button>
              <button
                type="button"
                onClick={() => onToggleHeading("h2")}
                title="Heading 2"
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  activeFormats.heading === "h2"
                    ? "bg-primary/20 text-primary border border-primary/30 shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Heading 2
              </button>
              <button
                type="button"
                onClick={() => onToggleHeading("h3")}
                title="Heading 3"
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  activeFormats.heading === "h3"
                    ? "bg-primary/20 text-primary border border-primary/30 shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Heading 3
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: INSERT                                             */}
        {/* ========================================================= */}
        {activeTab === "insert" && (
          <div className="flex items-center gap-2 min-w-max">
            {/* Table */}
            <button
              type="button"
              onClick={onInsertTable}
              title="Insert Forensic Data Table"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-card text-foreground font-medium hover:bg-muted hover:text-primary transition cursor-pointer shadow-2xs"
            >
              <Table className="h-3.5 w-3.5 text-primary" />
              <span>Table</span>
            </button>

            {/* Image */}
            <button
              type="button"
              onClick={onOpenImageDialog}
              title="Insert Image (Upload, URL, or Forensic Samples)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-pink-500/30 bg-pink-500/10 text-pink-500 font-medium hover:bg-pink-500/20 transition cursor-pointer shadow-2xs"
            >
              <ImagePlus className="h-3.5 w-3.5 text-pink-500" />
              <span>Image</span>
            </button>

            {/* Link */}
            <button
              type="button"
              onClick={onOpenLinkDialog}
              title="Insert Hyperlink (Ctrl+K)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-card text-foreground font-medium hover:bg-muted hover:text-primary transition cursor-pointer shadow-2xs"
            >
              <LinkIcon className="h-3.5 w-3.5 text-primary" />
              <span>Link</span>
            </button>

            {/* Attachment */}
            <button
              type="button"
              onClick={onOpenAttachmentUpload}
              title="Attach Investigation File / Forensic Artifact"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-primary/30 bg-primary/10 text-primary font-medium hover:bg-primary/20 transition cursor-pointer shadow-2xs"
            >
              <Paperclip className="h-3.5 w-3.5 text-primary" />
              <span>Attachment</span>
            </button>

            <div className="h-5 w-px bg-border shrink-0" />

            {/* Forensic Blocks */}
            <button
              type="button"
              onClick={onInsertObservation}
              title="Insert Technical Observation Callout Block"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan font-semibold hover:bg-cyan-500/20 transition cursor-pointer shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan" />
              <span>Observation Block</span>
            </button>
            <button
              type="button"
              onClick={onInsertFinding}
              title="Insert Forensic Finding Callout Block"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold hover:bg-amber-500/20 transition cursor-pointer shadow-2xs"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Finding Block</span>
            </button>

            <div className="h-5 w-px bg-border shrink-0" />

            {/* Quotes, Code, Divider */}
            <button
              type="button"
              onClick={onToggleBlockquote}
              title="Insert Blockquote / Statement"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <Quote className="h-3.5 w-3.5" />
              <span>Quote</span>
            </button>
            <button
              type="button"
              onClick={onInsertInlineCode}
              title="Insert Inline Code Snippet"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <Code className="h-3.5 w-3.5 text-primary" />
              <span>Inline Code</span>
            </button>
            <button
              type="button"
              onClick={onInsertCodeBlock}
              title="Insert Code Block / Command Terminal"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <FileCode className="h-3.5 w-3.5 text-cyan" />
              <span>Code Block</span>
            </button>
            <button
              type="button"
              onClick={onInsertDivider}
              title="Insert Page Break / Divider Line"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <SplitSquareVertical className="h-3.5 w-3.5" />
              <span>Page Break</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: REVIEW                                             */}
        {/* ========================================================= */}
        {activeTab === "review" && (
          <div className="flex items-center gap-3 min-w-max">
            {/* Quick Word & Character Stats */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-md border border-border bg-muted/40 font-mono text-[11px] text-muted-foreground">
              <span>{stats.chars.toLocaleString()} chars</span>
              <span>·</span>
              <span className="font-semibold text-foreground">{stats.words.toLocaleString()} words</span>
              <span>·</span>
              <span>{stats.lines} lines</span>
            </div>

            <div className="h-5 w-px bg-border shrink-0" />

            {/* Find Search Input in Note */}
            <div className="flex items-center gap-1.5 relative">
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs shadow-2xs">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Find in document…"
                  className="bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-none w-36 text-[11px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="text-muted-foreground hover:text-foreground text-[10px] font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="h-5 w-px bg-border shrink-0" />

            {/* Open Details Panel */}
            <button
              type="button"
              onClick={onOpenDetailsDrawer}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-card text-foreground font-medium hover:bg-muted transition cursor-pointer shadow-2xs"
            >
              <Info className="h-3.5 w-3.5 text-cyan" />
              <span>Document Information</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: VIEW                                               */}
        {/* ========================================================= */}
        {activeTab === "view" && (
          <div className="flex items-center gap-3 min-w-max ribbon-dropdown-container">
            {/* Document Zoom Controls */}
            <div className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => onZoomChange(Math.max(75, zoom - 10))}
                title="Zoom Out (−)"
                className="p-1 text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowZoomMenu(!showZoomMenu)}
                  className="px-2 py-0.5 font-mono text-[11px] font-bold text-foreground hover:bg-muted rounded transition cursor-pointer flex items-center gap-1"
                >
                  <span>{zoom}%</span>
                  <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
                {showZoomMenu && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-20 rounded-lg border border-border bg-card p-1 shadow-lg space-y-0.5 animate-in fade-in-50">
                    {ZOOM_PRESETS.map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => {
                          onZoomChange(z);
                          setShowZoomMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                          zoom === z ? "bg-primary text-white font-bold" : "hover:bg-muted text-foreground"
                        }`}
                      >
                        {z}%
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onZoomChange(Math.min(150, zoom + 10))}
                title="Zoom In (+)"
                className="p-1 text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="h-5 w-px bg-border shrink-0" />

            {/* Focus Mode Toggle */}
            <button
              type="button"
              onClick={onToggleFocusMode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition cursor-pointer shadow-2xs ${
                isFocusMode
                  ? "bg-primary text-white border-primary font-bold"
                  : "bg-card border-border text-foreground hover:bg-muted font-medium"
              }`}
            >
              {isFocusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span>{isFocusMode ? "Exit Focus Mode" : "Focus Mode"}</span>
            </button>

            {/* Source Markdown Mode Toggle */}
            <button
              type="button"
              onClick={onToggleMarkdownMode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition cursor-pointer shadow-2xs ${
                isMarkdownMode
                  ? "bg-cyan-500/20 text-cyan border-cyan-500/40 font-bold"
                  : "bg-card border-border text-foreground hover:bg-muted font-medium"
              }`}
            >
              <FileCode className="h-3.5 w-3.5 text-cyan" />
              <span>{isMarkdownMode ? "Visual Document" : "Source (Markdown)"}</span>
            </button>

            <div className="h-5 w-px bg-border shrink-0" />

            {/* Show / Hide Drawers */}
            <button
              type="button"
              onClick={onOpenNotesDrawer}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <FolderOpen className="h-3.5 w-3.5 text-primary" />
              <span>Notes List</span>
            </button>
            <button
              type="button"
              onClick={onOpenDetailsDrawer}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <Info className="h-3.5 w-3.5 text-cyan" />
              <span>Doc Info</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
