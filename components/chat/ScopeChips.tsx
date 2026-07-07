"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Check } from "lucide-react";
import type { Case, Scope } from "@/lib/types";
import { api } from "@/lib/api";
import { Pill } from "@/components/ui";

const STATIC_SCOPES: Scope[] = [
  { type: "all", label: "كل مستندات المكتب" },
  { type: "library", label: "المكتبة القانونية" },
  { type: "templates", label: "القوالب" },
];

export function ScopeChips({
  scope,
  onChange,
}: {
  scope: Scope;
  onChange: (scope: Scope) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pickerOpen && cases.length === 0) {
      api.cases.list().then(setCases);
    }
  }, [pickerOpen, cases.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPickerOpen(false);
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const isCaseScope = scope.type === "case" || scope.type === "document";

  return (
    <div ref={wrapRef} className="relative flex flex-wrap items-center gap-2">
      {STATIC_SCOPES.map((s) => (
        <Pill
          key={s.type}
          selected={scope.type === s.type}
          onClick={() => onChange(s)}
          aria-pressed={scope.type === s.type}
        >
          {s.label}
        </Pill>
      ))}
      <Pill
        selected={isCaseScope}
        onClick={() => setPickerOpen((v) => !v)}
        aria-expanded={pickerOpen}
        aria-haspopup="listbox"
      >
        <Briefcase className="h-3 w-3" strokeWidth={1.5} />
        {isCaseScope ? scope.label : "قضية محددة"}
      </Pill>

      <AnimatePresence>
        {pickerOpen && (
          <motion.ul
            role="listbox"
            aria-label="اختر قضية"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full z-30 mt-2 max-h-72 w-80 overflow-y-auto rounded-card border border-line bg-surface p-1.5 shadow-floating"
          >
            {cases.length === 0 && (
              <li className="px-3 py-4 text-center text-label text-ink-3">
                جارٍ التحميل…
              </li>
            )}
            {cases.map((c) => {
              const selected = scope.caseId === c.id;
              return (
                <li key={c.id} role="option" aria-selected={selected}>
                  <button
                    onClick={() => {
                      onChange({ type: "case", caseId: c.id, label: c.number });
                      setPickerOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-input px-3 py-2 text-right transition-colors duration-150 hover:bg-accent-soft/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-body text-ink">
                        {c.number}
                      </span>
                      <span className="block truncate text-label text-ink-3">
                        {c.title}
                      </span>
                    </span>
                    {selected && (
                      <Check className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
