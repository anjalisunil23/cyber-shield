import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Compass,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Maximize2,
  Minimize2,
  Music,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Tag,
  Trash2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";
import { investigationApi } from "@/services/investigationApi";
import type { RepositoryItem } from "@/services/types";
import { getToken } from "@/lib/auth";
import { roleFromAccessToken } from "@/lib/roles";

const TYPE_FILTERS = [
  "All Types",
  "Documents",
  "Images",
  "Audio",
  "Video",
  "Communications",
  "Location",
  "Browser",
  "Call Logs",
  "Social Export",
  "Other",
];

const GENERATE_TYPES = [
  { id: "documents", label: "Documents" },
  { id: "images", label: "Images" },
  { id: "audio", label: "Audio" },
  { id: "video", label: "Video" },
  { id: "communications", label: "Communications" },
  { id: "location", label: "Location" },
  { id: "browser", label: "Browser History" },
  { id: "call_logs", label: "Call Logs (CDR)" },
  { id: "social_export", label: "Social Export" },
];

export function EvidenceRepositoryPage({
  homeTo,
  homeLabel,
}: {
  homeTo: string;
  homeLabel: string;
}) {
  const qc = useQueryClient();
  const role = roleFromAccessToken(getToken());
  const isAdmin = role === "admin" || role === "major_admin";

  const [viewMode, setViewMode] = useState<"folders" | "flat">("folders");
  const [caseId, setCaseId] = useState("all");
  const [category, setCategory] = useState("All Types");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [folderSubCategories, setFolderSubCategories] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<RepositoryItem | null>(null);
  const [previewContent, setPreviewContent] = useState<{
    kind: "blob" | "text";
    url?: string;
    text?: string;
  } | null>(null);
  const [addTarget, setAddTarget] = useState<RepositoryItem | null>(null);
  const [addCaseId, setAddCaseId] = useState("");
  const [genOpen, setGenOpen] = useState(false);
  const [genCaseId, setGenCaseId] = useState("");
  const [genTypes, setGenTypes] = useState<string[]>(GENERATE_TYPES.map((t) => t.id));
  const [genCount, setGenCount] = useState(20);
  const [jobId, setJobId] = useState<string | null>(null);

  const casesQ = useQuery({
    queryKey: ["cases"],
    queryFn: () => investigationApi.listCases({ page_size: 100 }),
  });
  const cases = useMemo(() => casesQ.data?.items || [], [casesQ.data?.items]);

  // Initialize all folders as expanded when cases load
  useEffect(() => {
    if (cases.length > 0 && Object.keys(expandedFolders).length === 0) {
      const initial: Record<string, boolean> = {};
      cases.forEach((c) => {
        initial[c.id] = true;
      });
      setExpandedFolders(initial);
    }
  }, [cases, expandedFolders]);

  const repoQ = useQuery({
    queryKey: ["evidence-repository", caseId, category, search, page, viewMode],
    queryFn: () =>
      investigationApi.listRepository({
        case_id: caseId !== "all" ? caseId : undefined,
        category: category === "All Types" ? undefined : category,
        q: search || undefined,
        page: viewMode === "folders" ? 1 : page,
        page_size: viewMode === "folders" ? 100 : 12,
      }),
  });

  const jobQ = useQuery({
    queryKey: ["repository-job", jobId],
    queryFn: () => investigationApi.getRepositoryJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (q) =>
      q.state.data?.status === "completed" || q.state.data?.status === "failed" ? false : 1500,
  });

  useEffect(() => {
    if (jobQ.data?.status === "completed") {
      toast.success(`Generated ${jobQ.data.total_files || 0} synthetic files`);
      void qc.invalidateQueries({ queryKey: ["evidence-repository"] });
    }
    if (jobQ.data?.status === "failed") {
      toast.error(jobQ.data?.error || "Generation failed");
    }
  }, [jobQ.data?.status, jobQ.data?.total_files, jobQ.data?.error, qc]);

  const generateOne = useMutation({
    mutationFn: (complete: boolean) => {
      if (!genCaseId) {
        return Promise.reject(new Error("Select a case first"));
      }
      return investigationApi.generateRepository({
        case_id: genCaseId,
        types: complete ? undefined : genTypes,
        count: complete ? undefined : genCount,
        complete,
      });
    },
    onSuccess: (res) => {
      toast.success(`Created ${res.created} synthetic files for ${res.case_number}`);
      setGenOpen(false);
      void qc.invalidateQueries({ queryKey: ["evidence-repository"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });

  const generateAll = useMutation({
    mutationFn: () => investigationApi.generateRepositoryAll(),
    onSuccess: (res) => {
      if (res.job_id) {
        setJobId(res.job_id);
        toast.message("Generating synthetic evidence for all cases…");
      }
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });

  const addToCase = useMutation({
    mutationFn: () => investigationApi.addRepositoryToCase(addTarget!.id, addCaseId),
    onSuccess: (ev) => {
      toast.success(
        ev.is_duplicate || ev.warning
          ? ev.warning || "Imported with duplicate warning"
          : `Added ${ev.original_name} to case and started processing`,
      );
      setAddTarget(null);
      void qc.invalidateQueries({ queryKey: ["evidence-repository"] });
      void qc.invalidateQueries({ queryKey: ["evidence"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Import failed"),
  });

  const resetMut = useMutation({
    mutationFn: () => investigationApi.resetSyntheticRepository(),
    onSuccess: (res) => {
      toast.success(res.message);
      void qc.invalidateQueries({ queryKey: ["evidence-repository"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Reset failed"),
  });

  const items = useMemo(() => repoQ.data?.items || [], [repoQ.data?.items]);
  const total = repoQ.data?.total || 0;
  const pages = repoQ.data?.pages || 1;

  const openPreview = async (item: RepositoryItem) => {
    setPreview(item);
    setPreviewContent(null);
    try {
      const content = await investigationApi.previewRepository(
        item.id,
        item.mime_type,
        item.file_type,
      );
      setPreviewContent(content);
    } catch {
      toast.error("Preview failed");
    }
  };

  const iconFor = (item: RepositoryItem) => {
    if (item.category === "images" || item.file_type === "image") return ImageIcon;
    if (item.category === "audio" || item.file_type === "audio") return Music;
    if (item.category === "video" || item.file_type === "video") return Video;
    if (item.category === "location") return Compass;
    if (item.category === "call_logs") return Phone;
    if (item.category === "social_export" || item.category === "communications")
      return FileSpreadsheet;
    return FileText;
  };

  const toggleFolder = (cId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [cId]: !prev[cId] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    cases.forEach((c) => {
      next[c.id] = true;
    });
    setExpandedFolders(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    cases.forEach((c) => {
      next[c.id] = false;
    });
    setExpandedFolders(next);
  };

  // Group items by case
  const caseFolders = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return cases
      .filter((c) => (caseId === "all" ? true : c.id === caseId))
      .map((c) => {
        let caseItems = items.filter(
          (it) => it.case_id === c.id || it.case_number === c.case_number,
        );

        if (category && category !== "All Types") {
          const catLower = category.toLowerCase();
          caseItems = caseItems.filter(
            (it) =>
              it.category.toLowerCase() === catLower ||
              it.file_type.toLowerCase() === catLower.replace(/s$/, ""),
          );
        }

        if (searchLower) {
          caseItems = caseItems.filter((it) => {
            const matchesText =
              it.original_name.toLowerCase().includes(searchLower) ||
              it.category.toLowerCase().includes(searchLower) ||
              it.file_type.toLowerCase().includes(searchLower) ||
              (it.description || "").toLowerCase().includes(searchLower) ||
              c.case_number.toLowerCase().includes(searchLower) ||
              c.title.toLowerCase().includes(searchLower);

            const entities = ((it.metadata_json as Record<string, unknown>)?.entities || []) as (
              string | Record<string, string>
            )[];
            const matchesEntities = Array.isArray(entities)
              ? entities.some((e) =>
                  typeof e === "string" ? e.toLowerCase().includes(searchLower) : false,
                )
              : false;

            return matchesText || matchesEntities;
          });
        }

        const totalBytes = caseItems.reduce((acc, it) => acc + (it.file_size || 0), 0);

        const categoryCounts = caseItems.reduce<Record<string, number>>((acc, it) => {
          acc[it.category] = (acc[it.category] || 0) + 1;
          return acc;
        }, {});

        return {
          caseData: c,
          items: caseItems,
          totalBytes,
          categoryCounts,
          isExpanded: !!expandedFolders[c.id],
        };
      })
      .filter((folder) => {
        if (!searchLower) return true;
        const matchesCaseHeader =
          folder.caseData.case_number.toLowerCase().includes(searchLower) ||
          folder.caseData.title.toLowerCase().includes(searchLower);
        return matchesCaseHeader || folder.items.length > 0;
      });
  }, [cases, items, caseId, category, search, expandedFolders]);

  const totalRepoFiles = useMemo(
    () => caseFolders.reduce((acc, f) => acc + f.items.length, 0),
    [caseFolders],
  );

  const emptyHint = useMemo(() => {
    if (cases.length === 0)
      return "Create a case first, then generate synthetic demonstration evidence.";
    return "Your cases are ready. Generate synthetic evidence to test the investigation pipeline.";
  }, [cases.length]);

  return (
    <PageScaffold
      crumbs={[{ label: homeLabel, to: homeTo }, { label: "Evidence Repository" }]}
      title="Evidence Repository"
    >
      {/* Top Header Row */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-600">
            <ShieldAlert className="h-3.5 w-3.5" /> Synthetic data only
          </span>
          <span className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground">
            {caseFolders.length} Case Folders · {totalRepoFiles} Evidence Files
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("folders")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "folders"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FolderOpen className="h-3.5 w-3.5" /> Case Folders
            </button>
            <button
              type="button"
              onClick={() => setViewMode("flat")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "flat"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> All Files Grid
            </button>
          </div>

          <PrimaryButton
            onClick={() => {
              setGenCaseId(cases[0]?.id || "");
              setGenOpen(true);
            }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Generate Evidence
            </span>
          </PrimaryButton>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      "This will create synthetic demonstration evidence only. No real forensic data will be used.",
                    )
                  ) {
                    generateAll.mutate();
                  }
                }}
                className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Generate For All Cases
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      "Delete only synthetic repository/imported demo files? Users, cases, and non-synthetic evidence stay.",
                    )
                  ) {
                    resetMut.mutate();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" /> Reset
              </button>
            </>
          )}
        </div>
      </div>

      {jobId && (
        <Panel className="mb-4">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Generating synthetic evidence…
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {jobQ.data?.completed || 0}/{jobQ.data?.total_cases || "?"} cases
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {(jobQ.data?.cases || []).map((row) => (
              <li key={row.case_number}>
                {row.case_number} {row.ok ? `✓ ${row.created} files` : "failed"}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Filter and Search Bar */}
      <Panel className="mb-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs font-medium text-muted-foreground">
            Filter by Case Folder
            <select
              value={caseId}
              onChange={(e) => {
                setCaseId(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="all">All Case Folders ({cases.length})</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  📁 {c.case_number} — {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Evidence Type
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {TYPE_FILTERS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Search Repository
            <span className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="filename, case, person, phone, location..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </span>
          </label>
        </div>

        {viewMode === "folders" && (
          <div className="mt-3 flex flex-wrap items-center justify-between border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-primary" />
              <span>
                Showing <strong>{caseFolders.length}</strong> folders with{" "}
                <strong>{totalRepoFiles}</strong> matching evidence items
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 font-semibold text-foreground hover:bg-muted"
              >
                <Maximize2 className="h-3 w-3" /> Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 font-semibold text-foreground hover:bg-muted"
              >
                <Minimize2 className="h-3 w-3" /> Collapse All
              </button>
            </div>
          </div>
        )}
      </Panel>

      {repoQ.isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading repository folders…
        </div>
      ) : cases.length === 0 ? (
        <Panel>
          <div className="py-10 text-center">
            <Archive className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">No cases available</p>
            <p className="mt-1 text-xs text-muted-foreground">{emptyHint}</p>
          </div>
        </Panel>
      ) : viewMode === "folders" ? (
        /* CASE FOLDERS VIEW */
        <div className="space-y-4">
          {caseFolders.map((folder) => {
            const { caseData, items: folderItems, totalBytes, categoryCounts, isExpanded } = folder;
            const subCategory = folderSubCategories[caseData.id] || "All";

            const filteredFolderItems =
              subCategory === "All"
                ? folderItems
                : folderItems.filter(
                    (it) =>
                      it.category.toLowerCase() === subCategory.toLowerCase() ||
                      it.file_type.toLowerCase() === subCategory.toLowerCase().replace(/s$/, ""),
                  );

            return (
              <div
                key={caseData.id}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all"
              >
                {/* Case Folder Header */}
                <div
                  onClick={() => toggleFolder(caseData.id)}
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/30 px-5 py-3.5 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Toggle Folder"
                      className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary transition-transform hover:scale-105"
                    >
                      {isExpanded ? (
                        <FolderOpen className="h-4 w-4 text-primary" />
                      ) : (
                        <Folder className="h-4 w-4 text-primary" />
                      )}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {caseData.case_number}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <h3 className="text-sm font-bold text-foreground">{caseData.title}</h3>
                        {caseData.priority && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              caseData.priority === "critical"
                                ? "border border-red-500/30 bg-red-500/10 text-red-500"
                                : caseData.priority === "high"
                                  ? "border border-amber-500/30 bg-amber-500/10 text-amber-600"
                                  : "border border-blue-500/30 bg-blue-500/10 text-blue-500"
                            }`}
                          >
                            {caseData.priority}
                          </span>
                        )}
                        {caseData.status && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {caseData.status}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {folderItems.length} files inside · {(totalBytes / 1024).toFixed(1)} KB
                        total
                      </p>
                    </div>
                  </div>

                  {/* Folder Quick Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setGenCaseId(caseData.id);
                        setGenOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Generate For This Case
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleFolder(caseData.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Folder Body */}
                {isExpanded && (
                  <div className="p-5">
                    {folderItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border py-8 text-center">
                        <Folder className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-semibold text-foreground">Folder is empty</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          No synthetic demonstration evidence generated yet for{" "}
                          {caseData.case_number}.
                        </p>
                        <div className="mt-3">
                          <PrimaryButton
                            onClick={() => {
                              setGenCaseId(caseData.id);
                              setGenOpen(true);
                            }}
                          >
                            <Sparkles className="h-3.5 w-3.5" /> Generate Evidence For This Case
                          </PrimaryButton>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Sub-Category Filter Chips */}
                        <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-border/40 pb-3">
                          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Category:
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFolderSubCategories((prev) => ({
                                ...prev,
                                [caseData.id]: "All",
                              }))
                            }
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                              subCategory === "All"
                                ? "bg-primary text-white"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            All ({folderItems.length})
                          </button>
                          {Object.entries(categoryCounts).map(([cat, count]) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() =>
                                setFolderSubCategories((prev) => ({
                                  ...prev,
                                  [caseData.id]: cat,
                                }))
                              }
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
                                subCategory.toLowerCase() === cat.toLowerCase()
                                  ? "bg-primary text-white"
                                  : "bg-muted text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {cat} ({count})
                            </button>
                          ))}
                        </div>

                        {/* Folder Evidence Grid */}
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {filteredFolderItems.map((item) => {
                            const Icon = iconFor(item);
                            const entities = (
                              ((item.metadata_json as Record<string, unknown>)?.entities || []) as (
                                string | Record<string, string>
                              )[]
                            ).filter((e) => typeof e === "string") as string[];

                            return (
                              <div
                                key={item.id}
                                className="space-y-3 rounded-2xl border border-border bg-background/60 p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono uppercase text-primary">
                                      {item.category}
                                    </span>
                                    {item.processing_status === "imported" && (
                                      <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-500">
                                        Imported
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <RepoThumb item={item} />

                                <div>
                                  <p
                                    className="truncate text-sm font-semibold text-foreground"
                                    title={item.original_name}
                                  >
                                    {item.original_name}
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {(item.file_size / 1024).toFixed(1)} KB · {item.file_type}
                                  </p>
                                </div>

                                {entities.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {entities.slice(0, 3).map((ent, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                      >
                                        <Tag className="h-2.5 w-2.5 text-primary" /> {ent}
                                      </span>
                                    ))}
                                    {entities.length > 3 && (
                                      <span className="text-[10px] text-muted-foreground">
                                        +{entities.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                )}

                                <p className="font-mono text-[10px] text-muted-foreground break-all">
                                  SHA-256: {item.sha256_hash.slice(0, 10)}…
                                  {item.sha256_hash.slice(-4)}
                                </p>

                                <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40">
                                  <button
                                    type="button"
                                    onClick={() => void openPreview(item)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
                                  >
                                    <Eye className="h-3 w-3" /> Preview
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void investigationApi.downloadRepository(
                                        item.id,
                                        item.original_name,
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
                                  >
                                    <Download className="h-3 w-3" /> Download
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddTarget(item);
                                      setAddCaseId(item.case_id);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:opacity-90"
                                  >
                                    <Plus className="h-3 w-3" /> Add to Case
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* FLAT GRID VIEW */
        <>
          {items.length === 0 ? (
            <Panel>
              <div className="py-10 text-center">
                <Archive className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">
                  No synthetic evidence available
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{emptyHint}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <PrimaryButton
                    onClick={() => {
                      setGenCaseId(cases[0]?.id || "");
                      setGenOpen(true);
                    }}
                  >
                    Generate Evidence
                  </PrimaryButton>
                  <button
                    type="button"
                    onClick={() => {
                      setGenCaseId(cases[0]?.id || "");
                      setGenOpen(true);
                    }}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
                  >
                    Generate Complete Demo
                  </button>
                </div>
              </div>
            </Panel>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => {
                  const Icon = iconFor(item);
                  return (
                    <div
                      key={item.id}
                      className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono uppercase text-primary">
                          {item.category}
                        </span>
                      </div>
                      <RepoThumb item={item} />
                      <p className="truncate text-sm font-semibold" title={item.original_name}>
                        {item.original_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Case: {item.case_number || "—"} · {(item.file_size / 1024).toFixed(1)} KB
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground break-all">
                        Hash: {item.sha256_hash.slice(0, 12)}…{item.sha256_hash.slice(-4)}
                      </p>
                      <p className="text-[10px] text-amber-600">SYNTHETIC DEMONSTRATION DATA</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => void openPreview(item)}
                          className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void investigationApi.downloadRepository(item.id, item.original_name)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold"
                        >
                          <Download className="h-3 w-3" /> Download
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddTarget(item);
                            setAddCaseId(item.case_id);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white"
                        >
                          <Plus className="h-3 w-3" /> Add to Case
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {total} items · page {page}/{pages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-lg border px-2 py-1 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={page >= pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border px-2 py-1 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-sm font-bold">{preview.original_name}</p>
                <p className="text-[10px] text-amber-600">
                  Case: {preview.case_number} · SYNTHETIC DEMONSTRATION DATA
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-1 text-xs font-semibold hover:bg-muted"
                onClick={() => {
                  setPreview(null);
                  setPreviewContent(null);
                }}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {!previewContent && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
              {previewContent?.kind === "blob" &&
                previewContent.url &&
                (preview.file_type === "audio" || (preview.mime_type || "").startsWith("audio/") ? (
                  <audio controls src={previewContent.url} className="w-full" />
                ) : preview.file_type === "video" ||
                  (preview.mime_type || "").startsWith("video/") ? (
                  <video
                    controls
                    src={previewContent.url}
                    className="max-h-[60vh] w-full bg-black rounded-xl"
                  />
                ) : (preview.mime_type || "") === "application/pdf" ? (
                  <iframe
                    title="pdf"
                    src={previewContent.url}
                    className="h-[65vh] w-full rounded-xl bg-white"
                  />
                ) : (
                  <img
                    src={previewContent.url}
                    alt={preview.original_name}
                    className="max-h-[65vh] w-full object-contain rounded-xl"
                  />
                ))}
              {previewContent?.kind === "text" && (
                <pre className="whitespace-pre-wrap font-mono rounded-xl bg-muted p-3 text-xs leading-relaxed">
                  {previewContent.text}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add to Case Modal */}
      {addTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-bold">Add to case</h3>
            <p className="text-xs text-muted-foreground">
              Imports <strong>{addTarget.original_name}</strong> through the existing evidence
              pipeline (hash, duplicates, metadata, AI preprocessing).
            </p>
            <select
              value={addCaseId}
              onChange={(e) => setAddCaseId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} — {c.title}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddTarget(null)}
                className="rounded-xl border px-3 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <PrimaryButton onClick={() => addToCase.mutate()}>
                {addToCase.isPending ? "Importing…" : "Confirm import"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Generate Synthetic Evidence Modal */}
      {genOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Generate Synthetic Evidence
            </h3>
            <p className="text-[11px] text-amber-600">
              This will create synthetic demonstration evidence only. No real forensic data will be
              used.
            </p>
            <label className="block text-xs font-medium text-muted-foreground">
              Target Case Folder
              <select
                value={genCaseId}
                onChange={(e) => setGenCaseId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    📁 {c.case_number} — {c.title}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Evidence Types</span>
                <button
                  type="button"
                  onClick={() =>
                    setGenTypes(
                      genTypes.length === GENERATE_TYPES.length
                        ? []
                        : GENERATE_TYPES.map((t) => t.id),
                    )
                  }
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  {genTypes.length === GENERATE_TYPES.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {GENERATE_TYPES.map((t) => (
                  <label key={t.id} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genTypes.includes(t.id)}
                      onChange={(e) =>
                        setGenTypes((prev) =>
                          e.target.checked ? [...prev, t.id] : prev.filter((x) => x !== t.id),
                        )
                      }
                      className="rounded text-primary focus:ring-primary"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            <label className="block text-xs font-medium text-muted-foreground">
              Number of items (capped)
              <input
                type="number"
                min={1}
                max={50}
                value={genCount}
                onChange={(e) => setGenCount(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGenOpen(false)}
                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => generateOne.mutate(false)}
                className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold hover:bg-muted"
              >
                Generate Selected
              </button>
              <PrimaryButton onClick={() => generateOne.mutate(true)}>
                Generate Complete Demo
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </PageScaffold>
  );
}

function RepoThumb({ item }: { item: RepositoryItem }) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = item.file_type === "image" || (item.mime_type || "").startsWith("image/");
  useEffect(() => {
    if (!isImage) return;
    let active = true;
    let objectUrl: string | undefined;
    void investigationApi
      .previewRepository(item.id, item.mime_type, item.file_type)
      .then((content) => {
        if (!active || content.kind !== "blob" || !content.url) return;
        objectUrl = content.url;
        setUrl(content.url);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item.id, item.mime_type, item.file_type, isImage]);
  if (!isImage || !url) return null;
  return (
    <img
      src={url}
      alt={item.original_name}
      className="h-28 w-full rounded-xl object-cover bg-muted"
    />
  );
}
