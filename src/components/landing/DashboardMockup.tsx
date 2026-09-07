import { Bot, Network, Search, Shield } from "lucide-react";

export function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[rgb(17_24_39/0.85)] shadow-[0_0_80px_-24px_rgba(59,130,246,0.5)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Shield className="h-4 w-4 text-primary" /> CyberShield Console
        </div>
        <div className="flex w-48 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground">
          <Search className="h-3.5 w-3.5" /> Search evidence…
        </div>
      </div>

      <div className="grid min-h-[360px] md:grid-cols-[180px_1fr_200px]">
        <aside className="hidden border-r border-white/10 p-3 md:block">
          {["Overview", "Evidence", "Timeline", "Graph", "Reports", "Settings"].map((item, i) => (
            <div
              key={item}
              className={`mb-1 rounded-lg px-3 py-2 text-xs ${i === 0 ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5"}`}
            >
              {item}
            </div>
          ))}
        </aside>

        <div className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Open Cases", value: "128" },
              { label: "Evidence Files", value: "4.2k" },
              { label: "AI Leads", value: "86" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-3 text-xs font-medium">Evidence ingest volume</p>
            <div className="flex h-24 items-end gap-2">
              {[35, 55, 40, 70, 50, 85, 60, 95, 75, 88].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-primary/50 to-cyan"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-white/5 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">File</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["IMG_9912.png", "Image", "Analyzed"],
                  ["whatsapp_dump.zip", "Chat", "Processing"],
                  ["email_mbox.eml", "Email", "Analyzed"],
                ].map(([file, type, status]) => (
                  <tr key={file} className="border-t border-white/5">
                    <td className="px-3 py-2">{file}</td>
                    <td className="px-3 py-2 text-muted-foreground">{type}</td>
                    <td className="px-3 py-2">
                      <span className={status === "Analyzed" ? "text-success" : "text-cyan"}>
                        {status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="hidden space-y-3 border-l border-white/10 p-3 md:block">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
              <Bot className="h-3.5 w-3.5 text-cyan" /> AI Assistant
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Face cluster matched across 4 images. Recommend reviewing timeline 14:20–15:05.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
              <Network className="h-3.5 w-3.5 text-primary" /> Graph
            </div>
            <svg viewBox="0 0 140 100" className="w-full">
              <line x1="30" y1="50" x2="70" y2="25" stroke="rgba(59,130,246,0.5)" />
              <line x1="70" y1="25" x2="110" y2="50" stroke="rgba(6,182,212,0.5)" />
              <line x1="70" y1="25" x2="70" y2="75" stroke="rgba(59,130,246,0.4)" />
              <circle cx="30" cy="50" r="7" fill="#3b82f6" />
              <circle cx="70" cy="25" r="8" fill="#06b6d4" />
              <circle cx="110" cy="50" r="7" fill="#3b82f6" />
              <circle cx="70" cy="75" r="6" fill="#22c55e" />
            </svg>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-2 text-xs font-medium">Investigation timeline</p>
            <div className="space-y-2">
              {["Seizure logged", "AI classify", "Lead scored"].map((t, i) => (
                <div key={t} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                  <span className="text-foreground/80">{t}</span>
                  <span className="ml-auto opacity-60">
                    0{i + 1}:1{i}{" "}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
