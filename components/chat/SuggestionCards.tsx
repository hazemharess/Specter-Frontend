"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BellRing, FileStack, GitCompare, Gavel } from "lucide-react";

const SUGGESTIONS = [
  {
    icon: FileStack,
    title: "لخّص مستندات قضية",
    text: "لخّص مستندات قضية شركة النيل للتطوير العقاري وحدد أهم الأدلة.",
  },
  {
    icon: BellRing,
    title: "صِغ إنذارًا رسميًا",
    text: "صِغ إنذارًا رسميًا على يد محضر بالمطالبة بتسليم وحدة سكنية.",
  },
  {
    icon: Gavel,
    title: "ابحث عن سابقة قضائية",
    text: "ابحث عن مبادئ النقض في تخفيض التعويض الاتفاقي.",
  },
  {
    icon: GitCompare,
    title: "قارن بين نسختي عقد",
    text: "قارن بين نسختي عقد التوريد وحدد البنود المعدلة لغير صالح الموكل.",
  },
];

export function SuggestionCards({ onPick }: { onPick: (text: string) => void }) {
  const reduce = useReducedMotion();
  return (
    <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
      {SUGGESTIONS.map(({ icon: Icon, title, text }, i) => (
        <motion.button
          key={title}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.04 }}
          onClick={() => onPick(text)}
          className="group flex items-start gap-3 rounded-card border border-line bg-surface p-4 text-right transition-colors duration-150 hover:bg-accent-soft/40"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-input bg-accent-soft text-accent">
            <Icon className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <span>
            <span className="block text-body font-medium text-ink">{title}</span>
            <span className="mt-0.5 block text-label leading-relaxed text-ink-3">
              {text}
            </span>
          </span>
        </motion.button>
      ))}
    </div>
  );
}
