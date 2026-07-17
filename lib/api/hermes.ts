/**
 * lib/api/hermes.ts — the low-level adapter to the Hermes backend.
 *
 * Everything backend-specific lives here: the base URL, the typed fetch
 * helper, the raw wire types the FastAPI/SQLite backend returns, and the
 * mappers that turn those into the UI's domain types (lib/types.ts). The
 * modules in this folder (cases.ts, assistant.ts) call into this and expose
 * the same signatures the components already consume, so wiring the real
 * backend never reaches the UI layer.
 *
 * See FRONTEND-HERMES-INTEGRATION.md.
 */
import type { Case, CaseDetail } from "@/lib/types";

/** Prefer the Hermes base; fall back to the legacy var, then localhost:8000. */
export const HERMES_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

export const POLL_INTERVAL_MS = Number(
  process.env.NEXT_PUBLIC_POLL_INTERVAL_MS || 5000
);

/** Typed JSON fetch. Throws on non-2xx so callers can surface a soft error. */
export async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${HERMES_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json() as Promise<T>;
}

/** Stable per-session id so Hermes keeps conversational memory continuous. */
export function chatSessionId(): string {
  if (typeof window === "undefined") return "server";
  const existing = sessionStorage.getItem("chat_session");
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem("chat_session", id);
  return id;
}

// ---------------------------------------------------------------- wire types

export type BackendCase = {
  id: number;
  client_name: string;
  case_type: string | null;
  description: string | null;
  priority: "normal" | "urgent" | "high";
  status: "open" | "in_progress" | "closed";
  assigned_lawyer: string | null;
  source: "telegram" | "ui";
  created_at: string;
  updated_at: string;
};

export type BackendAttachment = {
  id: number;
  case_id?: number;
  filename: string;
  mime_type: string | null;
  uploaded_at: string;
};

export type BackendCaseDetail = BackendCase & {
  attachments: BackendAttachment[];
};

// ------------------------------------------------------------------- mappers

/** Map the backend status enum onto the UI's Arabic status labels. */
function mapStatus(s: BackendCase["status"]): Case["status"] {
  switch (s) {
    case "closed":
      return "منتهية";
    case "in_progress":
    case "open":
    default:
      return "متداولة";
  }
}

/** The UI's `type` is a strict Arabic union used for badge tones; if the
 *  backend's free-text case_type doesn't map, default to مدني and keep the
 *  raw value on `caseType` so the UI can still show it verbatim. */
function mapType(t: string | null): Case["type"] {
  switch ((t ?? "").toLowerCase()) {
    case "commercial":
    case "تجاري":
      return "تجاري";
    case "labor":
    case "labour":
    case "عمالي":
      return "عمالي";
    case "family":
    case "divorce":
    case "أحوال شخصية":
      return "أحوال شخصية";
    default:
      return "مدني";
  }
}

/** Initials for the avatar stack from an assigned lawyer name. */
function initials(name: string | null): string[] {
  if (!name) return [];
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return [parts.map((p) => p[0]).join("")];
}

/** BackendCase -> the rich UI Case, filling every field so existing
 *  components render without changes. Backend-only fields (source,
 *  priority, raw type, lawyer) ride along as optionals. */
export function toUiCase(b: BackendCase): Case {
  return {
    id: String(b.id),
    number: `قضية #${b.id}`,
    title: (b.description || "").trim() || b.client_name,
    type: mapType(b.case_type),
    status: mapStatus(b.status),
    client: b.client_name,
    opponent: "—",
    court: "—",
    nextSessionDate: null,
    documentCount: 0,
    team: initials(b.assigned_lawyer),
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    // backend-only, surfaced by the sidebar/detail:
    source: b.source,
    priority: b.priority,
    caseType: b.case_type,
    assignedLawyer: b.assigned_lawyer,
  };
}

export function toUiCaseDetail(b: BackendCaseDetail): CaseDetail {
  return {
    ...toUiCase(b),
    documentCount: b.attachments?.length ?? 0,
    attachments: (b.attachments ?? []).map((a) => ({
      id: String(a.id),
      filename: a.filename,
      mimeType: a.mime_type,
      uploadedAt: a.uploaded_at,
    })),
  };
}
