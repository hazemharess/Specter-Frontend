"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Keyboard, MicOff, Mic, X } from "lucide-react";
import type { Citation, Message, ReasoningStep, Scope } from "@/lib/types";
import { api } from "@/lib/api";
import { OrbState, VoiceOrb } from "@/components/orb/VoiceOrb";
import { ReasoningSteps } from "@/components/chat/ReasoningSteps";
import { MessageContent } from "@/components/chat/MessageContent";
import { SourcesRow } from "@/components/chat/MessageItem";

interface TranscriptTurn {
  role: "user" | "assistant";
  text: string;
  final: boolean;
  reasoning: ReasoningStep[];
  citations: Citation[];
}

/** Voice always asks over the full corpus, same as the default text scope. */
const VOICE_SCOPE: Scope = { type: "all", label: "كل المصادر" };

/**
 * ▶ VOICE SPEED KNOB — playback rate for the spoken answer.
 * 1.0 = normal, 1.15 = ~15% faster, 1.3 = noticeably fast. Sane range 0.8–1.5.
 * The on-screen dictation is slaved to audio time, so it speeds up in lockstep —
 * change this one number and BOTH the voice and the text reveal follow.
 * Overridable at runtime via NEXT_PUBLIC_VOICE_SPEED without editing code.
 */
const VOICE_SPEED = Number(process.env.NEXT_PUBLIC_VOICE_SPEED) || 1.20;

/** Immutable update of the last assistant turn. */
function updateLastAssistant(
  prev: TranscriptTurn[],
  fn: (a: TranscriptTurn) => TranscriptTurn,
): TranscriptTurn[] {
  const next = [...prev];
  const last = next[next.length - 1];
  if (last && last.role === "assistant") next[next.length - 1] = fn(last);
  return next;
}

/**
 * Full voice session UI: orb + live transcript + controls.
 *
 * Real browser-native voice: the mic is captured with the SpeechRecognition
 * API (ar-EG), the recognised utterance is sent through the SAME real
 * `api.assistant.sendMessage` SSE path as text chat, and the answer is spoken
 * back with speechSynthesis. Orb states: listening → thinking → speaking → idle.
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
  const [supported, setSupported] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const pendingUserRef = useRef("");
  const busyRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  // ---- transcript helpers -------------------------------------------------
  const updateUserPartial = useCallback((text: string) => {
    setTurns((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last && last.role === "user" && !last.final) {
        next[next.length - 1] = { ...last, text };
      } else {
        next.push({ role: "user", text, final: false, reasoning: [], citations: [] });
      }
      return next;
    });
  }, []);

  const finalizeUser = useCallback((text: string) => {
    setTurns((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last && last.role === "user") {
        next[next.length - 1] = { ...last, text, final: true };
      } else {
        next.push({ role: "user", text, final: true, reasoning: [], citations: [] });
      }
      return next;
    });
  }, []);

  // ---- speaking + dictation -----------------------------------------------
  const goIdle = useCallback(() => {
    setOrbState("idle");
    setAwaitingTap(true);
  }, []);

  /** Reveal the answer up to `frac` (0..1) of its words — the "dictation". */
  const revealTo = useCallback((words: string[], frac: number) => {
    const show = Math.max(1, Math.ceil(Math.min(1, Math.max(0, frac)) * words.length));
    setTurns((prev) =>
      updateLastAssistant(prev, (a) => ({ ...a, text: words.slice(0, show).join(" ") })),
    );
  }, []);

  /** Fallback voice: browser speechSynthesis (only if ElevenLabs is down). */
  const fallbackSpeak = useCallback(
    (content: string, words: string[]) => {
      const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
      const ttsText = content.replace(/\[cite:\d+\]/g, "").trim();
      const finish = () => {
        setTurns((prev) =>
          updateLastAssistant(prev, (a) => ({ ...a, text: content, final: true })),
        );
        goIdle();
      };
      if (!synth || !ttsText) {
        finish();
        return;
      }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(ttsText);
      const arVoice = synth
        .getVoices()
        .find((v) => v.lang?.toLowerCase().startsWith("ar"));
      u.lang = arVoice?.lang || "ar-EG";
      if (arVoice) u.voice = arVoice;
      u.rate = VOICE_SPEED; // match the ElevenLabs playback speed knob
      u.onstart = () => {
        setOrbState("speaking");
        // browser word-boundary timing is unreliable → reveal in full
        revealTo(words, 1);
      };
      u.onend = finish;
      u.onerror = finish;
      synth.speak(u);
    },
    [goIdle, revealTo],
  );

  /**
   * Primary: fetch the ElevenLabs audio, then reveal the text word-by-word in
   * sync with playback so the voice appears to dictate it. The orb stays on
   * "thinking" (looping) until the audio actually starts.
   */
  const speakAndDictate = useCallback(
    async (content: string, citations: Citation[]) => {
      const words = content.trim().split(/\s+/).filter(Boolean);
      // Bind citations up front so [cite:N] markers resolve as they surface.
      setTurns((prev) =>
        updateLastAssistant(prev, (a) => ({ ...a, citations, text: "" })),
      );
      if (words.length === 0) {
        goIdle();
        return;
      }

      const ttsText = content.replace(/\[cite:\d+\]/g, "").trim();
      try {
        const blob = await api.voice.synthesize(ttsText);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        // Speed up playback; keep pitch natural. Dictation follows via ontimeupdate.
        audio.playbackRate = VOICE_SPEED;
        (audio as any).preservesPitch = true;
        audio.onplay = () => setOrbState("speaking");
        audio.ontimeupdate = () => {
          const d = audio.duration;
          if (d && isFinite(d)) revealTo(words, audio.currentTime / d);
        };
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setTurns((prev) =>
            updateLastAssistant(prev, (a) => ({ ...a, text: content, final: true })),
          );
          goIdle();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          fallbackSpeak(content, words);
        };
        await audio.play();
      } catch {
        // key missing / server down / autoplay blocked → browser TTS
        fallbackSpeak(content, words);
      }
    },
    [goIdle, revealTo, fallbackSpeak],
  );

  // ---- ask the real assistant (shared path with text chat) ----------------
  const answer = useCallback(
    async (userText: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setOrbState("thinking");
      // Orb loops on "thinking"; the ANSWER stays hidden until the voice speaks.
      setTurns((prev) => [
        ...prev,
        { role: "assistant", text: "", final: false, reasoning: [], citations: [] },
      ]);

      let finalMsg: Message | null = null;
      try {
        for await (const ev of api.assistant.sendMessage({
          scope: VOICE_SCOPE,
          content: userText,
        })) {
          if (ev.type === "reasoning_step") {
            setTurns((prev) =>
              updateLastAssistant(prev, (a) => ({
                ...a,
                reasoning: [...a.reasoning, ev.step],
              })),
            );
          } else if (ev.type === "done") {
            finalMsg = ev.message;
          }
          // tokens & citations are intentionally NOT displayed while generating;
          // the answer is dictated in sync with the voice below.
        }
      } catch {
        setTurns((prev) =>
          updateLastAssistant(prev, (a) => ({
            ...a,
            text: "تعذّر الاتصال بالخادم. تأكد من تشغيل الخدمة الخلفية.",
            final: true,
          })),
        );
        busyRef.current = false;
        goIdle();
        return;
      }

      busyRef.current = false;
      const msg = finalMsg;
      if (!msg || !msg.content) {
        goIdle();
        return;
      }
      setTurns((prev) =>
        updateLastAssistant(prev, (a) => ({
          ...a,
          reasoning: msg.reasoningSteps ?? a.reasoning,
        })),
      );
      await speakAndDictate(msg.content, msg.citations ?? []);
    },
    [goIdle, speakAndDictate],
  );

  // ---- mic capture (SpeechRecognition) ------------------------------------
  useEffect(() => {
    const SR =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SR) {
      setSupported(false);
      setAwaitingTap(false);
      setNotice(
        "التعرّف على الصوت غير مدعوم في هذا المتصفح. استخدم Chrome، أو عُد إلى الكتابة.",
      );
      return;
    }

    // Warm the voice list (Chrome populates it asynchronously).
    window.speechSynthesis?.getVoices();

    const rec = new SR();
    rec.lang = "ar-EG";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      let interim = "";
      let finalTxt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTxt += t;
        else interim += t;
      }
      if (finalTxt) pendingUserRef.current = finalTxt.trim();
      updateUserPartial((finalTxt || interim).trim());
    };

    rec.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setNotice("لم يُمنح إذن الميكروفون. اسمح بالوصول إليه ثم أعد المحاولة.");
      } else if (e.error === "no-speech") {
        setNotice("لم يُلتقط أي كلام. اضغط على الكرة وتحدّث.");
      }
      setOrbState("idle");
      setAwaitingTap(true);
    };

    rec.onend = () => {
      const text = pendingUserRef.current.trim();
      pendingUserRef.current = "";
      if (text) {
        finalizeUser(text);
        void answer(text);
      } else {
        setOrbState("idle");
        setAwaitingTap(true);
      }
    };

    recognitionRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        /* not started */
      }
      audioRef.current?.pause();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, [updateUserPartial, finalizeUser, answer]);

  // ---- controls -----------------------------------------------------------
  const handleOrbTap = () => {
    if (ended || !supported || busyRef.current || !awaitingTap) return;
    if (muted) {
      setNotice("الميكروفون مكتوم. ألغِ الكتم للتحدث.");
      return;
    }
    setNotice(null);
    pendingUserRef.current = "";
    setAwaitingTap(false);
    setOrbState("listening");
    try {
      recognitionRef.current?.start();
    } catch {
      /* already running */
    }
  };

  const toggleMute = () =>
    setMuted((v) => {
      const next = !v;
      if (next) {
        try {
          recognitionRef.current?.stop();
        } catch {
          /* not started */
        }
      }
      return next;
    });

  const finish = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* not started */
    }
    audioRef.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
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
            : !supported
              ? "الوضع الصوتي غير مدعوم في هذا المتصفح"
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
        {notice && (
          <p className="max-w-[340px] text-center text-label text-danger">{notice}</p>
        )}
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
                {t.final && (
                  <SourcesRow citations={t.citations} onCitationClick={onCitationClick} />
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
          onClick={toggleMute}
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
