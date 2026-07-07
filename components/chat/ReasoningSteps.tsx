"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronDown,
  FileSearch,
  FileText,
  ScanSearch,
  Scale,
  Search,
} from "lucide-react";
import type { ReasoningStep } from "@/lib/types";
import { toArabicDigits } from "@/components/chat/MessageContent";

const KIND_ICON = {
  analyze: ScanSearch,
  review_file: FileText,
  search: Search,
  evaluate: Scale,
} as const;

function StepChip({ label, icon }: { label: string; icon?: string }) {
  const Icon = icon === "pdf" ? FileText : icon === "search" ? Search : FileSearch;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface px-2.5 py-1 text-label text-ink-2">
      <Icon className="h-3 w-3 shrink-0 text-ink-3" strokeWidth={1.5} />
      {label}
    </span>
  );
}

/**
 * The Harvey-style "جارٍ العمل…" trust block. Steps arrive one by one while
 * `working` is true; when the answer starts streaming it collapses to a
 * single summary line that can be re-expanded.
 */
export function ReasoningSteps({
  steps,
  working,
  collapsed,
}: {
  steps: ReasoningStep[];
  working: boolean;
  collapsed: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const reduce = useReducedMotion();
  if (steps.length === 0) return null;

  const showList = working || !collapsed || expanded;

  return (
    <div className="mb-5">
      <button
        onClick={() => !working && setExpanded((v) => !v)}
        aria-expanded={showList}
        className={`flex items-center gap-2 text-label transition-colors duration-150 ${
          working ? "cursor-default text-ink-2" : "text-ink-3 hover:text-ink-2"
        }`}
      >
        {working ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            جارٍ العمل…
          </>
        ) : (
          <>
            <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
            اكتمل التحليل · {toArabicDigits(steps.length)} خطوات
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
              strokeWidth={1.5}
            />
          </>
        )}
      </button>

      <AnimatePresence initial={false}>
        {showList && (
          <motion.ol
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-3 overflow-hidden border-r border-line pr-4"
          >
            {steps.map((step, i) => {
              const Icon = KIND_ICON[step.kind];
              const done = !working || i < steps.length - 1;
              return (
                <motion.li
                  key={step.id + i}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="relative py-2.5"
                >
                  <span className="absolute -right-[25px] top-3 flex h-4 w-4 items-center justify-center rounded-full border border-line bg-surface">
                    {done ? (
                      <motion.span
                        initial={reduce ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      >
                        <Check className="h-2.5 w-2.5 text-accent" strokeWidth={2.5} />
                      </motion.span>
                    ) : (
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-3" />
                    )}
                  </span>
                  <div className="flex items-center gap-2 text-body text-ink">
                    <Icon className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.5} />
                    {step.label}
                  </div>
                  {step.detail && (
                    <p className="mt-1.5 pr-6 text-label leading-relaxed text-ink-2">
                      {step.detail}
                    </p>
                  )}
                  {step.chips && step.chips.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 pr-6">
                      {step.chips.map((chip, ci) => (
                        <StepChip key={ci} label={chip.label} icon={chip.icon} />
                      ))}
                    </div>
                  )}
                </motion.li>
              );
            })}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}
