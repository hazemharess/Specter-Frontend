"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Case, Citation, Message, Scope } from "@/lib/types";
import { api } from "@/lib/api";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageItem } from "@/components/chat/MessageItem";
import { ScopeChips } from "@/components/chat/ScopeChips";
import { ChatModeChooser } from "@/components/chat/ChatModeChooser";
import {
  LockInfo,
  LockedScopeBanner,
} from "@/components/chat/LockedScopeBanner";
import { SuggestionCards } from "@/components/chat/SuggestionCards";
import { SourcePanel } from "@/components/reader/SourcePanel";
import { VoiceMode } from "@/components/orb/VoiceMode";
import { Spinner } from "@/components/ui";

const DEFAULT_SCOPE: Scope = { type: "all", label: "كل مستندات المكتب" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function caseLockInfo(c: Case): LockInfo {
  return {
    label: c.number,
    sublabel: c.title,
    facts: [
      { label: "الموكل", value: c.client },
      { label: "الخصم", value: c.opponent },
      { label: "المحكمة", value: c.court },
    ],
  };
}

export function ChatView({
  initialScope,
  initialThreadId,
  autoSendText,
  initialLocked,
  initialLockInfo,
}: {
  initialScope?: Scope;
  initialThreadId?: string;
  autoSendText?: string;
  initialLocked?: boolean;
  initialLockInfo?: LockInfo;
}) {
  const [scope, setScope] = useState<Scope>(initialScope ?? DEFAULT_SCOPE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [live, setLive] = useState<Message | null>(null);
  const [working, setWorking] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [loadingThread, setLoadingThread] = useState(!!initialThreadId);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [locked, setLocked] = useState(!!initialLocked);
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(
    initialLockInfo ?? null
  );

  const lockToCase = (c: Case) => {
    setScope({ type: "case", caseId: c.id, label: c.number });
    setLockInfo(caseLockInfo(c));
    setLocked(true);
  };

  const unlock = () => {
    setScope(DEFAULT_SCOPE);
    setLockInfo(null);
    setLocked(false);
  };
  const bottomRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const autoSentRef = useRef(false);

  // reopen an existing conversation (from history / case threads)
  useEffect(() => {
    if (!initialThreadId) return;
    let alive = true;
    api.assistant.getThread(initialThreadId).then((t) => {
      if (!alive) return;
      if (t) {
        setMessages(t.messages);
        setScope(t.scope);
      }
      setLoadingThread(false);
    });
    return () => {
      alive = false;
    };
  }, [initialThreadId]);

  useEffect(() => {
    if (initialScope) setScope(initialScope);
  }, [initialScope]);

  const scrollDown = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  const patchMessage = useCallback((id: string, patch: Partial<Message>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (busyRef.current) return;
      busyRef.current = true;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        threadId: initialThreadId ?? "new",
        role: "user",
        content: text,
        reasoningSteps: [],
        citations: [],
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const draft: Message = {
        id: `a-${Date.now()}`,
        threadId: userMsg.threadId,
        role: "assistant",
        content: "",
        reasoningSteps: [],
        citations: [],
        createdAt: new Date().toISOString(),
      };
      setLive(draft);
      setWorking(true);
      setStreaming(false);
      requestAnimationFrame(scrollDown);

      // route: an executable request gets a recommended plan; anything else is
      // answered normally. LIVE, the assistant stream itself decides (§2/§8).
      const rec = await api.agent.recommend({ content: text, scope });

      if (rec.intent === "plan") {
        let acc = draft;
        for (const step of rec.reasoning) {
          acc = { ...acc, reasoningSteps: [...acc.reasoningSteps, step] };
          setLive({ ...acc });
          requestAnimationFrame(scrollDown);
          await sleep(450);
        }
        const planMsg: Message = {
          ...acc,
          content: rec.lead,
          plan: rec.plan,
          planStatus: "recommended",
          executedStepIds: [],
          activeStepId: null,
          artifacts: [],
        };
        setMessages((prev) => [...prev, planMsg]);
        setLive(null);
        setWorking(false);
        requestAnimationFrame(scrollDown);
        busyRef.current = false;
        return;
      }

      // informational answer — cited streaming Q&A
      let acc = draft;
      for await (const ev of api.assistant.sendMessage({ scope, content: text })) {
        if (ev.type === "reasoning_step") {
          acc = { ...acc, reasoningSteps: [...acc.reasoningSteps, ev.step] };
          setLive(acc);
        } else if (ev.type === "reasoning_done") {
          // collapse happens when the first token lands
        } else if (ev.type === "token") {
          if (!acc.content) {
            setWorking(false);
            setStreaming(true);
          }
          acc = { ...acc, content: acc.content + ev.text };
          setLive(acc);
        } else if (ev.type === "citation") {
          acc = { ...acc, citations: [...acc.citations, ev.citation] };
          setLive(acc);
        } else if (ev.type === "plan") {
          // the live backend can recommend a plan mid-stream instead of prose
          acc = { ...acc, content: ev.lead, plan: ev.plan, planStatus: "recommended" };
          setLive(acc);
        } else if (ev.type === "done") {
          acc = { ...ev.message, id: acc.id, reasoningSteps: acc.reasoningSteps };
          setMessages((prev) => [...prev, acc]);
          setLive(null);
          setWorking(false);
          setStreaming(false);
        }
      }
      busyRef.current = false;
    },
    [scope, initialThreadId]
  );

  // approve a recommended plan → execute it → deliver artifacts, all inline on
  // the assistant message that proposed it
  const approvePlan = useCallback(
    async (msg: Message) => {
      if (!msg.plan) return;
      const plan = msg.plan;
      patchMessage(msg.id, {
        planStatus: "executing",
        executedStepIds: [],
        activeStepId: null,
        artifacts: [],
      });
      requestAnimationFrame(scrollDown);

      for await (const ev of api.agent.executePlan(plan)) {
        if (ev.type === "step_start") {
          patchMessage(msg.id, { activeStepId: ev.stepId });
        } else if (ev.type === "step_done") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id
                ? {
                    ...m,
                    executedStepIds: [...(m.executedStepIds ?? []), ev.stepId],
                    activeStepId: null,
                  }
                : m
            )
          );
          requestAnimationFrame(scrollDown);
        } else if (ev.type === "artifact") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id
                ? { ...m, artifacts: [...(m.artifacts ?? []), ev.artifact] }
                : m
            )
          );
          requestAnimationFrame(scrollDown);
        } else if (ev.type === "done") {
          patchMessage(msg.id, { planStatus: "delivered", activeStepId: null });
          requestAnimationFrame(scrollDown);
        }
      }
    },
    [patchMessage]
  );

  // pre-filled question from a case page / suggestion deep link
  useEffect(() => {
    if (autoSendText && !autoSentRef.current && !loadingThread) {
      autoSentRef.current = true;
      void send(autoSendText);
    }
  }, [autoSendText, loadingThread, send]);

  useEffect(() => {
    if (live) scrollDown();
  }, [live]);

  const handleVoiceEnd = (voiceMessages: Message[]) => {
    setVoiceOpen(false);
    if (voiceMessages.length > 0) {
      setMessages((prev) => [...prev, ...voiceMessages]);
      requestAnimationFrame(scrollDown);
    }
  };

  const empty = messages.length === 0 && !live && !loadingThread;
  const panelOpen = !!activeCitation;

  return (
    <div className="relative min-h-screen">
      {/* chat column compresses when the source panel opens */}
      <div
        className={`transition-[padding] duration-300 ease-out ${
          panelOpen ? "md:pl-[55vw]" : ""
        }`}
      >
        <div className="relative mx-auto flex min-h-screen w-full max-w-[860px] flex-col px-6 max-md:px-4">
          {loadingThread && (
            <div className="flex flex-1 items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          )}

          {empty && (
            <div className="flex flex-1 flex-col justify-center pb-24 pt-16">
              <h1 className="mb-10 text-center text-page font-semibold text-ink">
                بمَ يمكنني مساعدتك؟
              </h1>
              <motion.div layoutId="voice-morph">
                <ChatInput onSend={send} onMic={() => setVoiceOpen(true)} autoFocus />
              </motion.div>
              <div className="mt-4">
                {locked && lockInfo ? (
                  <LockedScopeBanner info={lockInfo} onChange={unlock} />
                ) : (
                  <ChatModeChooser
                    scope={scope}
                    onScopeChange={setScope}
                    onPickCase={lockToCase}
                  />
                )}
              </div>
              {!locked && (
                <div className="mt-12">
                  <SuggestionCards onPick={send} />
                </div>
              )}
            </div>
          )}

          {!empty && !loadingThread && (
            <>
              <div className="flex-1 space-y-8 pb-44 pt-10">
                {messages.map((m) => (
                  <MessageItem
                    key={m.id}
                    message={m}
                    onCitationClick={setActiveCitation}
                    onApprovePlan={approvePlan}
                  />
                ))}
                {live && (
                  <MessageItem
                    message={live}
                    working={working}
                    streaming={streaming}
                    onCitationClick={setActiveCitation}
                  />
                )}
                <div ref={bottomRef} />
              </div>

              {/* docked input */}
              <div
                className={`fixed bottom-0 left-0 z-20 transition-[padding] duration-300 ease-out md:right-16 xl:right-60 max-md:right-0 ${
                  panelOpen ? "md:pl-[55vw]" : ""
                }`}
              >
                <div className="mx-auto w-full max-w-[860px] px-6 pb-5 max-md:px-4">
                  <div className="rounded-card bg-bg/80 pt-2 backdrop-blur">
                    {!voiceOpen && (
                      <motion.div layoutId="voice-morph">
                        <ChatInput
                          onSend={send}
                          onMic={() => setVoiceOpen(true)}
                          disabled={working || streaming}
                        />
                      </motion.div>
                    )}
                    <div className="mt-2.5 flex items-center gap-2">
                      {locked && lockInfo ? (
                        <LockedScopeBanner info={lockInfo} compact />
                      ) : (
                        <ScopeChips scope={scope} onChange={setScope} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <AnimatePresence>
            {voiceOpen && (
              <VoiceMode onEnd={handleVoiceEnd} onCitationClick={setActiveCitation} />
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {activeCitation && (
          <SourcePanel
            citation={activeCitation}
            onClose={() => setActiveCitation(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
