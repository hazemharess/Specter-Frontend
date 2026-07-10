"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Briefcase, ChevronLeft, Globe, Search } from "lucide-react";
import type { Case, Scope } from "@/lib/types";
import { api } from "@/lib/api";
import { Badge, Spinner } from "@/components/ui";
import { ScopeChips } from "@/components/chat/ScopeChips";

const TYPE_TONE: Record<Case["type"], "green" | "blue" | "amber" | "rose"> = {
  "مدني": "green",
  "تجاري": "blue",
  "عمالي": "amber",
  "أحوال شخصية": "rose",
};

/**
 * Empty-state scope chooser. Two paths:
 *  - "محادثة عامة": the usual scope chips (all office / library / templates).
 *  - "داخل قضية": pick an existing case → the whole conversation locks to it.
 */
export function ChatModeChooser({
  scope,
  onScopeChange,
  onPickCase,
}: {
  scope: Scope;
  onScopeChange: (scope: Scope) => void;
  onPickCase: (c: Case) => void;
}) {
  const [mode, setMode] = useState<"general" | "case">("general");
  const [cases, setCases] = useState<Case[] | null>(null);
  const [query, setQuery] = useState("");
  const reduce = useReducedMotion();

  useEffect(() => {
    if (mode === "case" && cases === null) {
      api.cases.list().then(setCases);
    }
  }, [mode, cases]);

  const filtered = (cases ?? []).filter(
    (c) =>
      !query ||
      c.number.includes(query) ||
      c.title.includes(query) ||
      c.client.includes(query)
  );

  return (
    <div>
      {/* segmented toggle */}
      <div className="mb-4 inline-flex rounded-pill border border-line bg-surface p-1">
        {(
          [
            { key: "general", label: "محادثة عامة", icon: Globe },
            { key: "case", label: "داخل قضية محددة", icon: Briefcase },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            aria-pressed={mode === key}
            className={`relative inline-flex items-center gap-1.5 rounded-pill px-4 py-1.5 text-label transition-colors duration-150 ${
              mode === key ? "text-white" : "text-ink-2 hover:text-ink"
            }`}
          >
            {mode === key && (
              <motion.span
                layoutId="chat-mode-pill"
                className="absolute inset-0 -z-10 rounded-pill bg-accent"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === "general" ? (
          <motion.div
            key="general"
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <ScopeChips scope={scope} onChange={onScopeChange} />
          </motion.div>
        ) : (
          <motion.div
            key="case"
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <p className="mb-3 text-label text-ink-2">
              اختر قضية لتقييد المحادثة بمستنداتها وسياقها فقط — يصبح المساعد مركّزًا على هذه القضية وحدها.
            </p>
            <div className="relative mb-3">
              <Search
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
                strokeWidth={1.5}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن قضية…"
                aria-label="ابحث عن قضية"
                className="w-full rounded-input border border-line bg-surface py-2 pl-3 pr-9 text-body text-ink placeholder:text-ink-3 focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
              />
            </div>

            {cases === null ? (
              <div className="flex justify-center py-8">
                <Spinner className="h-5 w-5" />
              </div>
            ) : (
              <ul className="max-h-72 space-y-1.5 overflow-y-auto pl-1">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => onPickCase(c)}
                      className="flex w-full items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-right transition-all duration-150 hover:border-accent/30 hover:bg-accent-soft/40"
                    >
                      <Briefcase className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.5} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-body font-medium text-ink">
                            {c.number}
                          </span>
                          <Badge tone={TYPE_TONE[c.type]}>{c.type}</Badge>
                        </span>
                        <span className="block truncate text-label text-ink-3">
                          {c.title}
                        </span>
                      </span>
                      <ChevronLeft className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.5} />
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="py-6 text-center text-label text-ink-3">
                    لا توجد قضايا مطابقة.
                  </li>
                )}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
