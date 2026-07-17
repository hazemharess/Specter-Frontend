"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

/**
 * The system doesn't wait to be asked. A quiet weekly-brief toast slides in
 * after a beat — signalling proactivity, not just response. Scripted timer
 * tonight; @backend: a real notifications stream (SSE / WebSocket) replaces it.
 */
export function ProactiveNotification() {
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 left-6 z-40 w-[340px] max-md:left-4 max-md:right-4 max-md:w-auto"
          role="status"
        >
          <div className="rounded-card border border-line bg-surface/90 p-4 shadow-floating backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent">
                <Sparkles className="h-3.5 w-3.5 text-accent-contrast" strokeWidth={1.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold text-ink">الموجز الأسبوعي جاهز</p>
                <p className="mt-1 text-label leading-relaxed text-ink-2">
                  ٣ قضايا جديدة عبر تلغرام، استشارتان معلّقتان، ومهمة واحدة متأخرة
                  تحتاج انتباهك.
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-3">
                  <Sparkles className="h-3 w-3" strokeWidth={1.5} />
                  المساعد · الآن
                </p>
              </div>
              <button
                aria-label="إغلاق"
                onClick={() => setVisible(false)}
                className="shrink-0 rounded-input p-1 text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
