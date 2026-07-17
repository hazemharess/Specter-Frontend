import type { Case, CaseDetail, CaseSession, Draft, LegalDocument } from "@/lib/types";
import { CASE_SESSIONS } from "@/lib/data/cases";
import { CASE_DOCUMENTS } from "@/lib/data/documents";
import { CASE_DRAFTS } from "@/lib/data/workflows";
import { delay, jitter } from "@/lib/api/latency";
import {
  BackendCase,
  BackendCaseDetail,
  j,
  toUiCase,
  toUiCaseDetail,
} from "@/lib/api/hermes";

// @backend: GET /api/cases?limit=50 — live from the Hermes DB (Telegram + UI).
// Returns newest-first. `query` filters client-side over the fetched page.
export async function list(query?: string, limit = 50): Promise<Case[]> {
  const raw = await j<BackendCase[]>(`/api/cases?limit=${limit}`);
  const cases = raw.map(toUiCase);
  if (!query) return cases;
  const q = query.trim();
  return cases.filter(
    (c) =>
      c.title.includes(q) ||
      c.number.includes(q) ||
      c.client.includes(q) ||
      (c.caseType ?? "").includes(q)
  );
}

// @backend: GET /api/cases/:id — Case + attachments.
export async function get(id: string): Promise<CaseDetail | null> {
  try {
    const raw = await j<BackendCaseDetail>(`/api/cases/${id}`);
    return toUiCaseDetail(raw);
  } catch {
    return null;
  }
}

// Attachments now come embedded in the case detail; the separate documents
// endpoint isn't part of the Hermes contract yet, so this stays mock-backed
// for any seeded UI cases and returns [] for backend (numeric-id) cases.
// @backend(phase2): GET /api/cases/:id/documents
export async function documents(caseId: string): Promise<LegalDocument[]> {
  await delay(jitter(200));
  return CASE_DOCUMENTS.filter((d) => d.caseId === caseId);
}

// @backend(phase2): GET /api/cases/:id/sessions — not in the Hermes contract yet.
export async function sessions(caseId: string): Promise<CaseSession[]> {
  await delay(jitter(200));
  return CASE_SESSIONS.filter((s) => s.caseId === caseId);
}

// @backend(phase2): GET /api/cases/:id/drafts — not in the Hermes contract yet.
export async function drafts(caseId: string): Promise<Draft[]> {
  await delay(jitter(200));
  return CASE_DRAFTS.filter((d) => d.caseId === caseId);
}
