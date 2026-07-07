"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  BellRing,
  CornerUpLeft,
  FileSearch,
  GitCompare,
  ListTree,
  PenLine,
  ScrollText,
  Shield,
  type LucideIcon,
} from "lucide-react";
import type { Workflow } from "@/lib/types";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui";
import { toArabicDigits } from "@/components/chat/MessageContent";

const ICONS: Record<string, LucideIcon> = {
  "scroll-text": ScrollText,
  shield: Shield,
  "bell-ring": BellRing,
  "file-search": FileSearch,
  "pen-line": PenLine,
  "corner-up-left": CornerUpLeft,
  "list-tree": ListTree,
  "git-compare": GitCompare,
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[] | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    api.workflows.list().then(setWorkflows);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-8 py-10 max-md:px-4">
      <h1 className="mb-2 text-page font-semibold text-ink">الإجراءات</h1>
      <p className="mb-10 text-body text-ink-2">
        إجراءات قانونية موجهة خطوة بخطوة — يقودك المساعد من المدخلات إلى مسودة جاهزة للمراجعة.
      </p>

      {!workflows && (
        <div className="flex justify-center py-24">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
        {workflows?.map((w, i) => {
          const Icon = ICONS[w.icon] ?? ScrollText;
          return (
            <motion.div
              key={w.id}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.04 }}
            >
              <Link
                href={`/workflows/${w.slug}`}
                className="flex h-full flex-col gap-3 rounded-card border border-line bg-surface p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-raised"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-input bg-accent-soft text-accent">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <span className="text-body font-semibold text-ink">{w.title}</span>
                <span className="flex-1 text-label leading-relaxed text-ink-2">
                  {w.description}
                </span>
                <span className="text-label text-ink-3">
                  {toArabicDigits(w.stepCount)} خطوات · ~{toArabicDigits(w.estimatedMinutes)} دقائق
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
