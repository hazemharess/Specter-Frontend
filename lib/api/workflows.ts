import type { Draft, Workflow } from "@/lib/types";
import {
  WORKFLOWS,
  buildDefenseDraft,
  buildWarningDraft,
} from "@/lib/data/workflows";
import { delay, jitter } from "@/lib/api/latency";

// @backend: GET /api/v1/workflows — Response: Workflow[] (definitions are
// backend-owned; the runner renders whatever steps arrive).
export async function list(): Promise<Workflow[]> {
  await delay(jitter(300));
  return WORKFLOWS;
}

// @backend: GET /api/v1/workflows/:slug — Response: Workflow with steps.
export async function get(slug: string): Promise<Workflow | null> {
  await delay(jitter(250));
  return WORKFLOWS.find((w) => w.slug === slug || w.id === slug) ?? null;
}

// @backend: POST /api/v1/workflows/:id/runs — starts a run; then
// PATCH /api/v1/workflow-runs/:runId/steps/:stepId with collected inputs.
// The final generate step streams like the assistant and resolves to a Draft.
export async function generateDraft(params: {
  workflowId: string;
  caseId: string | null;
  answers: Record<string, string>;
}): Promise<Draft> {
  await delay(2500); // visible "generation" latency by design
  return params.workflowId === "wf-defense"
    ? buildDefenseDraft(params.answers, params.caseId)
    : buildWarningDraft(params.answers, params.caseId);
}

// @backend: POST /api/v1/documents (multipart) — returns { docId } and the
// document then walks the status enum uploading→ocr→indexing→ready via
// GET /api/v1/documents/:id/status polling or a status SSE.
export async function uploadDocument(file: {
  name: string;
}): Promise<{ docId: string; name: string }> {
  await delay(1500); // fake "جارٍ الفهرسة…" window
  return { docId: `upload-${Date.now()}`, name: file.name };
}

// @backend: POST /api/v1/drafts — persists the draft into the case file.
export async function saveDraft(draft: Draft): Promise<{ id: string }> {
  await delay(jitter(500));
  return { id: draft.id };
}
