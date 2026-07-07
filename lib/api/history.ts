import type { HistoryEntry } from "@/lib/types";
import { THREADS } from "@/lib/data/conversations";
import { CASES } from "@/lib/data/cases";
import { delay, jitter } from "@/lib/api/latency";

// @backend: GET /api/v1/history?page=&pageSize= — Response:
// Paginated<HistoryEntry>, newest first.
export async function list(): Promise<HistoryEntry[]> {
  await delay(jitter(350));
  return THREADS.map((t) => {
    const c = t.caseId ? CASES.find((x) => x.id === t.caseId) : null;
    return {
      id: `h-${t.id}`,
      threadId: t.id,
      title: t.title,
      preview: t.preview,
      caseId: t.caseId,
      caseLabel: c ? c.number : null,
      updatedAt: t.updatedAt,
    };
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
