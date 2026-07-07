"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { MessageSquareText } from "lucide-react";
import type { HistoryEntry } from "@/lib/types";
import { api } from "@/lib/api";
import { Badge, Spinner, relativeTime } from "@/components/ui";

type Group = "اليوم" | "أمس" | "هذا الأسبوع" | "أقدم";

function groupOf(iso: string): Group {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);
  if (date >= startOfToday) return "اليوم";
  if (date >= startOfYesterday) return "أمس";
  if (date >= startOfWeek) return "هذا الأسبوع";
  return "أقدم";
}

const GROUP_ORDER: Group[] = ["اليوم", "أمس", "هذا الأسبوع", "أقدم"];

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    api.history.list().then(setEntries);
  }, []);

  const grouped = useMemo(() => {
    if (!entries) return [];
    const map = new Map<Group, HistoryEntry[]>();
    for (const e of entries) {
      const g = groupOf(e.updatedAt);
      map.set(g, [...(map.get(g) ?? []), e]);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
      group: g,
      items: map.get(g)!,
    }));
  }, [entries]);

  return (
    <div className="mx-auto max-w-3xl px-8 py-10 max-md:px-4">
      <h1 className="mb-10 text-page font-semibold text-ink">السجل</h1>

      {!entries && (
        <div className="flex justify-center py-24">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      <div className="space-y-10">
        {grouped.map(({ group, items }) => (
          <section key={group} aria-label={group}>
            <h2 className="mb-3 text-label font-medium text-ink-3">{group}</h2>
            <ul className="space-y-2">
              {items.map((e, i) => (
                <motion.li
                  key={e.id}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.04 }}
                >
                  <Link
                    href={`/?thread=${e.threadId}`}
                    className="flex items-center gap-4 rounded-card border border-line bg-surface px-5 py-4 transition-colors duration-150 hover:bg-accent-soft/40"
                  >
                    <MessageSquareText
                      className="h-[18px] w-[18px] shrink-0 text-ink-3"
                      strokeWidth={1.5}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-body font-medium text-ink">
                          {e.title}
                        </span>
                        {e.caseLabel && <Badge tone="green">{e.caseLabel}</Badge>}
                      </span>
                      <span className="block truncate text-label text-ink-3">
                        {e.preview}
                      </span>
                    </span>
                    <span className="shrink-0 text-label text-ink-3">
                      {relativeTime(e.updatedAt)}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
