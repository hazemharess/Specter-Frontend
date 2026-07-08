import type {
  DocumentContent,
  LegalDocument,
  LibraryNode,
} from "@/lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

// @backend: GET /api/v1/library/tree — Response: LibraryNode[].
// Real data: laws from dataflare/egypt-legal-corpus, grouped by category.
export async function tree(): Promise<LibraryNode[]> {
  const res = await fetch(`${API_BASE}/api/v1/library/tree`);
  return res.ok ? ((await res.json()) as LibraryNode[]) : [];
}

// @backend: GET /api/v1/library/documents?query=&kind= — Response:
// Paginated<LegalDocument> (this demo returns a bare array).
export async function search(
  query: string,
  kind?: string,
): Promise<LegalDocument[]> {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (kind) params.set("kind", kind);
  const res = await fetch(`${API_BASE}/api/v1/library/documents?${params}`);
  return res.ok ? ((await res.json()) as LegalDocument[]) : [];
}

// @backend: GET /api/v1/documents/:id — Response: LegalDocument.
export async function getDocument(id: string): Promise<LegalDocument | null> {
  const res = await fetch(`${API_BASE}/api/v1/documents/${encodeURIComponent(id)}`);
  return res.ok ? ((await res.json()) as LegalDocument | null) : null;
}

// @backend: GET /api/v1/documents/:id/content — Response: DocumentContent.
// One continuous page: paragraphs are the law's articles (مادة N).
export async function getContent(id: string): Promise<DocumentContent | null> {
  const res = await fetch(
    `${API_BASE}/api/v1/documents/${encodeURIComponent(id)}/content`,
  );
  return res.ok ? ((await res.json()) as DocumentContent | null) : null;
}
