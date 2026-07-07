"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Keyboard, MicOff, Mic, X } from "lucide-react";
import type { Citation, Message, ReasoningStep, VoiceTranscriptEvent } from "@/lib/types";
import { api } from "@/lib/api";
import { OrbState, VoiceOrb } from "@/components/orb/VoiceOrb";
import { ReasoningSteps } from "@/components/chat/ReasoningSteps";
import { MessageContent } from "@/components/chat/MessageContent";

interface TranscriptTurn {
  role: "user" | "assistant";
  text: string;
  final: boolean;
  reasoning: ReasoningStep[];
  citations: Citation[];
}

/**
 * Full voice session UI: orb + live transcript + controls.
 * Pull-based consumption of the mock voice generator lets the UI pause at
 * "listening" boundaries until the user taps the orb to "speak" —
 * the same pacing hooks a real websocket session would expose.
 */
export function VoiceMode({
  onEnd,
  onCitationClick,
}: {
  /** transcript is dropped into the chat thread as normal messages */
  onEnd: (messages: Message[]) => void;
  onCitationClick: (c: Citation) => void;
}) {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [awaitingTap, setAwaitingTap] = useState(true);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const genRef = useRef<AsyncGenerator<VoiceTranscriptEvent> | null>(null);
  const pumpingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    genRef.current = api.voice.startSession();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  const pump = useCallback(async () => {
    if (pumpingRef.current || !genRef.current) return;
    pumpingRef.current = true;
    let sawListening = false;
    while (true) {
      const { value, done } = await genRef.current.next();
      if (done || !value) break;
      const ev = value;
      if (ev.type === "state") {
        setOrbState(ev.state);
        if (ev.state === "listening") {
          if (sawListening) continue;
          sawListening = true;
          continue;
        }
      } else if (ev.type === "user_partial") {
        setTurns((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "user" && !last.final) {
            next[next.length - 1] = { ...last, text: ev.text };
          } else {
            next.push({ role: "user", text: ev.text, final: false, reasoning: [], citations: [] });
          }
          return next;
        });
      } else if (ev.type === "user_final") {
        setTurns((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "user") {
            next[next.length - 1] = { ...last, text: ev.text, final: true };
          }
          return next;
        });
      } else if (ev.type === "reasoning_step") {
        setTurns((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant" && !last.final) {
            next[next.length - 1] = { ...last, reasoning: [...last.reasoning, ev.step] };
          } else {
            next.push({ role: "assistant", text: "", final: false, reasoning: [ev.step], citations: [] });
          }
          return next;
        });
      } else if (ev.type === "assistant_token") {
        setTurns((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant" && !last.final) {
            next[next.length - 1] = { ...last, text: last.text + ev.text };
          } else {
            next.push({ role: "assistant", text: ev.text, final: false, reasoning: [], citations: [] });
          }
          return next;
        });
      } else if (ev.type === "citation") {
        setTurns((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = { ...last, citations: [...last.citations, ev.citation] };
          }
          return next;
        });
      } else if (ev.type === "assistant_final") {
        setTurns((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = { ...last, final: true };
          }
          return next;
        });
        // assistant finished — pause until the user taps to speak again
        setAwaitingTap(true);
        break;
      } else if (ev.type === "session_end") {
        setEnded(true);
        setOrbState("idle");
        break;
      }
    }
    pumpingRef.current = false;
  }, []);

  const handleOrbTap = () => {
    if (!awaitingTap || ended) return;
    setAwaitingTap(false);
    void pump();
  };

  const finish = () => {
    const messages: Message[] = turns
      .filter((t) => t.final)
      .map((t, i) => ({
        id: `voice-m-${Date.now()}-${i}`,
        threadId: "voice",
        role: t.role,
        content: t.text,
        reasoningSteps: t.reasoning,
        citations: t.citations,
        createdAt: new Date().toISOString(),
      }));
    onEnd(messages);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turns]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-30 flex flex-col items-center bg-bg"
      role="dialog"
      aria-label="الوضع الصوتي"
    >
      {/* orb rises to top-center */}
      <motion.div layoutId="voice-morph" className="mt-12 flex flex-col items-center gap-3">
        <VoiceOrb state={awaitingTap && !ended ? "idle" : orbState} onClick={handleOrbTap} />
        <p className="text-label text-ink-3" aria-live="polite">
          {ended
            ? "انتهت الجلسة الصوتية"
            : awaitingTap
              ? "اضغط على الكرة للتحدث"
              : orbState === "listening"
                ? "جارٍ الاستماع…"
                : orbState === "thinking"
                  ? "جارٍ التفكير…"
                  : orbState === "speaking"
                    ? "جارٍ التحدث…"
                    : ""}
        </p>
      </motion.div>

      {/* live transcript */}
      <div className="mt-6 w-full max-w-[720px] flex-1 overflow-y-auto px-6 pb-32">
        <div className="space-y-6">
          {turns.map((t, i) =>
            t.role === "user" ? (
              <div key={i} className="flex justify-start">
                <p className="max-w-[85%] rounded-card bg-accent-soft px-4 py-2.5 text-body leading-[1.7] text-ink">
                  {t.text}
                </p>
              </div>
            ) : (
              <div key={i}>
                {t.reasoning.length > 0 && (
                  <ReasoningSteps
                    steps={t.reasoning}
                    working={!t.final && t.text.length === 0}
                    collapsed={t.text.length > 0}
                  />
                )}
                {t.text && (
                  <div className="text-ink-2">
                    <MessageContent
                      content={t.text}
                      citations={t.citations}
                      onCitationClick={onCitationClick}
                    />
                  </div>
                )}
              </div>
            )
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* controls */}
      <div className="absolute bottom-8 flex items-center gap-3">
        <button
          onClick={() => setMuted((v) => !v)}
          aria-label={muted ? "إلغاء كتم الميكروفون" : "كتم الميكروفون"}
          aria-pressed={muted}
          className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-150 ${
            muted
              ? "border-danger/40 bg-danger/10 text-danger"
              : "border-line bg-surface text-ink-2 hover:bg-accent-soft/40"
          }`}
        >
          {muted ? (
            <MicOff className="h-[18px] w-[18px]" strokeWidth={1.5} />
          ) : (
            <Mic className="h-[18px] w-[18px]" strokeWidth={1.5} />
          )}
        </button>
        <button
          onClick={finish}
          aria-label="العودة إلى الكتابة"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40"
        >
          <Keyboard className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>
        <button
          onClick={finish}
          aria-label="إنهاء الجلسة الصوتية"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white transition-colors duration-150 hover:bg-[#16302b]"
        >
          <X className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>
      </div>
    </motion.div>
  );
}
