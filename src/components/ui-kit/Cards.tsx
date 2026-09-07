import { motion } from "framer-motion";
import { FileAudio, FileImage, FileText, FileVideo, Paperclip } from "lucide-react";
import type { MockCase, MockEvidence, MockNotification, MockTask } from "@/data/mock/platform";
import { StatusPill } from "@/components/ui-kit/PageKit";

export function CaseCard({ item, onOpen }: { item: MockCase; onOpen?: () => void }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -3 }}
      onClick={onOpen}
      className="w-full rounded-2xl border border-white/10 bg-[#111827]/90 p-4 text-left hover:border-cyan/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-cyan">{item.caseNumber}</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{item.title}</p>
        </div>
        <StatusPill value={item.priority} />
      </div>
      <p className="mt-3 line-clamp-2 text-xs text-slate-500">{item.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
        <StatusPill value={item.status} />
        <span>{item.assignee}</span>
        <span>· {item.updated}</span>
      </div>
    </motion.button>
  );
}

function typeIcon(type: MockEvidence["type"]) {
  if (type === "image") return FileImage;
  if (type === "video") return FileVideo;
  if (type === "audio") return FileAudio;
  if (type === "pdf" || type === "document") return FileText;
  return Paperclip;
}

import { Trash2, UserCheck } from "lucide-react";

export function EvidenceCard({
  item,
  onOpen,
  onDelete,
}: {
  item: MockEvidence;
  onOpen?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}) {
  const Icon = typeIcon(item.type);
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className="group relative w-full rounded-2xl border border-white/10 bg-[#111827]/90 p-4 text-left transition-colors hover:border-cyan/40"
    >
      <div className="flex items-start justify-between">
        <div
          onClick={onOpen}
          className="mb-3 grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary"
        >
          <Icon className="h-5 w-5" />
        </div>
        {onDelete && (
          <button
            type="button"
            title="Delete Evidence"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(e);
            }}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/20 hover:text-rose-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div onClick={onOpen} className="cursor-pointer">
        <p className="truncate text-sm font-medium text-slate-100">{item.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {item.type} · {item.size}
        </p>
        <p className="mt-2 text-[11px] text-cyan">{item.caseNumber}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {item.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationCard({ item }: { item: MockNotification }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${item.read ? "border-white/5 bg-[#111827]/50" : "border-cyan/20 bg-cyan/5"}`}
    >
      <p className="text-sm font-medium text-slate-100">{item.title}</p>
      <p className="text-sm text-slate-400">{item.message}</p>
      <p className="mt-1 text-xs text-slate-500">{item.time}</p>
    </div>
  );
}

export function TaskCard({
  item,
  onDelete,
}: {
  item: MockTask & { assignee?: string; priority?: string };
  onDelete?: () => void;
}) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#111827]/90 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-100">{item.title}</p>
        <div className="flex items-center gap-1">
          <StatusPill value={item.status} />
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Delete Task"
              className="rounded-lg p-1 text-slate-500 hover:bg-rose-500/20 hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {item.caseNumber} · Due {item.due}
      </p>
      {item.assignee && (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-cyan/20 bg-cyan/5 px-2.5 py-1 text-xs text-cyan">
          <UserCheck className="h-3.5 w-3.5" />
          <span>Assigned to: {item.assignee}</span>
        </div>
      )}
    </div>
  );
}

export function RelationshipCard({
  source,
  target,
  type,
}: {
  source: string;
  target: string;
  type: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827]/90 px-4 py-3 text-sm">
      <p className="text-cyan">{source}</p>
      <p className="my-1 text-xs text-slate-500">{type}</p>
      <p className="text-emerald-400">{target}</p>
    </div>
  );
}

export function ReportCard({
  title,
  format,
  author,
  created,
  onPreview,
}: {
  title: string;
  format: string;
  author: string;
  created: string;
  onPreview?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPreview}
      className="w-full rounded-2xl border border-white/10 bg-[#111827]/90 p-4 text-left hover:border-cyan/40"
    >
      <p className="text-sm font-medium text-slate-100">{title}</p>
      <p className="mt-2 text-xs text-slate-500">
        {format} · {author} · {created}
      </p>
    </button>
  );
}

export function ProfileCard({
  name,
  email,
  role,
  department,
}: {
  name: string;
  email: string;
  role: string;
  department: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-6">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-cyan text-lg font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-50">{name}</p>
          <p className="text-sm text-slate-400">{email}</p>
          <p className="mt-1 text-xs text-cyan">
            {role} · {department}
          </p>
        </div>
      </div>
    </div>
  );
}
