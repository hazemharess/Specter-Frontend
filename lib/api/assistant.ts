import type { AssistantStreamEvent, Message, Scope, Thread } from "@/lib/types";
import { THREADS } from "@/lib/data/conversations";
import { delay, jitter } from "@/lib/api/latency";
import { chatSessionId, j } from "@/lib/api/hermes";

// @backend: GET /api/v1/threads/:id
// Thread persistence isn't part of the Hermes contract yet (memory lives
// server-side keyed by session_id), so reopening a saved thread stays mock.
export async function getThread(threadId: string): Promise<Thread | null> {
  await delay(jitter(250));
  return THREADS.find((t) => t.id === threadId) ?? null;
}

// @backend: GET /api/v1/threads?caseId= — still mock, see above.
export async function listThreads(caseId?: string): Promise<Thread[]> {
  await delay(jitter(300));
  return caseId ? THREADS.filter((t) => t.caseId === caseId) : THREADS;
}

/**
 * Send a message through Hermes (`POST /api/chat`) and yield the same typed
 * event stream the chat UI consumes. Hermes replies non-streamed for now
 * (fast enough for the pitch — streaming is phase 2), so we surface the whole
 * reply as a single `token` followed by `done`. The generator shape is kept
 * intact so ChatView needs no changes.
 *
 * @backend: POST /api/chat  { message, session_id } -> { reply }
 */
export async function* sendMessage(params: {
  threadId?: string;
  scope: Scope;
  content: string;
}): AsyncGenerator<AssistantStreamEvent> {
  const session_id = chatSessionId();

  const { reply } = await j<{ reply: string }>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message: params.content, session_id }),
  });

  yield { type: "token", text: reply };

  const message: Message = {
    id: `a-${Date.now()}`,
    threadId: params.threadId ?? "new",
    role: "assistant",
    content: reply,
    reasoningSteps: [],
    citations: [],
    createdAt: new Date().toISOString(),
  };

  yield { type: "done", message };
}
