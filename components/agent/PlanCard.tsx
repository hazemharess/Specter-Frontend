"use client";

import { useState } from "react";
import { Check, ClipboardList, Loader2, Sparkles } from "lucide-react";
import type { Plan } from "@/lib/types";
import { toArabicDigits } from "@/components/chat/MessageContent";

/**
 * The single most important visual moment: the agent proposes a plan and the
 * lawyer approves before anything runs (approve-before-act). Legora "SPA
 * Drafting Plan" styling — neutral surfaces, one black CTA.
 */
export function PlanCard({
  plan,
  approved,
  onApprove,
}: {
  plan: Plan;
  approved?: boolean;
  onApprove: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const COLLAPSED = 4;
  const visible = showAll ? plan.steps : plan.steps.slice(0, COLLAPSED);
  const hidden = plan.steps.length - visible.length;

  return (
    <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-raised">
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <ClipboardList className="h-4 w-4 shrink-0 text-ink-2" strokeWidth={1.5} />
          <div className="min-w-0">
            <span className="block truncate text-body font-medium text-ink">
              {plan.title}
            </span>
            {plan.capability && (
              <span className="block truncate text-[11px] text-ink-3">
                مهارة: {plan.capability}
              </span>
            )}
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-pill-bg px-2.5 py-1 text-label text-pill-text">
          <Sparkles className="h-3 w-3" strokeWidth={1.5} />
          خطة مقترحة
        </span>
      </div>

      <div className="px-5 py-4">
        {/* goal */}
        <div className="rounded-input bg-surface-2 px-4 py-3">
          <p className="text-label leading-relaxed text-ink-2">{plan.goal}</p>
        </div>

        {/* steps */}
        <ol className="mt-4 space-y-0.5">
          {visible.map((step) => (
            <li key={step.id} className="flex items-center gap-3 py-2">
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-line-strong" />
              <span className="min-w-0 flex-1 truncate text-body text-ink">
                {step.title}
              </span>
              {step.toolLabel && (
                <span className="shrink-0 rounded-pill bg-pill-bg px-2 py-0.5 text-[11px] text-pill-text">
                  {step.toolLabel}
                </span>
              )}
            </li>
          ))}
        </ol>

        {hidden > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-1 pr-[30px] text-label text-ink-3 transition-colors duration-150 hover:text-ink-2"
          >
            + {toArabicDigits(hidden)} خطوات إضافية
          </button>
        )}
      </div>

      {/* footer */}
      {!approved ? (
        <div className="flex items-stretch gap-2 border-t border-line px-5 py-3.5">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex-1 rounded-input border border-line-strong bg-surface px-4 py-2.5 text-body font-medium text-ink transition-colors duration-150 hover:bg-surface-2"
          >
            {showAll ? "إخفاء التفاصيل" : "عرض الخطة كاملة"}
          </button>
          <button
            onClick={onApprove}
            className="flex-1 rounded-input bg-accent px-4 py-2.5 text-body font-medium text-accent-contrast transition-colors duration-150 hover:bg-accent-hover active:scale-[.99]"
          >
            اعتماد الخطة
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-line bg-surface-2 px-5 py-3.5 text-label text-ink-2">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent">
            <Check className="h-2.5 w-2.5 text-accent-contrast" strokeWidth={3} />
          </span>
          تم الاعتماد
          <span className="mx-1 text-ink-3">·</span>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-3" strokeWidth={1.5} />
          جارٍ التنفيذ
        </div>
      )}
    </div>
  );
}
