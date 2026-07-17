"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Plus, Search, Send, AlertTriangle } from "lucide-react";
import type { Case } from "@/lib/types";
import { Badge, Spinner, formatDateAr } from "@/components/ui";
import { useCases } from "@/hooks/useCases";

const TYPE_TONE: Record<Case["type"], "green" | "blue" | "amber" | "rose"> = {
  "مدني": "green",
  "تجاري": "blue",
  "عمالي": "amber",
  "أحوال شخصية": "rose",
};

export default function CasesPage() {
  const [query, setQuery] = useState("");
  const { cases, loading, error, flashId } = useCases(query || undefined);
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto max-w-6xl px-8 py-10 max-md:px-4">
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <h1 className="text-page font-semibold text-ink">القضايا</h1>
        <span className="rounded-pill bg-accent-soft px-2.5 py-0.5 text-label font-medium text-accent">
          {cases.length}
        </span>
        <div className="relative mr-auto w-72 max-md:w-full max-md:order-3">
          <Search
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
            strokeWidth={1.5}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث برقم القضية أو اسم الموكل…"
            aria-label="بحث في القضايا"
            className="w-full rounded-input border border-line bg-surface py-2 pl-3 pr-9 text-body text-ink placeholder:text-ink-3 focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-pill bg-accent px-4 py-2 text-body font-medium text-white transition-colors duration-150 hover:bg-[#16302b] active:scale-[.98]">
          قضية جديدة
          <Plus className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Soft error — keep the shell + any last-good data rendered. */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-card border border-[#8a6a34]/20 bg-[#f7f1e6] px-4 py-3 text-label text-[#8a6a34]">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          تعذّر الاتصال بالخادم — تُعرض آخر بيانات متاحة. سيُعاد المحاولة تلقائيًا.
        </div>
      )}

      {loading && cases.length === 0 && !error && (
        <div className="flex justify-center py-24">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!loading && cases.length === 0 && !error && (
        <p className="py-24 text-center text-body text-ink-3">
          لا توجد قضايا بعد.
        </p>
      )}

      <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
        {cases.map((c, i) => (
          <motion.div
            key={c.id}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: Math.min(i, 8) * 0.04 }}
          >
            <Link
              href={`/cases/${c.id}`}
              className={`group block rounded-card border bg-surface p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-raised ${
                c.id === flashId
                  ? "border-[#2dd4bf] shadow-[inset_0_0_0_1px_rgba(45,212,191,0.6)] bg-[rgba(45,212,191,0.10)]"
                  : "border-line"
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <p className="text-body font-semibold text-ink">{c.number}</p>
                <Badge tone={TYPE_TONE[c.type]}>{c.caseType || c.type}</Badge>
              </div>
              <p className="mb-3 line-clamp-1 text-label text-ink-2">{c.title}</p>

              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                {c.source === "telegram" && (
                  <span className="inline-flex items-center gap-1 rounded-input bg-[#229ED9] px-1.5 py-0.5 text-[10px] font-medium text-white">
                    <Send className="h-3 w-3" strokeWidth={2} />
                    Telegram
                  </span>
                )}
                {(c.priority === "urgent" || c.priority === "high") && (
                  <span className="rounded-input bg-danger px-1.5 py-0.5 text-[10px] font-medium text-white">
                    عاجل
                  </span>
                )}
              </div>

              <dl className="space-y-1.5 text-label text-ink-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-3">الموكل</dt>
                  <dd className="truncate">{c.client}</dd>
                </div>
                {c.assignedLawyer && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-3">المحامي</dt>
                    <dd className="truncate">{c.assignedLawyer}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-label text-ink-3">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {formatDateAr(c.createdAt)}
                </span>
                {c.team.length > 0 && (
                  <span className="mr-auto flex -space-x-1.5 space-x-reverse" aria-label="فريق العمل">
                    {c.team.map((t) => (
                      <span
                        key={t}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-surface bg-accent-soft text-[10px] font-semibold text-accent"
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
