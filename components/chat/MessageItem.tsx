"use client";

import { Info } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { Citation, Message } from "@/lib/types";
import { MessageContent, toArabicDigits } from "@/components/chat/MessageContent";
import { ReasoningSteps } from "@/components/chat/ReasoningSteps";
import { PlanCard } from "@/components/agent/PlanCard";
import { ExecutionTimeline } from "@/components/agent/ExecutionTimeline";
import { TaskListArtifact } from "@/components/agent/TaskListArtifact";
import { CaseSummaryArtifact } from "@/components/agent/CaseSummaryArtifact";

/** Pull the article number out of a citation snippet ("مادة N …") for display. */
function articleLabel(snippet: string): string | null {
  const m = snippet.match(/مادة\s+(\d+)/);
  return m ? `مادة ${toArabicDigits(Number(m[1]))}` : null;
}

export function SourcesRow({
  citations,
  onCitationClick,
}: {
  citations: Citation[];
  onCitationClick: (c: Citation) => void;
}) {
  if (citations.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="mb-2 text-label font-medium text-ink-3">المصادر</p>
      <div className="flex flex-wrap gap-2">
        {citations.map((c) => {
          const article = articleLabel(c.snippet);
          return (
            <button
              key={c.id + c.index}
              onClick={() => onCitationClick(c)}
              className="inline-flex items-center gap-2 rounded-pill border border-gold/60 bg-surface px-3 py-1.5 text-label text-ink transition-colors duration-150 hover:bg-[var(--gold-soft)]"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gold-soft)] text-[11px] font-semibold text-gold">
                {toArabicDigits(c.index)}
              </span>
              <span className="min-w-0 truncate">{c.docName}</span>
              {article && <span className="text-ink-3">· {article}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MessageItem({
  message,
  streaming,
  working,
  onCitationClick,
  onApprovePlan,
}: {
  message: Message;
  /** true while this assistant message's tokens are still arriving */
  streaming?: boolean;
  /** true while reasoning steps are still arriving (before first token) */
  working?: boolean;
  onCitationClick: (c: Citation) => void;
  /** approve the plan this message recommends (agentic flow) */
  onApprovePlan?: (message: Message) => void;
}) {
  const reduce = useReducedMotion();

  if (message.role === "user") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-card bg-accent-soft px-4 py-3 text-body leading-[1.7] text-ink">
          {message.content}
        </div>
      </div>
    );
  }

  const planStatus = message.planStatus ?? "recommended";

  return (
    <div>
      <ReasoningSteps
        steps={message.reasoningSteps}
        working={!!working}
        collapsed={!working}
      />
      {message.isRefusal && message.content && (
        <div className="mb-3 flex items-center gap-2 text-label text-ink-2">
          <Info className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.5} />
          لم يُعثر على إجابة قاطعة في المصادر المتاحة
        </div>
      )}
      {message.content && (
        <MessageContent
          content={message.content}
          citations={message.citations}
          onCitationClick={onCitationClick}
        />
      )}

      {/* recommended plan → approve → execute → deliver, inline on the message */}
      {message.plan && (
        <div className="mt-4 space-y-4">
          {planStatus === "recommended" ? (
            <PlanCard plan={message.plan} onApprove={() => onApprovePlan?.(message)} />
          ) : (
            <>
              <ExecutionTimeline
                plan={message.plan}
                executedStepIds={message.executedStepIds ?? []}
                activeStepId={message.activeStepId ?? null}
                done={planStatus === "delivered"}
              />
              {(message.artifacts ?? []).map((artifact) => (
                <motion.div
                  key={artifact.id}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  {artifact.kind === "task_list" ? (
                    <TaskListArtifact data={artifact} />
                  ) : (
                    <CaseSummaryArtifact data={artifact} />
                  )}
                </motion.div>
              ))}
            </>
          )}
        </div>
      )}

      {!streaming && !working && !message.plan && (
        <SourcesRow citations={message.citations} onCitationClick={onCitationClick} />
      )}
    </div>
  );
}
