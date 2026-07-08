import type { AssistantStreamEvent, Scope, Thread } from "@/lib/types";
import { THREADS } from "@/lib/data/conversations";
import { delay, jitter } from "@/lib/api/latency";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

// @backend: GET /api/v1/threads/:id
// Auth: Bearer JWT. Response: Thread (messages included, newest last).
// (Still mock — this demo persists no threads server-side.)
export async function getThread(threadId: string): Promise<Thread | null> {
  await delay(jitter(250));
  return THREADS.find((t) => t.id === threadId) ?? null;
}

// @backend: GET /api/v1/threads?caseId=&page=&pageSize=
// Auth: Bearer JWT. Response: Paginated<Thread> (messages omitted in list).
// (Still mock — see above.)
export async function listThreads(caseId?: string): Promise<Thread[]> {
  await delay(jitter(300));
  return caseId ? THREADS.filter((t) => t.caseId === caseId) : THREADS;
}

/**
 * Minimal SSE parser over a fetch body stream. Yields one block per
 * `\n\n`-separated event, concatenating multi-line `data:` fields. Our backend
 * puts the full AssistantStreamEvent (including `type`) inside `data`, so the
 * caller just JSON.parses it.
 */
async function* parseSSE(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const dataOf = (block: string): string | null => {
    const lines = block.split("\n");
    const data: string[] = [];
    for (const line of lines) {
      if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
    }
    return data.length ? data.join("\n") : null;
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const data = dataOf(block);
        if (data) yield data;
      }
    }
    buffer += decoder.decode();
    const tail = dataOf(buffer.trim());
    if (tail) yield tail;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Streaming send — the REAL SSE adapter. POSTs to the RAG backend and yields
 * typed events in the exact order the UI consumes:
 * reasoning_step* → reasoning_done → token* → citation* → done.
 *
 * @backend: POST /api/v1/assistant/messages (Content-Type: application/json,
 * Accept: text/event-stream). Payload: { threadId?, scope, content }.
 * See docs/BACKEND-INTEGRATION.md §2.
 */
export async function* sendMessage(params: {
  threadId?: string;
  scope: Scope;
  content: string;
}): AsyncGenerator<AssistantStreamEvent> {
  const res = await fetch(`${API_BASE}/api/v1/assistant/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      // TODO(auth): add `Authorization: Bearer <jwt>` here once auth lands.
    },
    body: JSON.stringify(params),
  });

  if (!res.ok || !res.body) {
    throw new Error(
      `assistant stream failed: ${res.status} ${res.statusText}`.trim(),
    );
  }

  for await (const data of parseSSE(res.body)) {
    yield JSON.parse(data) as AssistantStreamEvent;
  }
}
