import React, { useState } from "react";
import { Check, Copy, ExternalLink, FileSearch, Sparkles, ShieldAlert } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onToggleChecklist?: (lineIndex: number, checked: boolean) => void;
  onEvidenceClick?: (evidenceRef: string) => void;
}

export function MarkdownRenderer({
  content,
  className = "",
  onToggleChecklist,
  onEvidenceClick,
}: MarkdownRendererProps) {
  if (!content || !content.trim()) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground italic">
        No content to preview. Start writing in the editor.
      </div>
    );
  }

  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = "";
  let listItems: { text: string; isOrdered: boolean; order?: number }[] = [];
  let currentListType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listItems.length > 0 && currentListType) {
      if (currentListType === "ol") {
        renderedElements.push(
          <ol key={`ol-${renderedElements.length}`} className="my-2 ml-6 list-decimal space-y-1 text-sm text-foreground/90">
            {listItems.map((item, idx) => (
              <li key={idx}>{renderInlineMarkdown(item.text, onEvidenceClick)}</li>
            ))}
          </ol>
        );
      } else {
        renderedElements.push(
          <ul key={`ul-${renderedElements.length}`} className="my-2 ml-6 list-disc space-y-1 text-sm text-foreground/90">
            {listItems.map((item, idx) => (
              <li key={idx}>{renderInlineMarkdown(item.text, onEvidenceClick)}</li>
            ))}
          </ul>
        );
      }
      listItems = [];
      currentListType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith("```")) {
      flushList();
      if (inCodeBlock) {
        // Close code block
        const fullCode = codeBlockLines.join("\n");
        renderedElements.push(
          <CodeBlockItem key={`code-${i}`} code={fullCode} language={codeBlockLang} />
        );
        codeBlockLines = [];
        codeBlockLang = "";
        inCodeBlock = false;
      } else {
        // Open code block
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Check for Horizontal Rule
    if (/^(---|___|\*\*\*)$/.test(line.trim())) {
      flushList();
      renderedElements.push(
        <hr key={`hr-${i}`} className="my-5 border-t border-border" />
      );
      continue;
    }

    // Check for Markdown Images: `![Alt](url)`
    const imageMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushList();
      const alt = imageMatch[1];
      const src = imageMatch[2];
      renderedElements.push(
        <figure key={`img-${i}`} className="my-4 inline-block max-w-full">
          <img
            src={src}
            alt={alt}
            className="rounded-xl border border-border shadow-xs max-h-96 object-contain"
          />
          {alt && (
            <figcaption className="mt-1 text-center text-xs text-muted-foreground italic">
              {alt}
            </figcaption>
          )}
        </figure>
      );
      continue;
    }

    // Check for Headings
    if (line.startsWith("# ")) {
      flushList();
      renderedElements.push(
        <h1
          key={`h1-${i}`}
          className="mt-6 mb-3 text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-1.5"
        >
          {renderInlineMarkdown(line.slice(2), onEvidenceClick)}
        </h1>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      renderedElements.push(
        <h2
          key={`h2-${i}`}
          className="mt-5 mb-2.5 text-xl font-semibold tracking-tight text-foreground"
        >
          {renderInlineMarkdown(line.slice(3), onEvidenceClick)}
        </h2>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      renderedElements.push(
        <h3
          key={`h3-${i}`}
          className="mt-4 mb-2 text-base font-semibold tracking-tight text-foreground"
        >
          {renderInlineMarkdown(line.slice(4), onEvidenceClick)}
        </h3>
      );
      continue;
    }
    if (line.startsWith("#### ")) {
      flushList();
      renderedElements.push(
        <h4
          key={`h4-${i}`}
          className="mt-3 mb-1.5 text-sm font-semibold tracking-tight text-foreground"
        >
          {renderInlineMarkdown(line.slice(5), onEvidenceClick)}
        </h4>
      );
      continue;
    }

    // Check for Interactive Checklists: `- [ ] ` or `- [x] `
    const checklistMatch = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/);
    if (checklistMatch) {
      flushList();
      const isChecked = checklistMatch[2].toLowerCase() === "x";
      const text = checklistMatch[3];
      renderedElements.push(
        <div
          key={`check-${i}`}
          className="my-1.5 flex items-start gap-2.5 rounded-lg px-2 py-1 text-sm transition hover:bg-muted/40"
        >
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => onToggleChecklist?.(i, e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer transition"
          />
          <span
            className={`flex-1 text-foreground/90 ${
              isChecked ? "line-through text-muted-foreground" : ""
            }`}
          >
            {renderInlineMarkdown(text, onEvidenceClick)}
          </span>
        </div>
      );
      continue;
    }

    // Check for Bullet list: `- ` or `* `
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (currentListType !== "ul") flushList();
      currentListType = "ul";
      listItems.push({ text: bulletMatch[1], isOrdered: false });
      continue;
    }

    // Check for Numbered list: `1. `
    const orderedMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      if (currentListType !== "ol") flushList();
      currentListType = "ol";
      listItems.push({ text: orderedMatch[2], isOrdered: true, order: parseInt(orderedMatch[1], 10) });
      continue;
    }

    // Any non-list line flushes list buffer
    flushList();

    // Check for Blockquotes and Investigation Callouts
    if (line.startsWith(">")) {
      const quoteContent = line.replace(/^>\s?/, "");

      // OBSERVATION Callout
      if (quoteContent.includes("**OBSERVATION:**") || quoteContent.startsWith("[!OBSERVATION]")) {
        const cleanText = quoteContent
          .replace("[!OBSERVATION]", "")
          .replace("**OBSERVATION:**", "")
          .trim();
        renderedElements.push(
          <div
            key={`callout-obs-${i}`}
            className="my-3 flex gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 text-sm text-foreground shadow-xs dark:bg-cyan-950/20"
          >
            <Sparkles className="h-5 w-5 shrink-0 text-cyan mt-0.5" />
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-cyan mb-1">
                Investigation Observation
              </span>
              <div className="text-foreground/90 leading-relaxed">
                {renderInlineMarkdown(cleanText, onEvidenceClick)}
              </div>
            </div>
          </div>
        );
        continue;
      }

      // FINDING Callout
      if (quoteContent.includes("**FINDING:**") || quoteContent.startsWith("[!FINDING]")) {
        const cleanText = quoteContent
          .replace("[!FINDING]", "")
          .replace("**FINDING:**", "")
          .trim();
        renderedElements.push(
          <div
            key={`callout-find-${i}`}
            className="my-3 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm text-foreground shadow-xs dark:bg-amber-950/20"
          >
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" />
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                Forensic Finding
              </span>
              <div className="text-foreground/90 leading-relaxed">
                {renderInlineMarkdown(cleanText, onEvidenceClick)}
              </div>
            </div>
          </div>
        );
        continue;
      }

      // WARNING / CAUTION Callout
      if (quoteContent.includes("**WARNING:**") || quoteContent.startsWith("[!WARNING]")) {
        const cleanText = quoteContent
          .replace("[!WARNING]", "")
          .replace("**WARNING:**", "")
          .trim();
        renderedElements.push(
          <div
            key={`callout-warn-${i}`}
            className="my-3 flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-foreground shadow-xs dark:bg-rose-950/20"
          >
            <ShieldAlert className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-rose-500 mb-1">
                Warning / Critical Alert
              </span>
              <div className="text-foreground/90 leading-relaxed">
                {renderInlineMarkdown(cleanText, onEvidenceClick)}
              </div>
            </div>
          </div>
        );
        continue;
      }

      // Standard Blockquote
      renderedElements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-3 border-l-3 border-primary/60 bg-muted/30 px-4 py-2 text-sm italic text-muted-foreground rounded-r-lg"
        >
          {renderInlineMarkdown(quoteContent, onEvidenceClick)}
        </blockquote>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      renderedElements.push(<div key={`blank-${i}`} className="h-3" />);
      continue;
    }

    // Regular paragraph
    renderedElements.push(
      <p key={`p-${i}`} className="my-1.5 text-sm leading-relaxed text-foreground/90">
        {renderInlineMarkdown(line, onEvidenceClick)}
      </p>
    );
  }

  flushList();

  return (
    <div className={`investigation-markdown-preview space-y-1 font-sans ${className}`}>
      {renderedElements}
    </div>
  );
}

function CodeBlockItem({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-border bg-[#0b1220] text-slate-100 shadow-xs dark:bg-black/50">
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/40 px-3.5 py-1.5 text-xs text-muted-foreground">
        <span className="font-mono text-[11px] uppercase tracking-wider">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInlineMarkdown(
  text: string,
  onEvidenceClick?: (ref: string) => void
): React.ReactNode[] {
  if (!text) return [];

  const parts: React.ReactNode[] = [];
  const tokenRegex =
    /(\[Attachment:\s*([^\]]+?)(?:\s*\(([^)]+)\))?\]|\[Evidence:\s*([^\]]+)\]|#EV-\d{4}-\d+|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|<u>([^<]+)<\/u>|~~([^~]+)~~|\[([^\]]+)\]\(([^)]+)\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const fullMatch = match[0];

    // [Attachment: filename.pdf (1.2 MB)]
    if (fullMatch.startsWith("[Attachment:")) {
      const attName = match[2] || "Document";
      const attSize = match[3];
      parts.push(
        <span
          key={`att-${match.index}`}
          className="mx-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs"
        >
          <span className="text-primary">📎</span>
          <span>{attName}</span>
          {attSize && (
            <span className="font-mono text-[10px] text-muted-foreground">
              ({attSize})
            </span>
          )}
        </span>
      );
    }
    // [Evidence: filename]
    else if (fullMatch.startsWith("[Evidence:")) {
      const evidenceName = match[4] || "Evidence";
      parts.push(
        <button
          key={`ev-${match.index}`}
          type="button"
          onClick={() => onEvidenceClick?.(evidenceName)}
          className="mx-1 inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-cyan hover:bg-cyan-500/20 transition cursor-pointer"
        >
          <FileSearch className="h-3.5 w-3.5" />
          {evidenceName}
        </button>
      );
    }
    // #EV-2026-0041
    else if (fullMatch.startsWith("#EV-")) {
      parts.push(
        <button
          key={`ev-id-${match.index}`}
          type="button"
          onClick={() => onEvidenceClick?.(fullMatch)}
          className="mx-1 inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary hover:bg-primary/20 transition cursor-pointer"
        >
          <FileSearch className="h-3 w-3" />
          {fullMatch}
        </button>
      );
    }
    // Inline code: `code`
    else if (match[3] !== undefined) {
      parts.push(
        <code
          key={`code-${match.index}`}
          className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-primary font-medium"
        >
          {match[3]}
        </code>
      );
    }
    // Bold: **text**
    else if (match[4] !== undefined) {
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-foreground">
          {match[4]}
        </strong>
      );
    }
    // Italic: *text*
    else if (match[5] !== undefined) {
      parts.push(
        <em key={`italic-${match.index}`} className="italic text-foreground/90">
          {match[5]}
        </em>
      );
    }
    // Underline: <u>text</u>
    else if (match[6] !== undefined) {
      parts.push(
        <span key={`u-${match.index}`} className="underline underline-offset-2">
          {match[6]}
        </span>
      );
    }
    // Strikethrough: ~~text~~
    else if (match[7] !== undefined) {
      parts.push(
        <span key={`del-${match.index}`} className="line-through text-muted-foreground">
          {match[7]}
        </span>
      );
    }
    // Link: [title](url)
    else if (match[8] !== undefined && match[9] !== undefined) {
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[9]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2 hover:text-primary/80 transition"
        >
          {match[8]}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
