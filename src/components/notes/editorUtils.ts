/**
 * Utility functions for Rich WYSIWYG Document Notepad & Markdown Conversion
 */

export function markdownToHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) {
    return "<p><br></p>";
  }

  const lines = markdown.split("\n");
  const htmlParts: string[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = "";
  let listBuffer: string[] = [];
  let currentListType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listBuffer.length > 0 && currentListType) {
      const tag = currentListType;
      const itemsHtml = listBuffer
        .map((item) => `<li class="my-0.5">${formatInline(item)}</li>`)
        .join("");
      const listClass =
        tag === "ol"
          ? "list-decimal ml-6 my-2 space-y-0.5"
          : "list-disc ml-6 my-2 space-y-0.5";
      htmlParts.push(`<${tag} class="${listClass}">${itemsHtml}</${tag}>`);
      listBuffer = [];
      currentListType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code Block Toggle
    if (line.trim().startsWith("```")) {
      flushList();
      if (inCodeBlock) {
        const fullCode = codeBlockLines
          .join("\n")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        htmlParts.push(
          `<pre class="notepad-code-block my-3 p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-border/80"><code class="language-${codeBlockLang || "text"}">${fullCode}</code></pre>`
        );
        codeBlockLines = [];
        codeBlockLang = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Horizontal Rule
    if (/^(---|___|\*\*\*)$/.test(line.trim())) {
      flushList();
      htmlParts.push('<hr class="my-4 border-t border-border" />');
      continue;
    }

    // Markdown Image line: `![Alt](url)`
    const imageMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushList();
      const alt = imageMatch[1];
      const src = imageMatch[2];
      htmlParts.push(
        `<figure class="notepad-image-card my-3 inline-block max-w-full" contenteditable="false">` +
          `<img src="${src}" alt="${alt}" class="rounded-xl border border-border shadow-xs max-h-96 object-contain" />` +
          (alt
            ? `<figcaption class="mt-1 text-center text-xs text-muted-foreground italic">${alt}</figcaption>`
            : "") +
          `</figure>`
      );
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      flushList();
      htmlParts.push(
        `<h1 class="text-2xl font-bold tracking-tight text-foreground mt-4 mb-2 pb-1 border-b border-border/50">${formatInline(
          line.slice(2)
        )}</h1>`
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      htmlParts.push(
        `<h2 class="text-xl font-bold tracking-tight text-foreground mt-3.5 mb-1.5">${formatInline(
          line.slice(3)
        )}</h2>`
      );
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      htmlParts.push(
        `<h3 class="text-base font-semibold tracking-tight text-foreground mt-3 mb-1">${formatInline(
          line.slice(4)
        )}</h3>`
      );
      continue;
    }
    if (line.startsWith("#### ")) {
      flushList();
      htmlParts.push(
        `<h4 class="text-sm font-semibold tracking-tight text-foreground mt-2.5 mb-1">${formatInline(
          line.slice(5)
        )}</h4>`
      );
      continue;
    }

    // Checklists: `- [ ] ` or `- [x] `
    const checkMatch = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s*(.*)$/);
    if (checkMatch) {
      flushList();
      const isChecked = checkMatch[2].toLowerCase() === "x";
      const text = checkMatch[3];
      htmlParts.push(
        `<div class="notepad-checklist-item flex items-start gap-2.5 my-1.5 group select-text" data-checked="${isChecked}">` +
          `<input type="checkbox" ${isChecked ? "checked" : ""} class="notepad-checkbox mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0" />` +
          `<span class="checklist-text flex-1 outline-none text-foreground/90 ${
            isChecked ? "line-through text-muted-foreground opacity-70" : ""
          }">${formatInline(text)}</span>` +
          `</div>`
      );
      continue;
    }

    // Bullet List: `- ` or `* `
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (currentListType !== "ul") flushList();
      currentListType = "ul";
      listBuffer.push(bulletMatch[1]);
      continue;
    }

    // Numbered List: `1. `
    const numberMatch = line.match(/^\s*\d+\.\s+(.*)$/);
    if (numberMatch) {
      if (currentListType !== "ol") flushList();
      currentListType = "ol";
      listBuffer.push(numberMatch[1]);
      continue;
    }

    flushList();

    // Callouts & Blockquotes
    if (line.startsWith(">")) {
      const quoteText = line.replace(/^>\s?/, "");

      // OBSERVATION Callout
      if (
        quoteText.includes("**OBSERVATION:**") ||
        quoteText.startsWith("[!OBSERVATION]")
      ) {
        const clean = quoteText
          .replace("[!OBSERVATION]", "")
          .replace("**OBSERVATION:**", "")
          .trim();
        htmlParts.push(
          `<div class="notepad-callout-observation my-3 flex items-start gap-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-950/20 p-3.5 shadow-xs text-foreground">` +
            `<span contenteditable="false" class="select-none rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-cyan shrink-0">OBSERVATION</span>` +
            `<div class="callout-body flex-1 outline-none leading-relaxed text-sm text-foreground/95">${formatInline(
              clean
            )}</div>` +
            `</div>`
        );
        continue;
      }

      // FINDING Callout
      if (
        quoteText.includes("**FINDING:**") ||
        quoteText.startsWith("[!FINDING]")
      ) {
        const clean = quoteText
          .replace("[!FINDING]", "")
          .replace("**FINDING:**", "")
          .trim();
        htmlParts.push(
          `<div class="notepad-callout-finding my-3 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-3.5 shadow-xs text-foreground">` +
            `<span contenteditable="false" class="select-none rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 shrink-0">FINDING</span>` +
            `<div class="callout-body flex-1 outline-none leading-relaxed text-sm text-foreground/95">${formatInline(
              clean
            )}</div>` +
            `</div>`
        );
        continue;
      }

      // WARNING Callout
      if (
        quoteText.includes("**WARNING:**") ||
        quoteText.startsWith("[!WARNING]")
      ) {
        const clean = quoteText
          .replace("[!WARNING]", "")
          .replace("**WARNING:**", "")
          .trim();
        htmlParts.push(
          `<div class="notepad-callout-warning my-3 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/20 p-3.5 shadow-xs text-foreground">` +
            `<span contenteditable="false" class="select-none rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-rose-500 shrink-0">WARNING</span>` +
            `<div class="callout-body flex-1 outline-none leading-relaxed text-sm text-foreground/95">${formatInline(
              clean
            )}</div>` +
            `</div>`
        );
        continue;
      }

      // Standard Blockquote
      htmlParts.push(
        `<blockquote class="my-2.5 border-l-3 border-primary/60 bg-muted/30 px-3.5 py-1.5 text-sm italic text-muted-foreground rounded-r-lg">${formatInline(
          quoteText
        )}</blockquote>`
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      htmlParts.push("<p><br></p>");
      continue;
    }

    // Regular Paragraph
    htmlParts.push(
      `<p class="my-1.5 text-sm leading-relaxed text-foreground/90">${formatInline(
        line
      )}</p>`
    );
  }

  flushList();

  return htmlParts.join("");
}

/**
 * Formats inline Markdown expressions into HTML tags
 */
function formatInline(text: string): string {
  if (!text) return "";

  // Inline images: ![Alt](url)
  let out = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    return `<figure class="notepad-image-card my-2 inline-block max-w-full" contenteditable="false"><img src="${src}" alt="${alt}" class="rounded-xl border border-border shadow-xs max-h-96 object-contain" />${alt ? `<figcaption class="mt-1 text-center text-xs text-muted-foreground italic">${alt}</figcaption>` : ""}</figure>`;
  });

  // Attached Document Chips: [Attachment: filename.ext (size)] or [Attachment: filename.ext]
  out = out.replace(/\[Attachment:\s*([^\]]+?)(?:\s*\(([^)]+)\))?\]/g, (_, name, size) => {
    const sizeStr = size ? ` (${size})` : "";
    return `<span contenteditable="false" class="attachment-chip inline-flex items-center gap-1.5 mx-1 px-2.5 py-1 rounded-lg font-medium text-xs border border-border bg-muted/80 text-foreground select-none hover:bg-muted" data-attachment="${name}" data-size="${size || ""}"><span class="text-primary">📎</span><span>${name}</span>${size ? `<span class="text-[10px] text-muted-foreground font-mono">${sizeStr}</span>` : ""}</span>&nbsp;`;
  });

  // Replace Evidence Tags: [Evidence: filename.ext] or #EV-2026-XXXX
  out = out.replace(/\[Evidence:\s*([^\]]+)\]/g, (_, name) => {
    return `<span contenteditable="false" class="evidence-chip inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md font-mono text-xs font-semibold border border-cyan-500/30 bg-cyan-500/10 text-cyan select-none" data-evidence="${name}"><span class="opacity-70">🔍</span>${name}</span>`;
  });

  out = out.replace(/(#EV-\d{4}-\d+)/g, (_, id) => {
    return `<span contenteditable="false" class="evidence-chip inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md font-mono text-xs font-semibold border border-primary/30 bg-primary/10 text-primary select-none" data-evidence="${id}"><span class="opacity-70">📎</span>${id}</span>`;
  });

  // Code: `code`
  out = out.replace(/`([^`]+)`/g, (_, code) => {
    return `<code class="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-primary font-medium">${code}</code>`;
  });

  // Bold: **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, (_, bold) => {
    return `<b>${bold}</b>`;
  });

  // Italic: *text* (avoid matching list markers)
  out = out.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, (_, it) => {
    return `<i>${it}</i>`;
  });

  // Underline: <u>text</u>
  out = out.replace(/<u>([\s\S]*?)<\/u>/gi, (_, u) => {
    return `<u>${u}</u>`;
  });

  // Strikethrough: ~~text~~
  out = out.replace(/~~([^~]+)~~/g, (_, del) => {
    return `<s>${del}</s>`;
  });

  // Links: [label](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:text-primary/80 font-medium">${label}</a>`;
  });

  return out;
}

/**
 * Converts DOM tree / HTML string back into clean Markdown
 */
export function htmlToMarkdown(html: string): string {
  if (!html || !html.trim()) return "";

  const container = document.createElement("div");
  container.innerHTML = html;

  return parseNodeToMarkdown(container).trim();
}

function parseNodeToMarkdown(node: Node): string {
  let result = "";

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];

    if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent || "";
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    const el = child as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    // Check for Image figure or img
    if (el.classList.contains("notepad-image-card") || tagName === "figure") {
      const img = el.querySelector("img");
      if (img) {
        const alt = img.getAttribute("alt") || "";
        const src = img.getAttribute("src") || "";
        result += `![${alt}](${src})\n\n`;
        continue;
      }
    }
    if (tagName === "img") {
      const alt = el.getAttribute("alt") || "";
      const src = el.getAttribute("src") || "";
      result += `![${alt}](${src})\n\n`;
      continue;
    }

    // Check for Attachment Chip
    if (el.classList.contains("attachment-chip") || el.getAttribute("data-attachment")) {
      const attName = el.getAttribute("data-attachment") || el.textContent?.trim();
      const attSize = el.getAttribute("data-size");
      if (attSize) {
        result += `[Attachment: ${attName} (${attSize})] `;
      } else {
        result += `[Attachment: ${attName}] `;
      }
      continue;
    }

    // Check for Evidence chip
    if (
      el.classList.contains("evidence-chip") ||
      el.getAttribute("data-evidence")
    ) {
      const evName = el.getAttribute("data-evidence") || el.textContent?.trim();
      if (evName?.startsWith("#EV-")) {
        result += `${evName} `;
      } else {
        result += `[Evidence: ${evName}] `;
      }
      continue;
    }

    // Check for Checklist Item
    if (el.classList.contains("notepad-checklist-item")) {
      const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
      const isChecked = checkbox ? checkbox.checked : el.getAttribute("data-checked") === "true";
      const textSpan = el.querySelector(".checklist-text") || el;
      const textContent = parseNodeToMarkdown(textSpan).trim();
      result += `- [${isChecked ? "x" : " "}] ${textContent}\n`;
      continue;
    }

    // Check for Callouts
    if (el.classList.contains("notepad-callout-observation")) {
      const body = el.querySelector(".callout-body") || el;
      result += `> **OBSERVATION:** ${parseNodeToMarkdown(body).trim()}\n\n`;
      continue;
    }
    if (el.classList.contains("notepad-callout-finding")) {
      const body = el.querySelector(".callout-body") || el;
      result += `> **FINDING:** ${parseNodeToMarkdown(body).trim()}\n\n`;
      continue;
    }
    if (el.classList.contains("notepad-callout-warning")) {
      const body = el.querySelector(".callout-body") || el;
      result += `> **WARNING:** ${parseNodeToMarkdown(body).trim()}\n\n`;
      continue;
    }

    switch (tagName) {
      case "h1":
        result += `# ${parseNodeToMarkdown(el).trim()}\n\n`;
        break;
      case "h2":
        result += `## ${parseNodeToMarkdown(el).trim()}\n\n`;
        break;
      case "h3":
        result += `### ${parseNodeToMarkdown(el).trim()}\n\n`;
        break;
      case "h4":
        result += `#### ${parseNodeToMarkdown(el).trim()}\n\n`;
        break;
      case "p":
        const pContent = parseNodeToMarkdown(el).trim();
        if (pContent) {
          result += `${pContent}\n\n`;
        } else {
          result += "\n";
        }
        break;
      case "b":
      case "strong":
        result += `**${parseNodeToMarkdown(el)}**`;
        break;
      case "i":
      case "em":
        result += `*${parseNodeToMarkdown(el)}*`;
        break;
      case "u":
        result += `<u>${parseNodeToMarkdown(el)}</u>`;
        break;
      case "s":
      case "strike":
      case "del":
        result += `~~${parseNodeToMarkdown(el)}~~`;
        break;
      case "code":
        if (el.parentElement?.tagName.toLowerCase() === "pre") {
          result += el.textContent || "";
        } else {
          result += `\`${parseNodeToMarkdown(el)}\``;
        }
        break;
      case "pre":
        const codeEl = el.querySelector("code");
        const codeLang =
          codeEl?.className.match(/language-(\w+)/)?.[1] || "";
        const codeText = codeEl ? codeEl.textContent : el.textContent;
        result += `\`\`\`${codeLang}\n${codeText || ""}\n\`\`\`\n\n`;
        break;
      case "blockquote":
        result += `> ${parseNodeToMarkdown(el).trim()}\n\n`;
        break;
      case "ul":
        for (let j = 0; j < el.children.length; j++) {
          const li = el.children[j];
          if (li.tagName.toLowerCase() === "li") {
            result += `- ${parseNodeToMarkdown(li).trim()}\n`;
          }
        }
        result += "\n";
        break;
      case "ol":
        for (let j = 0; j < el.children.length; j++) {
          const li = el.children[j];
          if (li.tagName.toLowerCase() === "li") {
            result += `${j + 1}. ${parseNodeToMarkdown(li).trim()}\n`;
          }
        }
        result += "\n";
        break;
      case "a":
        const href = el.getAttribute("href") || "";
        result += `[${parseNodeToMarkdown(el)}](${href})`;
        break;
      case "hr":
        result += `---\n\n`;
        break;
      case "br":
        result += "\n";
        break;
      case "div":
        const divContent = parseNodeToMarkdown(el).trim();
        if (divContent) {
          result += `${divContent}\n\n`;
        }
        break;
      default:
        result += parseNodeToMarkdown(el);
    }
  }

  return result;
}

/**
 * Downloads note content as a Microsoft Word compatible HTML document (.doc)
 */
export function exportAsWordDoc(
  title: string,
  bodyHtml: string,
  metadata?: { author?: string; caseNumber?: string; date?: string }
) {
  const cleanTitle = title || "Untitled Note";
  const docHtml = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${cleanTitle}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; margin: 40px; }
        h1 { font-size: 20pt; color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-bottom: 12px; }
        h2 { font-size: 15pt; color: #0f172a; margin-top: 18px; margin-bottom: 8px; }
        h3 { font-size: 13pt; color: #334155; margin-top: 14px; margin-bottom: 6px; }
        p { margin: 6px 0; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #cbd5e1; }
        .meta-table td { padding: 8px 12px; font-size: 9.5pt; border: 1px solid #e2e8f0; }
        .callout { padding: 10px 14px; border-radius: 6px; margin: 12px 0; }
        .callout-obs { background-color: #e0f2fe; border-left: 4px solid #0284c7; }
        .callout-finding { background-color: #fef3c7; border-left: 4px solid #f59e0b; }
        blockquote { border-left: 4px solid #94a3b8; padding-left: 12px; margin: 10px 0; color: #64748b; font-style: italic; }
        code { background-color: #f1f5f9; padding: 2px 4px; font-family: Consolas, monospace; font-size: 9.5pt; color: #0f172a; }
        pre { background-color: #0f172a; color: #f8fafc; padding: 12px; font-family: Consolas, monospace; border-radius: 6px; }
        img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1>${cleanTitle}</h1>
      <table class="meta-table">
        <tr>
          <td><strong>Case Number:</strong> ${metadata?.caseNumber || "CS-2026-0142"}</td>
          <td><strong>Investigator:</strong> ${metadata?.author || "Alex Mercer"}</td>
          <td><strong>Date:</strong> ${metadata?.date || new Date().toLocaleDateString()}</td>
        </tr>
      </table>
      <div class="content">
        ${bodyHtml}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([docHtml], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${cleanTitle.replace(/[^a-z0-9-_]/gi, "_")}_Investigation_Note.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads note content as raw Markdown (.md)
 */
export function exportAsMarkdownFile(title: string, markdown: string) {
  const cleanTitle = title || "Untitled Note";
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${cleanTitle.replace(/[^a-z0-9-_]/gi, "_")}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Opens a print-ready forensic PDF document view and triggers print/save as PDF
 */
export function exportAsPdfDocument(
  title: string,
  bodyHtml: string,
  metadata?: { author?: string; caseNumber?: string; date?: string; tags?: string[] }
) {
  const cleanTitle = title || "Untitled Note";
  const printWindow = window.open("", "_blank", "width=850,height=1100");
  if (!printWindow) {
    window.print();
    return;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${cleanTitle} - Forensic Investigation Note</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; font-size: 10.5pt; line-height: 1.6; color: #0f172a; margin: 0; padding: 20px; }
        .header-bar { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
        .org-title { font-size: 14pt; font-weight: bold; color: #2563eb; letter-spacing: -0.5px; }
        .doc-classification { font-size: 8.5pt; font-weight: bold; color: #0284c7; text-transform: uppercase; letter-spacing: 1px; }
        h1 { font-size: 18pt; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 14px; }
        h2 { font-size: 13pt; font-weight: bold; color: #1e293b; margin-top: 18px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        h3 { font-size: 11.5pt; font-weight: 600; color: #334155; margin-top: 14px; margin-bottom: 6px; }
        p { margin: 6px 0; }
        .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; font-size: 9pt; }
        .meta-item strong { display: block; color: #64748b; font-size: 8pt; text-transform: uppercase; margin-bottom: 2px; }
        .notepad-callout-observation { background: #f0f9ff; border: 1px solid #bae6fd; border-left: 4px solid #0284c7; padding: 10px 14px; border-radius: 6px; margin: 14px 0; }
        .notepad-callout-finding { background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #d97706; padding: 10px 14px; border-radius: 6px; margin: 14px 0; }
        .notepad-callout-warning { background: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #e11d48; padding: 10px 14px; border-radius: 6px; margin: 14px 0; }
        blockquote { border-left: 3px solid #94a3b8; background: #f8fafc; padding: 8px 12px; margin: 12px 0; font-style: italic; color: #475569; }
        code { font-family: Consolas, monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-size: 9pt; border: 1px solid #e2e8f0; color: #2563eb; }
        pre { background: #0f172a; color: #f8fafc; padding: 12px; border-radius: 6px; font-family: Consolas, monospace; font-size: 8.5pt; overflow-x: auto; }
        img { max-width: 100%; max-height: 380px; border-radius: 6px; border: 1px solid #cbd5e1; margin: 8px 0; }
        figure { margin: 10px 0; }
        figcaption { font-size: 8pt; color: #64748b; font-style: italic; text-align: center; }
        .evidence-chip { background: #f0f9ff; border: 1px solid #bae6fd; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 8.5pt; font-weight: bold; }
        .attachment-chip { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 4px; font-size: 8.5pt; }
        .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 8pt; color: #94a3b8; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="header-bar">
        <div>
          <div class="org-title">CYBERSHIELD INVESTIGATOR</div>
          <div style="font-size: 8.5pt; color: #64748b;">Digital Forensics &amp; Incident Response Record</div>
        </div>
        <div class="doc-classification">CONFIDENTIAL // DIGITAL FORENSICS</div>
      </div>

      <h1>${cleanTitle}</h1>

      <div class="meta-grid">
        <div class="meta-item">
          <strong>Associated Case</strong>
          <span style="font-family: monospace; font-weight: bold; color: #0284c7;">${metadata?.caseNumber || "CS-2026-0142"}</span>
        </div>
        <div class="meta-item">
          <strong>Lead Investigator</strong>
          <span>${metadata?.author || "Alex Mercer"}</span>
        </div>
        <div class="meta-item">
          <strong>Document Date</strong>
          <span>${metadata?.date || new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div class="content">
        ${bodyHtml}
      </div>

      <div class="footer">
        <span>CyberShield Investigation Notes · Hash Verified Record</span>
        <span>Generated: ${new Date().toLocaleString()}</span>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();
}

/**
 * Triggers clean print view
 */
export function printNoteDocument(title: string) {
  window.print();
}
