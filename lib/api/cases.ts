import type { Case, CaseSession, Draft, LegalDocument } from "@/lib/types";
import { CASES, CASE_SESSIONS } from "@/lib/data/cases";
import { CASE_DOCUMENTS } from "@/lib/data/documents";
import { CASE_DRAFTS } from "@/lib/data/workflows";
import { delay, jitter } from "@/lib/api/latency";

// @backend: GET /api/v1/cases?query=&page=&pageSize=
// Auth: Bearer JWT. Response: Paginated<Case>.
export async function list(query?: string): Promise<Case[]> {
  await delay(jitter(350));
  if (!query) return CASES;
  const q = query.trim();
  return CASES.filter(
    (c) =>
      c.title.includes(q) ||
      c.number.includes(q) ||
      c.client.includes(q) ||
      c.opponent.includes(q)
  );
}

// @backend: GET /api/v1/cases/:id — Response: Case.
export async function get(id: string): Promise<Case | null> {
  await delay(jitter(250));
  return CASES.find((c) => c.id === id) ?? null;
}

// @backend: GET /api/v1/cases/:id/documents — Response: Paginated<LegalDocument>.
export async function documents(caseId: string): Promise<LegalDocument[]> {
  await delay(jitter(300));
  return CASE_DOCUMENTS.filter((d) => d.caseId === caseId);
}

// @backend: GET /api/v1/cases/:id/sessions — Response: CaseSession[].
export async function sessions(caseId: string): Promise<CaseSession[]> {
  await delay(jitter(250));
  return CASE_SESSIONS.filter((s) => s.caseId === caseId);
}

// @backend: GET /api/v1/cases/:id/drafts — Response: Paginated<Draft>.
export async function drafts(caseId: string): Promise<Draft[]> {
  await delay(jitter(250));
  return CASE_DRAFTS.filter((d) => d.caseId === caseId);
}
