import type {
  AssistantStreamEvent,
  Citation,
  Message,
  ReasoningStep,
  Scope,
  Thread,
} from "@/lib/types";
import { RESPONSE_POOL, THREADS } from "@/lib/data/conversations";
import { delay, jitter } from "@/lib/api/latency";

let poolCursor = 0;

// @backend: GET /api/v1/threads/:id
// Auth: Bearer JWT. Response: Thread (messages included, newest last).
export async function getThread(threadId: string): Promise<Thread | null> {
  await delay(jitter(250));
  return THREADS.find((t) => t.id === threadId) ?? null;
}

// @backend: GET /api/v1/threads?caseId=&page=&pageSize=
// Auth: Bearer JWT. Response: Paginated<Thread> (messages omitted in list).
export async function listThreads(caseId?: string): Promise<Thread[]> {
  await delay(jitter(300));
  return caseId ? THREADS.filter((t) => t.caseId === caseId) : THREADS;
}

/**
 * Streaming send. Yields typed events in the exact order the real SSE
 * stream will: reasoning_step* → reasoning_done → token* → citation* → done.
 *
 * @backend: POST /api/v1/assistant/messages  (Content-Type: application/json,
 * Accept: text/event-stream). Payload: { threadId?: string, scope: Scope,
 * content: string }. Streams SSE events matching AssistantStreamEvent —
 * see docs/BACKEND-INTEGRATION.md §Streaming protocol.
 */
export async function* sendMessage(params: {
  threadId?: string;
  scope: Scope;
  content: string;
}): AsyncGenerator<AssistantStreamEvent> {
  const pool = RESPONSE_POOL[poolCursor % RESPONSE_POOL.length];
  poolCursor += 1;

  await delay(jitter(500));

  // 1) reasoning steps, staggered like real retrieval
  for (const step of pool.reasoningSteps) {
    yield { type: "reasoning_step", step: step as ReasoningStep };
    await delay(jitter(650));
  }
  yield { type: "reasoning_done", stepCount: pool.reasoningSteps.length };
  await delay(jitter(350));

  // 2) tokens, word by word (20–40ms)
  const words = pool.content.split(/(\s+)/);
  for (const w of words) {
    if (!w) continue;
    yield { type: "token", text: w };
    if (w.trim()) await delay(20 + Math.random() * 20);
  }

  // 3) citations
  for (const c of pool.citations) {
    yield { type: "citation", citation: c as Citation };
    await delay(80);
  }

  // 4) final materialized message
  const message: Message = {
    id: `m-${Date.now()}`,
    threadId: params.threadId ?? `t-${Date.now()}`,
    role: "assistant",
    content: pool.content,
    reasoningSteps: pool.reasoningSteps as ReasoningStep[],
    citations: pool.citations as Citation[],
    isRefusal: pool.isRefusal,
    createdAt: new Date().toISOString(),
  };
  yield { type: "done", message };
}
