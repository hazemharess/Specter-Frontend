"use client";

import { Lock, Repeat2 } from "lucide-react";

export interface LockInfo {
  /** primary label, e.g. the case number or document name */
  label: string;
  /** secondary line, e.g. the case title */
  sublabel?: string;
  /** key facts rendered as inline chips (client / opponent / court …) */
  facts?: { label: string; value: string }[];
}

/**
 * Shown at the top of a conversation that is *locked* to one case (or
 * document). The assistant only sees that context — no scope chips, no
 * cross-case bleed. `onChange` returns the chat to a general conversation.
 */
export function LockedScopeBanner({
  info,
  onChange,
  compact,
}: {
  info: LockInfo;
  onChange?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-card border border-accent/25 bg-accent-soft/60 ${
        compact ? "px-4 py-2.5" : "px-5 py-4"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-label font-medium text-accent">محادثة مقيّدة بالقضية</span>
          </div>
          <p className="mt-0.5 truncate text-body font-semibold text-ink">{info.label}</p>
          {info.sublabel && !compact && (
            <p className="truncate text-label text-ink-2">{info.sublabel}</p>
          )}
          {info.facts && info.facts.length > 0 && !compact && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-label text-ink-2">
              {info.facts.map((f) => (
                <span key={f.label}>
                  <span className="text-ink-3">{f.label}: </span>
                  {f.value}
                </span>
              ))}
            </div>
          )}
        </div>
        {onChange && (
          <button
            onClick={onChange}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-input px-2.5 py-1.5 text-label text-ink-2 transition-colors duration-150 hover:bg-accent-soft hover:text-accent"
          >
            <Repeat2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            محادثة عامة
          </button>
        )}
      </div>
    </div>
  );
}
