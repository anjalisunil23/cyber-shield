import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";

const TYPES = ["Images", "Videos", "Documents", "Audio", "Chat Exports"];

export function UploadWidget() {
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  function simulateUpload() {
    setProgress(0);
    let p = 0;
    const id = window.setInterval(() => {
      p += 12;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        window.clearInterval(id);
        toast.success("Evidence uploaded successfully");
      }
    }, 160);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-5">
      <h3 className="text-sm font-semibold text-slate-100">Evidence Upload</h3>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          simulateUpload();
        }}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition ${
          dragging ? "border-cyan bg-cyan/10" : "border-white/15 bg-white/[0.02]"
        }`}
        onClick={simulateUpload}
      >
        <UploadCloud className="h-8 w-8 text-cyan" />
        <p className="mt-3 text-sm text-slate-200">Drag & drop evidence files</p>
        <p className="mt-1 text-xs text-slate-500">or click to browse</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <span
            key={t}
            className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-slate-400"
          >
            {t}
          </span>
        ))}
      </div>
      {progress > 0 && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[11px] text-slate-400">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-cyan transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
