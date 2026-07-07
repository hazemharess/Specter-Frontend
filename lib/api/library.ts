import type {
  DocumentContent,
  LegalDocument,
  LibraryNode,
} from "@/lib/types";
import {
  ALL_DOCUMENTS,
  LIBRARY_DOCUMENTS,
  LIBRARY_TREE,
  getDocumentContent,
} from "@/lib/data/documents";
import { delay, jitter } from "@/lib/api/latency";

// @backend: GET /api/v1/library/tree — Response: LibraryNode[].
export async function tree(): Promise<LibraryNode[]> {
  await delay(jitter(300));
  return LIBRARY_TREE;
}

// @backend: GET /api/v1/library/documents?query=&kind= — Response:
// Paginated<LegalDocument>.
export async function search(
  query: string,
  kind?: string
): Promise<LegalDocument[]> {
  await delay(jitter(300));
  return LIBRARY_DOCUMENTS.filter(
    (d) => (!query || d.name.includes(query)) && (!kind || d.kind === kind)
  );
}

// @backend: GET /api/v1/documents/:id — Response: LegalDocument.
export async function getDocument(id: string): Promise<LegalDocument | null> {
  await delay(jitter(200));
  return ALL_DOCUMENTS.find((d) => d.id === id) ?? null;
}

// @backend: GET /api/v1/documents/:id/content?from=&to= — Response:
// DocumentContent. Real backend returns rendered page images + text layers;
// the mock returns styled text pages. Page payload must include the char
// offsets stored per chunk so citation highlights can be applied client-side.
export async function getContent(id: string): Promise<DocumentContent | null> {
  await delay(jitter(400));
  return getDocumentContent(id);
}
