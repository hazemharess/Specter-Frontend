import type { VoiceTranscriptEvent } from "@/lib/types";
import { VOICE_SCRIPT } from "@/lib/data/voice";
import { delay, jitter } from "@/lib/api/latency";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

/**
 * Text-to-speech for the voice response. POSTs to the backend ElevenLabs
 * proxy (the API key stays server-side) and returns the mp3 audio Blob for the
 * component to play. Throws on failure so the caller can fall back to browser
 * speechSynthesis.
 *
 * @backend: POST /api/v1/voice/tts { text } → audio/mpeg
 */
export async function synthesize(text: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/v1/voice/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`tts failed: ${res.status}`);
  return res.blob();
}

/**
 * Mock voice session. Yields VoiceTranscriptEvent exactly as a real
 * websocket voice agent (ElevenLabs/Vapi-style) would push them.
 *
 * The generator pauses at `awaitUserTurn` boundaries: the UI calls
 * next() again when the user taps the orb to "speak", which triggers
 * the next canned user turn.
 *
 * @backend: WSS /api/v1/voice/session?threadId=&scope=
 * Client → server: { type:"audio_chunk" } frames + { type:"mute" | "end" }.
 * Server → client: VoiceTranscriptEvent frames (same union as here).
 */
export async function* startSession(): AsyncGenerator<
  VoiceTranscriptEvent,
  void,
  void
> {
  yield { type: "state", state: "idle" };

  for (const turn of VOICE_SCRIPT) {
    // ---- user speaks (word-by-word partials) -------------------------
    yield { type: "state", state: "listening" };
    const userWords = turn.user.split(" ");
    let partial = "";
    for (const w of userWords) {
      partial = partial ? `${partial} ${w}` : w;
      yield { type: "user_partial", text: partial };
      await delay(90 + Math.random() * 90);
    }
    yield { type: "user_final", text: turn.user };

    // ---- assistant thinks (reasoning steps) --------------------------
    yield { type: "state", state: "thinking" };
    for (const step of turn.reasoning) {
      yield { type: "reasoning_step", step };
      await delay(jitter(600));
    }

    // ---- assistant speaks (token stream) ------------------------------
    yield { type: "state", state: "speaking" };
    const words = turn.assistant.split(/(\s+)/);
    for (const w of words) {
      if (!w) continue;
      yield { type: "assistant_token", text: w };
      if (w.trim()) await delay(45 + Math.random() * 45);
    }
    for (const c of turn.citations) {
      yield { type: "citation", citation: c };
    }
    yield {
      type: "assistant_final",
      message: {
        id: `vm-${Date.now()}`,
        threadId: "voice",
        role: "assistant",
        content: turn.assistant,
        reasoningSteps: turn.reasoning,
        citations: turn.citations,
        createdAt: new Date().toISOString(),
      },
    };
    yield { type: "state", state: "idle" };
  }

  yield { type: "session_end" };
}
