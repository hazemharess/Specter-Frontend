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
  /** answer text; citation markers are encoded as [cite:N] inline. For a plan
   *  recommendation this is the short lead ("يمكنني تنفيذ ذلك…"). */
  content: string;
  reasoningSteps: ReasoningStep[];
  citations: Citation[];
  /** true when the answer is an explicit "not found in the sources" */
  isRefusal?: boolean;
  createdAt: string;

  // --- agentic (present only when the assistant recommends an executable
  //     plan instead of a plain answer; see the agent section below) ---
  /** the recommended plan, rendered as a plan card on this message */
  plan?: Plan;
  /** lifecycle of that plan within the conversation */
  planStatus?: PlanStatus;
  /** ids of steps that have finished executing (drives the timeline) */
  executedStepIds?: ID[];
  /** the step currently running, if any */
  activeStepId?: ID | null;
  /** deliverables produced once execution completes */
  artifacts?: Artifact[];
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
  // emitted INSTEAD OF tokens when the model decides the request is executable:
  // the answer is a recommended plan, not prose. `lead` is the short intro
  // shown above the plan card. Approval then triggers api.agent.executePlan.
  | { type: "plan"; lead: string; plan: Plan }
  | { type: "done"; message: Message };

// ---------------------------------------------------------------- agent
// The plan → approve → execute → deliver loop. Same discriminated-union SSE
// pattern as the assistant: the mock layer and a real Hermes backend yield the
// identical shapes. See lib/api/agent.ts and docs/BACKEND-INTEGRATION.md.

export type AgentTool =
  | "rag_search"
  | "case_lookup"
  | "document_extract"
  | "draft"
  | "summarize";

export interface PlanStep {
  id: ID;
  title: string;
  description?: string;
  tool?: AgentTool;
  /** human label for the tool chip, e.g. "المكتبة القانونية" */
  toolLabel?: string;
  /** rough duration; paces the execution animation only */
  estimatedSeconds?: number;
}

export type ArtifactKind = "task_list" | "case_summary" | "timeline" | "memo";

export interface Plan {
  id: ID;
  title: string;
  goal: string;
  /** the firm skill this plan is drawn from — the assistant's "mind"; shown on
   *  the card so the lawyer sees which capability was matched */
  capability?: string;
  steps: PlanStep[];
  expectedArtifacts: ArtifactKind[];
}

/** Lifecycle of a recommended plan inside a conversation. */
export type PlanStatus = "recommended" | "executing" | "delivered";

export interface PlanRequest {
  content: string;
  scope: Scope;
}

/**
 * The assistant's routing decision for one message. Informational questions
 * are answered normally (see AssistantStreamEvent); an executable request is
 * met with a recommended plan the lawyer approves before anything runs.
 *
 * TONIGHT this is decided client-side by keyword. LIVE, the model decides and
 * the assistant stream simply emits a `plan` event instead of tokens (§2/§8).
 */
export type AgentRecommendation =
  | { intent: "answer" }
  | { intent: "plan"; lead: string; reasoning: ReasoningStep[]; plan: Plan };

// --- artifacts (real work product the agent delivers) ---

export type TaskStatus = "done" | "review" | "pending" | "blocked";
export type TaskAssignee = "lawyer" | "client";

export interface TaskItem {
  id: ID;
  title: string;
  status: TaskStatus;
  assignee: TaskAssignee;
  assigneeName?: string;
}

export interface TaskListArtifactData {
  kind: "task_list";
  id: ID;
  title: string;
  tasks: TaskItem[];
}

export interface CaseSummaryArtifactData {
  kind: "case_summary";
  id: ID;
  title: string;
  /** short lead paragraph */
  summary: string;
  facts: { label: string; value: string }[];
  /** header meta, e.g. "٤ صفحات · ١٢ استشهاد" */
  meta?: string;
  sections?: { heading: string; body: string }[];
}

export type Artifact = TaskListArtifactData | CaseSummaryArtifactData;

/**
 * Streaming events yielded by api.agent.executePlan(): each step starts and
 * completes, then artifacts are delivered, then done.
 */
export type PlanExecutionEvent =
  | { type: "step_start"; stepId: ID }
  | { type: "step_done"; stepId: ID }
  | { type: "artifact"; artifact: Artifact }
  | { type: "done" };

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
