import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit } from "lucide-react";

export const Route = createFileRoute("/dashboard/ai-analysis")({
  component: AiPlaceholderPage,
});

function AiPlaceholderPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-dashed border-border bg-card/60 px-8 py-16 text-center shadow-sm">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
        <BrainCircuit className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">AI Analysis — Phase 2</h1>
      <p className="text-sm text-muted-foreground">
        OCR, speech transcription, entity extraction, object/face detection, embeddings, risk
        scoring, and knowledge-graph linking are intentionally not implemented yet. Evidence records
        already reserve fields for these outputs so modules can plug in without changing the core
        platform.
      </p>
    </div>
  );
}
