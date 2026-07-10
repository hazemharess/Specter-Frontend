/**
 * lib/types.ts — the API contract.
 *
 * These types are written as if they came from the backend spec: every
 * entity carries a stable ID and ISO-8601 timestamps, list endpoints
 * return `Paginated<T>`. The mock layer in /lib/api returns exactly these
 * shapes so the real backend can drop in without component changes.
 * See /docs/BACKEND-INTEGRATION.md.
 */

// ---------------------------------------------------------------- common

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ID = string;

// ---------------------------------------------------------------- cases

export type CaseType = "مدني" | "تجاري" | "عمالي" | "أحوال شخصية";
export type CaseStatus = "متداولة" | "محجوزة للحكم" | "منتهية" | "مؤجلة";

export interface Case {
  id: ID;
  /** e.g. "قضية رقم 4521 لسنة 2026" */
  number: string;
  title: string;
  type: CaseType;
  status: CaseStatus;
  client: string;
  opponent: string;
  court: string;
  /** ISO date of the next session, if any */
  nextSessionDate: string | null;
  documentCount: number;
  /** initials of team members on the case, for the avatar stack */
  team: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseSession {
  id: ID;
  caseId: ID;
  date: string;
  title: string;
  note: string;
  outcome: string | null;
}

// ---------------------------------------------------------------- documents

export type DocumentKind =
  | "صحيفة دعوى"
  | "مذكرة دفاع"
  | "عقد"
  | "إنذار"
  | "توكيل"
  | "حكم"
  | "تقرير خبير"
  | "مستند رسمي"
  | "تشريع"
  | "مبدأ قضائي";

/** Ingestion pipeline status — the UI renders indicators for each state. */
export type DocumentStatus =
  | "uploading"
  | "ocr"
  | "indexing"
  | "ready"
  | "failed";

export interface LegalDocument {
  id: ID;
  name: string;
  kind: DocumentKind;
  status: DocumentStatus;
  pageCount: number;
  caseId: ID | null;
  /** library placement, e.g. ["القانون المدني", "عقود البيع"] */
  libraryPath: string[] | null;
  uploadedAt: string;
  sizeBytes: number;
}

/** A retrievable chunk as the ingestion pipeline stores it. */
export interface Chunk {
  id: ID;
  docId: ID;
  page: number;
  /** char offsets within the page's extracted text */
  startOffset: number;
  endOffset: number;
  text: string;
}

// ---------------------------------------------------------------- assistant

export interface Citation {
  id: ID;
  /** 1-based marker index as shown in the answer: [١] */
  index: number;
  docId: ID;
  docName: string;
  page: number;
  /** the exact passage to highlight in the source panel */
  snippet: string;
  /** optional region on the rendered page (percentages of page box) */
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export type ReasoningStepKind =
  | "analyze"
  | "review_file"
  | "search"
  | "evaluate";

export interface ReasoningStep {
  id: ID;
  kind: ReasoningStepKind;
  label: string;
  /** longer body text shown under the label (Harvey-style) */
  detail?: string;
  /** attached file / source chips rendered inside the step */
  chips?: { label: string; docId?: ID; icon?: "pdf" | "doc" | "search" }[];
}

export type MessageRole = "user" | "assistant";

export interface Message {
  id: ID;
  threadId: ID;
  role: MessageRole;
  /** answer text; citation markers are encoded as [cite:N] inline */
  content: string;
  reasoningSteps: ReasoningStep[];
  citations: Citation[];
  /** true when the answer is an explicit "not found in the sources" */
  isRefusal?: boolean;
  createdAt: string;
}

export type ScopeType = "all" | "case" | "library" | "templates" | "document";

export interface Scope {
  type: ScopeType;
  caseId?: ID;
  docId?: ID;
  /** display label, e.g. "قضية رقم 4521 لسنة 2026" */
  label: string;
}

export interface Thread {
  id: ID;
  title: string;
  preview: string;
  caseId: ID | null;
  scope: Scope;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Streaming events yielded by api.assistant.sendMessage().
 * This IS the SSE protocol — a real EventSource/fetch-stream adapter
 * yields the same discriminated union.
 */
export type AssistantStreamEvent =
  | { type: "reasoning_step"; step: ReasoningStep }
  | { type: "reasoning_done"; stepCount: number }
  | { type: "token"; text: string }
  | { type: "citation"; citation: Citation }
  | { type: "done"; message: Message };

// ---------------------------------------------------------------- workflows

export type WorkflowStepKind =
  | "case_select"
  | "file_upload"
  | "slot_questions"
  | "generate"
  | "draft";

export interface SlotQuestion {
  id: ID;
  /** e.g. "من هو المُنذَر إليه؟" */
  question: string;
  /** slot key filled into the draft, e.g. "recipient_name" */
  slot: string;
  placeholder?: string;
}

export interface WorkflowStep {
  id: ID;
  kind: WorkflowStepKind;
  title: string;
  description: string;
  questions?: SlotQuestion[];
}

export interface Workflow {
  id: ID;
  slug: string;
  title: string;
  description: string;
  icon: string;
  stepCount: number;
  estimatedMinutes: number;
  /** only playable workflows carry their steps; others are placeholders */
  steps: WorkflowStep[] | null;
}

export interface DraftField {
  id: ID;
  /** slot key matching a [[field:key]] placeholder in the draft body */
  key: string;
  value: string;
  sourceType: "user_answer" | "citation";
  citation?: Citation;
}

export interface Draft {
  id: ID;
  workflowId: ID;
  caseId: ID | null;
  title: string;
  /** document body; AI-filled fields appear as [[field:key]] tokens */
  body: string;
  fields: DraftField[];
  createdAt: string;
}

// ---------------------------------------------------------------- library

export interface LibraryNode {
  id: ID;
  label: string;
  children?: LibraryNode[];
  /** leaf nodes point at a document */
  docId?: ID;
}

/** A renderable "page" of a fake PDF: heading lines + body paragraphs. */
export interface DocumentPage {
  page: number;
  header: string;
  paragraphs: string[];
}

export interface DocumentContent {
  docId: ID;
  pages: DocumentPage[];
  tableOfContents: { label: string; page: number }[];
}

// ---------------------------------------------------------------- history

export interface HistoryEntry {
  id: ID;
  threadId: ID;
  title: string;
  preview: string;
  caseId: ID | null;
  caseLabel: string | null;
  updatedAt: string;
}

// ---------------------------------------------------------------- voice

export type VoiceTranscriptEvent =
  | { type: "state"; state: "idle" | "listening" | "thinking" | "speaking" }
  | { type: "user_partial"; text: string }
  | { type: "user_final"; text: string }
  | { type: "assistant_token"; text: string }
  | { type: "reasoning_step"; step: ReasoningStep }
  | { type: "citation"; citation: Citation }
  | { type: "assistant_final"; message: Message }
  | { type: "session_end" };
