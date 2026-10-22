import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  BrainCircuit,
  Sparkles,
  Database,
  ArrowRight,
  ShieldAlert,
  Cpu,
  Share2,
  Layers,
  Search,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { investigationApi } from "@/services/investigationApi";
import { apiMessage } from "@/services/apiClient";
import { EvidenceViewerModal } from "@/components/dashboard/EvidenceViewerModal";
import { CaseIntelligencePanel } from "@/components/dashboard/CaseIntelligencePanel";
import { DynamicRelationshipGraph } from "@/components/dashboard/DynamicRelationshipGraph";
import {
  Badge,
  priorityBadgeClass,
  statusBadgeClass,
  formatLabel,
} from "@/components/dashboard/Badge";
import type { InvestigationCase, EvidenceItem } from "@/services/types";

export function CaseIntelligenceHubPage() {
  const qc = useQueryClient();
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [selectedEvidenceForModal, setSelectedEvidenceForModal] = useState<EvidenceItem | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"intelligence" | "graph">("intelligence");

  // Query all active cases
  const casesQ = useQuery({
    queryKey: ["cases-list-for-ai"],
    queryFn: async () => {
      const res = await investigationApi.listCases({ page: 1, page_size: 50 });
      return res.items || [];
    },
  });
  const cases = useMemo(() => casesQ.data || [], [casesQ.data]);

  // Default to CS-2026-0003 or the first case if none selected
  const activeCase = useMemo(() => {
    if (selectedCaseId) {
      return cases.find((c) => c.id === selectedCaseId) || cases[0];
    }
    const demo = cases.find((c) => c.case_number === "CS-2026-0003");
    return demo || cases[0];
  }, [cases, selectedCaseId]);

  // Seed demonstration case mutation
  const seedDemoMutation = useMutation({
    mutationFn: () => investigationApi.seedSyntheticCase(),
    onSuccess: (res) => {
      toast.success(`Synthetic Demo Case ${res.case_number} loaded successfully!`);
      void qc.invalidateQueries({ queryKey: ["cases-list-for-ai"] });
      void qc.invalidateQueries({ queryKey: ["cases"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      setSelectedCaseId(res.case_id);
    },
    onError: (e) => toast.error(apiMessage(e, "Failed to seed demo case")),
  });

  // Trigger Case Pipeline mutation
  const runPipelineMutation = useMutation({
    mutationFn: (caseId: string) => investigationApi.runCasePipeline(caseId),
    onSuccess: (res) => {
      toast.success(
        `AI Pipeline completed! ${res.correlations_found} correlations, ${res.leads_generated} leads generated.`,
      );
      if (activeCase) {
        void qc.invalidateQueries({ queryKey: ["case-risk", activeCase.id] });
        void qc.invalidateQueries({ queryKey: ["case-correlations", activeCase.id] });
        void qc.invalidateQueries({ queryKey: ["case-graph", activeCase.id] });
        void qc.invalidateQueries({ queryKey: ["case-entities", activeCase.id] });
        void qc.invalidateQueries({ queryKey: ["leads", activeCase.id] });
        void qc.invalidateQueries({ queryKey: ["timeline", activeCase.id] });
        void qc.invalidateQueries({ queryKey: ["evidence", activeCase.id] });
      }
    },
    onError: (e) => toast.error(apiMessage(e, "Pipeline execution failed")),
  });

  // Query evidence for active case to support inspecting evidence directly
  const evidenceQ = useQuery({
    queryKey: ["evidence-for-ai", activeCase?.id],
    queryFn: () => (activeCase ? investigationApi.listEvidence(activeCase.id) : null),
    enabled: !!activeCase?.id,
  });

  const evidenceItems = evidenceQ.data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 text-primary shadow-[0_0_20px_-6px_rgba(59,130,246,0.8)]">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Intelligence</h1>
                <p className="text-xs text-muted-foreground">
                  {activeCase ? activeCase.case_number : "Select a case"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Demo Case Seeder Button */}
            <button
              type="button"
              disabled={seedDemoMutation.isPending}
              onClick={() => seedDemoMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-600 dark:text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm disabled:opacity-50"
            >
              <Database className="h-3.5 w-3.5" />
              {seedDemoMutation.isPending
                ? "Loading Synthetic Case..."
                : "Demo: Load Missing Child Case (CS-2026-0003)"}
            </button>

            {activeCase && (
              <button
                type="button"
                disabled={runPipelineMutation.isPending}
                onClick={() => runPipelineMutation.mutate(activeCase.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {runPipelineMutation.isPending ? "Running Pipeline..." : "Re-run AI Case Pipeline"}
              </button>
            )}
          </div>
        </div>

        {/* Case Selector Dropdown & Quick Stats */}
        <div className="mt-5 pt-4 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-foreground shrink-0 flex items-center gap-1.5">
              <FolderOpen className="h-4 w-4 text-primary" /> Active Investigation Case:
            </label>
            <div className="relative min-w-[280px]">
              <select
                value={activeCase?.id || ""}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none shadow-sm"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} — {c.title} ({c.priority.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeCase && (
            <div className="flex items-center gap-2">
              <Badge className={priorityBadgeClass(activeCase.priority)}>
                {formatLabel(activeCase.priority)}
              </Badge>
              <Badge className={statusBadgeClass(activeCase.status)}>
                {formatLabel(activeCase.status)}
              </Badge>
              <Link
                to="/dashboard/cases/$caseId"
                params={{ caseId: activeCase.id }}
                className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline ml-2"
              >
                Open Full Case Workspace <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Empty State if No Cases Available */}
      {!activeCase && !casesQ.isLoading && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-4">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">No Investigation Cases Found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Load the synthetic demonstration case (CS-2026-0003: Missing Child Investigation) to
            test all automated AI forensic pipelines.
          </p>
          <button
            type="button"
            onClick={() => seedDemoMutation.mutate()}
            disabled={seedDemoMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
          >
            <Sparkles className="h-4 w-4" /> Seed Synthetic Case (CS-2026-0003)
          </button>
        </div>
      )}

      {/* Main Workspace */}
      {activeCase && (
        <div className="space-y-4">
          {/* Sub-navigation: Case Intelligence vs Entity Graph */}
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("intelligence")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "intelligence"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Cpu className="h-3.5 w-3.5" /> Intelligence, Risk & RAG Search
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("graph")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "graph"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Share2 className="h-3.5 w-3.5" /> Interactive Multi-Hop Entity Graph
              </button>
            </div>

            <span className="text-[11px] text-muted-foreground font-mono">
              Case Ref: <strong className="text-primary">{activeCase.case_number}</strong>
            </span>
          </div>

          {activeTab === "intelligence" && (
            <CaseIntelligencePanel
              caseId={activeCase.id}
              caseNumber={activeCase.case_number}
              onOpenEvidence={(evidenceId) => {
                const found = evidenceItems.find((e) => e.id === evidenceId);
                if (found) {
                  setSelectedEvidenceForModal(found);
                } else {
                  toast.info(`Evidence ID ${evidenceId.slice(0, 8)} referenced in analysis.`);
                }
              }}
            />
          )}

          {activeTab === "graph" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-2">
                  <h3 className="text-sm font-bold text-foreground">
                    Cross-Evidence Knowledge Graph
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Correlating phones, IMEI, emails, locations, persons, and digital evidence
                    files.
                  </p>
                </div>
                <DynamicRelationshipGraph caseId={activeCase.id} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Forensic Evidence Viewer Modal */}
      {selectedEvidenceForModal && (
        <EvidenceViewerModal
          evidence={selectedEvidenceForModal}
          onClose={() => setSelectedEvidenceForModal(null)}
        />
      )}
    </div>
  );
}
