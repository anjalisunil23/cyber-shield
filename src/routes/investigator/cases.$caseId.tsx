import { createFileRoute } from "@tanstack/react-router";
import { CaseDetailPage } from "@/routes/dashboard/cases.$caseId";

export const Route = createFileRoute("/investigator/cases/$caseId")({ component: CaseDetailPage });
