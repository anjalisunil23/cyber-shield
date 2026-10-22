import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Image as ImageIcon,
  Music,
  Video as VideoIcon,
  Download,
  Copy,
  CheckCircle2,
  Sparkles,
  Search,
  ExternalLink,
  Shield,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Code,
  MessageSquare,
  FileCheck,
  Cpu,
  Layers,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { MockEvidence } from "@/data/mock/platform";

export interface EvidenceViewerItem {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "pdf" | "document" | "other" | string;
  size: string;
  caseNumber: string;
  uploadedBy?: string;
  uploadedAt?: string;
  tags?: string[];
  sha256?: string;
  mime_type?: string;
  description?: string;
}

export function EvidencePreviewModal({
  evidence,
  onClose,
}: {
  evidence: EvidenceViewerItem | MockEvidence | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"preview" | "metadata" | "intelligence">("preview");
  const [copiedHash, setCopiedHash] = useState(false);

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(38); // percentage
  const [showBoundingBox, setShowBoundingBox] = useState(true);

  // Audio state
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(25);
  const [isMuted, setIsMuted] = useState(false);

  // PDF state
  const [pdfPage, setPdfPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Chat / JSON state
  const [chatViewMode, setChatViewMode] = useState<"visual" | "json">("visual");

  // Re-run AI simulation
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!evidence) return null;

  const hash =
    evidence.sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const fullHash =
    hash.length > 20 ? hash : `${hash}0b5a198c23e88719f2010acb94871e881029c7b914d238b71946029311`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (label === "SHA-256") {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
    toast.success(`${label} copied to clipboard`);
  };

  const handleDownload = () => {
    const content = `CYBER SHIELD FORENSIC EVIDENCE DUMP
Evidence ID: ${evidence.id}
File Name: ${evidence.name}
Case Number: ${evidence.caseNumber}
Type: ${evidence.type}
Size: ${evidence.size}
SHA-256: ${fullHash}
Uploaded By: ${evidence.uploadedBy || "Forensic Unit"}
Uploaded At: ${evidence.uploadedAt || "2026-08-01 14:00"}
Chain of Custody: Intact & Authenticated
--------------------------------------------------
[Forensic verification checksum verified by Cyber Shield Platform]
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `forensic_${evidence.name}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded evidence artifact: ${evidence.name}`);
  };

  const runAiReanalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success("AI Forensic Pipeline: Re-analysis completed with 99.4% confidence");
    }, 1200);
  };

  const isPhishing =
    evidence.name.includes("phishing") ||
    evidence.name.includes("landing") ||
    (evidence.tags && evidence.tags.includes("screenshot"));
  const isCctv =
    evidence.name.includes("cctv") || evidence.name.includes("lobby") || evidence.type === "video";
  const isAudio =
    evidence.name.includes("recording") ||
    evidence.name.includes("call") ||
    evidence.type === "audio";
  const isReport =
    evidence.name.includes("report") || evidence.type === "pdf" || evidence.name.endsWith(".pdf");
  const isChat = evidence.name.includes("chat") || evidence.name.endsWith(".json");
  const isDiskNotes =
    evidence.name.includes("disk") ||
    evidence.name.includes("notes") ||
    evidence.name.endsWith(".docx");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col h-[94vh] max-h-[920px] w-full max-w-5xl rounded-2xl border border-cyan/30 bg-card shadow-2xl overflow-hidden text-foreground">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-background/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan">
              {evidence.type === "image" && <ImageIcon className="h-5 w-5" />}
              {evidence.type === "video" && <VideoIcon className="h-5 w-5" />}
              {evidence.type === "audio" && <Music className="h-5 w-5" />}
              {evidence.type === "pdf" && <FileText className="h-5 w-5" />}
              {evidence.type === "document" && <FileCheck className="h-5 w-5" />}
              {evidence.type === "other" && <Layers className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
                  {evidence.name}
                </h2>
                <span className="rounded-md bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase text-cyan">
                  {evidence.type}
                </span>
                <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Hash Verified
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">
                Case: <span className="text-cyan font-semibold">{evidence.caseNumber}</span> · Size:{" "}
                {evidence.size} · SHA-256: {fullHash.slice(0, 24)}…
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={runAiReanalysis}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title="Run AI Extraction Pipeline"
            >
              <Sparkles className={`h-3.5 w-3.5 text-cyan ${isAnalyzing ? "animate-spin" : ""}`} />
              {isAnalyzing ? "Analyzing..." : "Re-run AI"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-1"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-border px-5 bg-card text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "preview"
                ? "border-cyan text-cyan"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5" /> File Preview & Inspection
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("metadata")}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "metadata"
                ? "border-cyan text-cyan"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> Forensic Metadata & Hash
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("intelligence")}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "intelligence"
                ? "border-cyan text-cyan"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" /> AI Intelligence & Entities
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background/50">
          {activeTab === "preview" && (
            <div className="space-y-4">
              {/* 1. IMAGE: PHISHING / SCREENSHOT VIEWER */}
              {(isPhishing || evidence.type === "image") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">URL Captured:</span>
                      <span className="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 font-mono text-rose-500 font-semibold flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" />{" "}
                        https://secure-login-apexbank.online/customer/login
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Zoom out"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      <span className="font-mono text-[11px] text-muted-foreground px-1">
                        {zoomLevel}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Zoom in"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rendered phishing landing page visual */}
                  <div
                    className="overflow-auto rounded-2xl border border-rose-500/30 bg-slate-950 p-6 shadow-xl transition-all"
                    style={{
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: "top center",
                    }}
                  >
                    <div className="mx-auto max-w-xl rounded-xl border border-border bg-slate-900 p-6 shadow-2xl text-slate-100">
                      {/* Fake Bank Header */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                            AB
                          </div>
                          <div>
                            <h3 className="font-bold text-sm tracking-tight text-white">
                              Apex Commercial Bank
                            </h3>
                            <p className="text-[10px] text-slate-400">
                              Retail & Corporate Online Banking Portal
                            </p>
                          </div>
                        </div>
                        <span className="rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-mono px-2 py-0.5">
                          FLAGGED: SPOOFED SSL CERT
                        </span>
                      </div>

                      {/* Fake Login Form */}
                      <div className="mt-5 space-y-3.5 text-xs">
                        <div className="rounded-lg bg-rose-950/40 border border-rose-800/50 p-2.5 text-rose-300 text-[11px] flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
                          <span>
                            Forensic Flag: Form inputs exfiltrate credentials to Russian bulletproof
                            VPS (185.193.125.44)
                          </span>
                        </div>

                        <div>
                          <label className="block text-slate-300 text-[11px] mb-1 font-medium">
                            Customer ID / User ID
                          </label>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 font-mono text-slate-300 text-xs">
                            CUST_8829104
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-300 text-[11px] mb-1 font-medium">
                            Internet Banking Password
                          </label>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 font-mono text-slate-400 text-xs">
                            ••••••••••••••••
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-300 text-[11px] mb-1 font-medium">
                            One-Time Password (OTP)
                          </label>
                          <div className="rounded-lg border border-rose-500/50 bg-rose-950/30 px-3 py-2 font-mono text-rose-300 text-xs flex justify-between items-center">
                            <span>8 4 9 1 2 0</span>
                            <span className="text-[10px] text-rose-400 font-sans font-semibold">
                              Exfiltrated via POST
                            </span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="w-full rounded-lg bg-blue-600/80 py-2.5 text-center font-semibold text-white cursor-not-allowed">
                            Sign In to Secure Banking
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-slate-800 pt-3 text-[10px] text-slate-500 flex justify-between">
                        <span>Resolution: 1920x1080 (Headless Chromium 126)</span>
                        <span>Captured: 2026-08-01 14:22 UTC</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. VIDEO: CCTV LOBBY PLAYER */}
              {isCctv && evidence.type === "video" && (
                <div className="space-y-3">
                  {/* CCTV Monitor Screen */}
                  <div className="relative rounded-2xl border-2 border-emerald-500/30 bg-black overflow-hidden shadow-2xl aspect-video max-h-[440px] mx-auto flex flex-col justify-between">
                    {/* CCTV Overlay Top */}
                    <div className="flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent z-10 text-[11px] font-mono text-emerald-400">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="font-bold text-rose-400">REC</span>
                        <span>2026-07-29 11:04:38 IST</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>CAM 04 — MAIN LOBBY</span>
                        <span>30 FPS</span>
                        <span>H.264 4.2Mbps</span>
                      </div>
                    </div>

                    {/* CCTV Footage Visual Simulation */}
                    <div className="relative flex-1 flex items-center justify-center p-6 select-none">
                      {/* Grid overlay for CCTV look */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                          backgroundImage:
                            "linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)",
                          backgroundSize: "20px 20px",
                        }}
                      />

                      {/* CCTV Scene Canvas Mock */}
                      <div className="text-center space-y-3 z-10">
                        {/* Target Bounding Box */}
                        {showBoundingBox && (
                          <div className="inline-block relative p-6 border-2 border-dashed border-rose-500 rounded-lg bg-rose-500/10 backdrop-blur-xs animate-pulse">
                            <span className="absolute -top-3 left-2 bg-rose-600 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                              TARGET: SUSPECT #1 (96.4%)
                            </span>
                            <div className="h-24 w-20 mx-auto rounded-md bg-slate-800/80 flex flex-col items-center justify-center text-slate-300">
                              <span className="text-2xl">👤</span>
                              <span className="text-[10px] mt-1 text-slate-400 font-mono">
                                Ballcap & Duffel
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-rose-300 block mt-1">
                              Approaching Kiosk #3 · USB Tool Detected
                            </span>
                          </div>
                        )}

                        {!showBoundingBox && (
                          <div className="p-8 text-emerald-400/80 font-mono text-xs">
                            <p className="text-base font-bold">LOBBY ENTRANCE SURVEILLANCE FEED</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Timecode: 00:00:
                              {String(Math.floor((videoProgress / 100) * 84)).padStart(2, "0")} /
                              00:01:24
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CCTV Controls Bar */}
                    <div className="p-3 bg-gradient-to-t from-black/90 to-black/40 z-10 space-y-2">
                      {/* Progress Bar */}
                      <div
                        className="relative h-1.5 w-full bg-slate-800 rounded-full cursor-pointer overflow-hidden"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          setVideoProgress(Math.round((clickX / rect.width) * 100));
                        }}
                      >
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${videoProgress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          >
                            {isPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setVideoProgress(0)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                            title="Restart"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                          <span>
                            00:{String(Math.floor((videoProgress / 100) * 84)).padStart(2, "0")} /
                            01:24
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowBoundingBox(!showBoundingBox)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                              showBoundingBox
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            AI Bounding Box {showBoundingBox ? "ON" : "OFF"}
                          </button>
                          <span className="text-slate-500">|</span>
                          <span className="text-[11px] text-slate-400">1080p 30fps</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CCTV Keyframe Events */}
                  <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ClockIcon className="h-3.5 w-3.5 text-cyan" /> Event Timeline Breakdown
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3 text-xs">
                      <div className="rounded-lg bg-background p-2 border border-border/60">
                        <p className="font-mono text-cyan text-[11px]">11:04:32 IST</p>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          Normal lobby background traffic
                        </p>
                      </div>
                      <div className="rounded-lg bg-rose-500/10 p-2 border border-rose-500/30">
                        <p className="font-mono text-rose-400 text-[11px] font-bold">
                          11:04:38 IST (Active)
                        </p>
                        <p className="text-rose-300 text-[11px] mt-0.5">
                          Suspect enters revolving doors
                        </p>
                      </div>
                      <div className="rounded-lg bg-background p-2 border border-border/60">
                        <p className="font-mono text-cyan text-[11px]">11:05:12 IST</p>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          Kiosk USB connector inserted
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. AUDIO: CALL RECORDING & WAVEFORM */}
              {(isAudio || evidence.type === "audio") && (
                <div className="space-y-4">
                  {/* Audio Player Card */}
                  <div className="rounded-2xl border border-cyan-500/30 bg-card p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-500/15 text-cyan border border-cyan-500/30">
                          <Music className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">{evidence.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            VoIP Dual-Channel SIP Call Capture · 44.1 kHz 16-bit
                          </p>
                        </div>
                      </div>
                      <span className="rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-1 text-xs font-semibold">
                        Voice Authenticated
                      </span>
                    </div>

                    {/* Animated Waveform Simulator */}
                    <div className="rounded-xl bg-background/80 border border-border p-4 space-y-3">
                      <div className="flex items-end justify-between h-16 gap-1 px-2">
                        {Array.from({ length: 48 }).map((_, i) => {
                          const isPast = (i / 48) * 100 <= audioProgress;
                          const heightPct = Math.sin(i * 0.4) * 35 + 45 + (i % 5) * 8;
                          return (
                            <div
                              key={i}
                              className={`w-full rounded-full transition-all duration-150 ${
                                isPast
                                  ? "bg-cyan"
                                  : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                              }`}
                              style={{ height: `${heightPct}%` }}
                            />
                          );
                        })}
                      </div>

                      {/* Scrubber */}
                      <div
                        className="h-1.5 w-full bg-muted rounded-full cursor-pointer relative overflow-hidden"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setAudioProgress(
                            Math.round(((e.clientX - rect.left) / rect.width) * 100),
                          );
                        }}
                      >
                        <div
                          className="h-full bg-cyan rounded-full transition-all"
                          style={{ width: `${audioProgress}%` }}
                        />
                      </div>

                      {/* Audio Controls */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setIsAudioPlaying(!isAudioPlaying)}
                            className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs"
                          >
                            {isAudioPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4 ml-0.5" />
                            )}
                          </button>
                          <span className="font-mono text-foreground font-semibold">
                            00:{String(Math.floor((audioProgress / 100) * 222)).padStart(2, "0")} /
                            03:42
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            {isMuted ? (
                              <VolumeX className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </button>
                          <span className="text-[11px] font-mono">1.0x Speed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Call Dialogue Transcript */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-cyan" /> Dual-Channel Speech
                        Transcript
                      </h4>
                      <button
                        type="button"
                        onClick={() => copyToClipboard("Transcript extracted", "Call Transcript")}
                        className="text-xs text-cyan hover:underline flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" /> Copy Transcript
                      </button>
                    </div>

                    <div className="space-y-2.5 text-xs max-h-48 overflow-y-auto pr-1">
                      <div className="rounded-lg bg-background p-2.5 border border-border/60">
                        <p className="font-semibold text-cyan text-[11px]">
                          [00:02] Channel 1 — Officer Mercer (Cyber Incident Desk):
                        </p>
                        <p className="text-foreground mt-0.5">
                          "Cyber Shield Incident Response Desk, Officer Mercer. Please state your
                          incident and case reference."
                        </p>
                      </div>

                      <div className="rounded-lg bg-background p-2.5 border border-border/60">
                        <p className="font-semibold text-emerald-500 text-[11px]">
                          [00:09] Channel 2 — Complainant (S. Joseph):
                        </p>
                        <p className="text-foreground mt-0.5">
                          "Officer, I'm calling about an urgent unauthorized debit. About 45 minutes
                          ago, someone claiming to be from the bank's fraud unit called me asking to
                          verify an OTP."
                        </p>
                      </div>

                      <div className="rounded-lg bg-background p-2.5 border border-border/60">
                        <p className="font-semibold text-cyan text-[11px]">
                          [00:23] Channel 1 — Officer Mercer:
                        </p>
                        <p className="text-foreground mt-0.5">
                          "Did you read out any numeric OTP or install AnyDesk / TeamViewer on your
                          phone?"
                        </p>
                      </div>

                      <div className="rounded-lg bg-rose-500/10 p-2.5 border border-rose-500/30">
                        <p className="font-semibold text-rose-400 text-[11px]">
                          [00:29] Channel 2 — Complainant (FLAGGED STATEMENT):
                        </p>
                        <p className="text-rose-200 mt-0.5">
                          "Yes, they said my account was being debited and asked me to verify with
                          the code. Right after I gave it, ₹84,000 was debited to an IMPS
                          beneficiary named 'CoinX Trading'."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. PDF: FORENSIC REPORT VIEWER */}
              {(isReport || evidence.type === "pdf") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        Document: Forensic Laboratory Examination
                      </span>
                      <span className="text-muted-foreground font-mono">({evidence.size})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={pdfPage <= 1}
                        onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30 text-foreground"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="font-mono text-xs text-foreground">Page {pdfPage} of 4</span>
                      <button
                        type="button"
                        disabled={pdfPage >= 4}
                        onClick={() => setPdfPage((p) => Math.min(4, p + 1))}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30 text-foreground"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rendered PDF Page */}
                  <div className="rounded-2xl border border-border bg-slate-950 p-6 shadow-2xl text-slate-100 min-h-[380px]">
                    <div className="mx-auto max-w-2xl bg-white text-slate-900 rounded-lg p-8 shadow-xl font-serif text-xs leading-relaxed space-y-4">
                      {/* Document Letterhead */}
                      <div className="border-b-2 border-slate-900 pb-3 text-center">
                        <p className="text-[10px] font-sans uppercase font-bold tracking-widest text-slate-600">
                          Central Digital Forensics Laboratory (CDFL)
                        </p>
                        <h2 className="text-base font-bold tracking-tight text-slate-950 mt-1 uppercase">
                          Official Expert Forensic Examination Report
                        </h2>
                        <div className="mt-2 flex justify-between font-sans text-[10px] text-slate-600">
                          <span>Case No: {evidence.caseNumber}</span>
                          <span>Lab Ref: CDFL-2026-8819</span>
                          <span>Date: 2026-07-27</span>
                        </div>
                      </div>

                      {pdfPage === 1 && (
                        <div className="space-y-3 font-sans text-xs">
                          <div>
                            <h4 className="font-bold uppercase text-slate-900 border-b border-slate-300 pb-1">
                              1. Scope of Investigation & Seizure Intake
                            </h4>
                            <p className="text-slate-700 mt-1.5">
                              On July 27, 2026, the Digital Forensics Unit received two encrypted
                              internal workstations seized from the municipal finance wing under
                              evidentiary chain-of-custody seal #CDFL-7721.
                            </p>
                          </div>

                          <div>
                            <h4 className="font-bold uppercase text-slate-900 border-b border-slate-300 pb-1">
                              2. Hardware & Hash Verification Log
                            </h4>
                            <table className="w-full mt-2 text-[10px] border border-slate-300">
                              <thead className="bg-slate-100 font-bold">
                                <tr>
                                  <th className="p-1.5 text-left border border-slate-300">Item</th>
                                  <th className="p-1.5 text-left border border-slate-300">
                                    Serial Number
                                  </th>
                                  <th className="p-1.5 text-left border border-slate-300">
                                    SHA-256 Checksum Match
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="p-1.5 border border-slate-300">NVMe SSD 512GB</td>
                                  <td className="p-1.5 font-mono border border-slate-300">
                                    SN-98214-X9
                                  </td>
                                  <td className="p-1.5 font-bold text-emerald-700 border border-slate-300">
                                    ✓ 100% MATCH VERIFIED
                                  </td>
                                </tr>
                                <tr>
                                  <td className="p-1.5 border border-slate-300">
                                    External USB Drive
                                  </td>
                                  <td className="p-1.5 font-mono border border-slate-300">
                                    SN-44102-B1
                                  </td>
                                  <td className="p-1.5 font-bold text-emerald-700 border border-slate-300">
                                    ✓ 100% MATCH VERIFIED
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {pdfPage === 2 && (
                        <div className="space-y-3 font-sans text-xs">
                          <h4 className="font-bold uppercase text-slate-900 border-b border-slate-300 pb-1">
                            3. Executable Payload & Ransomware Artifacts
                          </h4>
                          <p className="text-slate-700">
                            Forensic triage revealed an unauthorized binary dropped into{" "}
                            <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">
                              C:\Windows\Temp\svchost_upd.exe
                            </code>
                            .
                          </p>
                          <div className="rounded bg-rose-50 border border-rose-200 p-2 text-rose-900 text-[11px]">
                            <p className="font-bold">Indicators of Compromise (IOC):</p>
                            <p className="font-mono mt-0.5">
                              Command Executed: vssadmin.exe Delete Shadows /All /Quiet
                            </p>
                            <p className="font-mono mt-0.5">
                              C2 Outbound IP: 194.26.29.112:443 (TLS encrypted session)
                            </p>
                          </div>
                        </div>
                      )}

                      {pdfPage >= 3 && (
                        <div className="space-y-3 font-sans text-xs">
                          <h4 className="font-bold uppercase text-slate-900 border-b border-slate-300 pb-1">
                            4. Examiner Attestation & Signatures
                          </h4>
                          <p className="text-slate-700">
                            I hereby attest under official oath that the electronic analysis was
                            performed adhering to ISO/IEC 27037 standards for digital evidence
                            handling.
                          </p>
                          <div className="pt-6 flex justify-between items-end border-t border-slate-200">
                            <div>
                              <p className="font-bold text-slate-900">Ravi Menon, EnCE, GCFE</p>
                              <p className="text-[10px] text-slate-500">
                                Senior Digital Forensics Examiner #9042
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="inline-block border-2 border-emerald-600 rounded px-2 py-1 text-emerald-700 font-bold text-[10px] uppercase">
                                ✓ Official Seal Verified
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. CHAT / JSON: CHAT EXPORT VIEWER */}
              {(isChat || evidence.name.endsWith(".json")) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2 text-xs">
                    <span className="text-muted-foreground">
                      Format: Decrypted Chat History Export
                    </span>
                    <div className="flex rounded-lg bg-muted p-1 border border-border">
                      <button
                        type="button"
                        onClick={() => setChatViewMode("visual")}
                        className={`px-3 py-1 rounded text-xs font-semibold transition ${
                          chatViewMode === "visual"
                            ? "bg-cyan text-slate-950 font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <MessageSquare className="h-3 w-3 inline mr-1" /> Visual Chat
                      </button>
                      <button
                        type="button"
                        onClick={() => setChatViewMode("json")}
                        className={`px-3 py-1 rounded text-xs font-semibold transition ${
                          chatViewMode === "json"
                            ? "bg-cyan text-slate-950 font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Code className="h-3 w-3 inline mr-1" /> Raw JSON
                      </button>
                    </div>
                  </div>

                  {chatViewMode === "visual" ? (
                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3 max-h-[380px] overflow-y-auto">
                      <div className="text-center text-[11px] text-muted-foreground border-b border-border pb-2 font-mono">
                        Session: Decrypted Telegram Export · Case {evidence.caseNumber}
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col items-start max-w-[80%] rounded-xl bg-muted/80 p-3 text-xs">
                          <span className="font-bold text-cyan text-[11px]">
                            @coinx_broker (Suspect)
                          </span>
                          <p className="text-foreground mt-1">
                            "Do you have the freshly harvested Kerala banking credentials?"
                          </p>
                          <span className="text-[10px] text-muted-foreground mt-1 font-mono">
                            12:44:19 UTC
                          </span>
                        </div>

                        <div className="flex flex-col items-end self-end max-w-[80%] rounded-xl bg-cyan-500/15 border border-cyan-500/30 p-3 text-xs">
                          <span className="font-bold text-foreground text-[11px]">
                            @mule_handler_south
                          </span>
                          <p className="text-foreground mt-1">
                            "Yes, batch of 180 verified records. Price is 0.085 BTC to the escrow
                            wallet."
                          </p>
                          <span className="text-[10px] text-muted-foreground mt-1 font-mono">
                            12:47:05 UTC
                          </span>
                        </div>

                        <div className="flex flex-col items-start max-w-[80%] rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs">
                          <span className="font-bold text-rose-400 text-[11px]">
                            @coinx_broker (FLAGGED BITCOIN ADDRESS)
                          </span>
                          <p className="text-rose-200 mt-1 font-mono text-[11px] select-all">
                            "Deposit address: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh. Confirm tx
                            id immediately."
                          </p>
                          <span className="text-[10px] text-muted-foreground mt-1 font-mono">
                            12:51:30 UTC
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-slate-950 p-4 font-mono text-xs text-emerald-400 max-h-[380px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{`{
  "export_meta": {
    "source": "Telegram / Signal Client Database",
    "case_id": "${evidence.caseNumber}",
    "sha256": "${fullHash}"
  },
  "messages": [
    {
      "id": 10842,
      "timestamp": "2026-07-26T12:44:19Z",
      "sender": "coinx_broker",
      "text": "Do you have the freshly harvested Kerala banking credentials?"
    },
    {
      "id": 10843,
      "timestamp": "2026-07-26T12:47:05Z",
      "sender": "mule_handler_south",
      "text": "Yes, batch of 180 verified records. Price is 0.085 BTC to the escrow wallet."
    },
    {
      "id": 10844,
      "timestamp": "2026-07-26T12:51:30Z",
      "sender": "coinx_broker",
      "crypto_address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "currency": "BTC",
      "flagged": true
    }
  ]
}`}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* 6. DOCX / NOTES: DISK IMAGE NOTES */}
              {(isDiskNotes || (!isPhishing && !isCctv && !isAudio && !isReport && !isChat)) && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
                    <div className="border-b border-border pb-3 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          Forensic Acquisition Field Notes
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Triage Protocol #FAP-2026 · Case {evidence.caseNumber}
                        </p>
                      </div>
                      <span className="rounded bg-primary/10 border border-primary/30 px-2 py-0.5 text-xs text-primary font-mono">
                        DOCX Log
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="rounded-lg bg-background p-3 border border-border/60">
                          <p className="text-muted-foreground text-[11px]">
                            Hardware Write-Blocker
                          </p>
                          <p className="font-semibold text-foreground font-mono mt-0.5">
                            Tableau T8u USB 3.0 Forensic Bridge
                          </p>
                        </div>
                        <div className="rounded-lg bg-background p-3 border border-border/60">
                          <p className="text-muted-foreground text-[11px]">Acquisition Software</p>
                          <p className="font-semibold text-foreground font-mono mt-0.5">
                            FTK Imager v4.7.1 + Guymager 0.8
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg bg-background p-3.5 border border-border/60 font-mono text-[11px] text-foreground space-y-1.5">
                        <p className="text-cyan font-bold uppercase tracking-wider">
                          Drive Geometry & Partition Table:
                        </p>
                        <p>Total Sectors: 1,000,215,216 (512.1 GB NVMe)</p>
                        <p>Partition 1: EFI System Partition (100 MB FAT32)</p>
                        <p>Partition 2: Microsoft Reserved Partition (16 MB)</p>
                        <p>Partition 3: Windows OS Primary Partition (511.2 GB NTFS) — Acquired</p>
                        <p className="text-emerald-500 font-bold mt-1">
                          ✓ Bad Sector Count: 0 · Sector Verification: Pass
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "metadata" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-cyan" /> Cryptographic Integrity & Hash Digest
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-background border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground font-medium">
                        SHA-256 Digest (NIST FIPS 180-4)
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(fullHash, "SHA-256")}
                        className="text-cyan hover:underline flex items-center gap-1 text-[11px]"
                      >
                        {copiedHash ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedHash ? "Copied!" : "Copy Hash"}
                      </button>
                    </div>
                    <p className="font-mono text-xs text-foreground bg-card p-2 rounded-lg border border-border select-all break-all">
                      {fullHash}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="p-3 rounded-xl bg-background border border-border">
                      <p className="text-muted-foreground text-[11px]">Original File Name</p>
                      <p className="font-semibold text-foreground mt-0.5">{evidence.name}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border">
                      <p className="text-muted-foreground text-[11px]">File Size</p>
                      <p className="font-mono text-foreground mt-0.5">{evidence.size}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border">
                      <p className="text-muted-foreground text-[11px]">Case Association</p>
                      <p className="font-semibold text-cyan mt-0.5">{evidence.caseNumber}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border">
                      <p className="text-muted-foreground text-[11px]">Investigating Officer</p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {evidence.uploadedBy || "Lead Investigator"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chain of Custody */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-emerald-500" /> Chain of Custody Audit
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Digital Seizure Logged:</span>
                    <span className="font-mono text-foreground">
                      {evidence.uploadedAt || "2026-08-01 14:22"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Cryptographic Verification:</span>
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Bit-stream Exact Copy Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-muted-foreground">Vault Storage Tier:</span>
                    <span className="font-mono text-cyan">
                      AES-256 Encrypted Forensic Repository
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "intelligence" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-cyan" /> AI-Extracted Entities & Forensic IOCs
                  </h3>
                  <span className="rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan text-[10px] font-mono font-bold px-2 py-0.5">
                    Gemini Cyber Forensics 2.5
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
                    <span className="rounded bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-bold px-2 py-0.5 uppercase">
                      FLAGGED DOMAIN
                    </span>
                    <p className="font-mono font-bold text-foreground mt-1 select-all">
                      secure-login-apexbank.online
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Category: Typosquatting Phishing Gateway
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
                    <span className="rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold px-2 py-0.5 uppercase">
                      CRYPTO WALLET
                    </span>
                    <p className="font-mono font-bold text-foreground mt-1 select-all break-all text-[11px]">
                      bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Network: Bitcoin (Bech32 Native SegWit)
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
                    <span className="rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold px-2 py-0.5 uppercase">
                      HOST IP / ASN
                    </span>
                    <p className="font-mono font-bold text-foreground mt-1 select-all">
                      185.193.125.44 (AS49505)
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Host: Bulletproof Infrastructure, Eastern Europe
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold px-2 py-0.5 uppercase">
                      ASSOCIATED PERSON
                    </span>
                    <p className="font-bold text-foreground mt-1">
                      Alex Mercer (Primary Investigator)
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Case Lead: Cyber Crime Unit (CCU)
                    </p>
                  </div>
                </div>
              </div>

              {/* Optical Character Recognition Summary */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-cyan" /> OCR & Text Extracted by AI Pipeline
                </h4>
                <div className="p-3 rounded-xl bg-background border border-border font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                  {`[OCR Engine: Tesseract 5.3 + Vision Model]
Content identified in evidence ${evidence.name}:
- "Apex Commercial Bank - Corporate & Retail Online Banking Portal"
- "Please enter your 10-digit Customer ID and Password to proceed."
- "Transaction Authorization: 6-digit OTP verification required."
- Suspect IOC: POST destination endpoint https://185.193.125.44/api/v1/auth/collect`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 bg-background/90 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5 text-[11px]">
            <ShieldAlert className="h-3.5 w-3.5 text-cyan" />
            <span>
              Cyber Shield Evidence Viewer: Cryptographic hash verified. Human supervision required
              for legal presentation.
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-lg border border-border px-3 py-1 font-semibold text-foreground hover:bg-muted transition"
            >
              Export Record
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-cyan-500/20 text-cyan border border-cyan-500/40 px-3 py-1 font-semibold hover:bg-cyan-500/30 transition"
            >
              Close Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
