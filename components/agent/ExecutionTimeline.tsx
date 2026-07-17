"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import type { Plan } from "@/lib/types";
import { toArabicDigits } from "@/components/chat/MessageContent";

/**
 * Steps tick off after approval. The spinner → check pop is the earned "wow";
 * pacing lives in api.agent.executePlan (~500-750ms/step). Nothing decorative.
 */
export function ExecutionTimeline({
  plan,
  executedStepIds,
  activeStepId,
  done,
}: {
  plan: Plan;
  executedStepIds: string[];
  activeStepId: string | null;
  done: boolean;
}) {
  const reduce = useReducedMotion();
  const executedCount = executedStepIds.length;

  return (
    <div className="rounded-panel border border-line bg-surface shadow-raised">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2.5 text-body font-medium text-ink">
          {done ? (
            <>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-status-done">
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </span>
              اكتمل التنفيذ
            </>
          ) : (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-ink-2" strokeWidth={1.5} />
              جارٍ التنفيذ
            </>
          )}
        </div>
        <span className="text-label text-ink-3">
          {toArabicDigits(executedCount)}/{toArabicDigits(plan.steps.length)}
        </span>
      </div>

      <ul className="px-5 py-2">
        {plan.steps.map((step) => {
          const executed = executedStepIds.includes(step.id);
          const active = !executed && step.id === activeStepId;
          return (
            <li
              key={step.id}
              className={`flex items-center gap-3 py-2.5 transition-opacity duration-200 ${
                executed || active ? "opacity-100" : "opacity-45"
              }`}
            >
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                {executed ? (
                  <motion.span
                    initial={reduce ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-status-done"
                  >
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </motion.span>
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin text-ink-2" strokeWidth={1.75} />
                ) : (
                  <span className="h-[18px] w-[18px] rounded-full border border-line-strong" />
                )}
              </span>

              <span
                className={`min-w-0 flex-1 truncate text-body ${
                  executed ? "text-ink" : active ? "text-ink" : "text-ink-2"
                }`}
              >
                {step.title}
              </span>

              {step.toolLabel && executed && (
                <span className="shrink-0 rounded-pill bg-pill-bg px-2 py-0.5 text-[11px] text-pill-text">
                  {step.toolLabel}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
