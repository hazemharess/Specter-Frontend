"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import type { Citation, DocumentContent } from "@/lib/types";
import { api } from "@/lib/api";
import { PdfPage } from "@/components/reader/PdfPage";
import { Spinner } from "@/components/ui";
import { toArabicDigits } from "@/components/chat/MessageContent";

/**
 * The split-view source panel. Right-anchored in reading order (slides in
 * from the left edge of the screen in RTL); the chat column compresses
 * beside it and stays interactive. Full-screen sheet on mobile.
 */
export function SourcePanel({
  citation,
  onClose,
}: {
  citation: Citation;
  onClose: () => void;
}) {
  const [content, setContent] = useState<DocumentContent | null>(null);
  const [pageNum, setPageNum] = useState(citation.page);
  const reduce = useReducedMotion();

  useEffect(() => {
    let alive = true;
    setContent(null);
    setPageNum(citation.page);
    api.library.getContent(citation.docId).then((c) => {
      if (alive) setContent(c);
    });
    return () => {
      alive = false;
    };
  }, [citation]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const total = content?.pages.length ?? 0;
  const page = content?.pages.find((p) => p.page === pageNum) ?? null;

  return (
    <motion.section
      role="complementary"
      aria-label={`المصدر: ${citation.docName}`}
      initial={reduce ? false : { x: "-100%" }}
      animate={{ x: 0 }}
      exit={reduce ? undefined : { x: "-100%" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-y-0 left-0 z-40 flex w-[55%] flex-col border-r border-line bg-bg shadow-floating max-md:inset-0 max-md:w-full"
    >
      {/* header */}
      <header className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3.5">
        <button
          onClick={onClose}
          aria-label="إغلاق لوحة المصدر"
          className="rounded-input p-1.5 text-ink-3 transition-colors duration-150 hover:bg-accent-soft/40 hover:text-ink"
        >
          <X className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium text-ink">{citation.docName}</p>
          <p className="text-label text-ink-3">
            صفحة {toArabicDigits(pageNum)} من {toArabicDigits(total || citation.page)}
          </p>
        </div>
        <Link
          href={`/library?doc=${citation.docId}`}
          className="flex items-center gap-1.5 rounded-input px-3 py-1.5 text-label text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40 hover:text-ink"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
          فتح في المكتبة
        </Link>
      </header>

      {/* body */}
      <div className="flex-1 overflow-y-auto bg-[#efeeea] p-6 max-md:p-3">
        {!content && (
          <div className="flex h-full items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        )}
        {page && (
          <PdfPage
            page={page}
            highlightSnippet={pageNum === citation.page ? citation.snippet : null}
          />
        )}
      </div>

      {/* pager — mirrored for RTL: previous is to the right */}
      <footer className="flex items-center justify-center gap-4 border-t border-line bg-surface py-2.5">
        <button
          onClick={() => setPageNum((p) => Math.max(1, p - 1))}
          disabled={!content || pageNum <= 1}
          aria-label="الصفحة السابقة"
          className="rounded-input p-2 text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40 disabled:opacity-30"
        >
          <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>
        <span className="min-w-16 text-center text-label text-ink-2">
          {toArabicDigits(pageNum)} / {toArabicDigits(total)}
        </span>
        <button
          onClick={() => setPageNum((p) => Math.min(total, p + 1))}
          disabled={!content || pageNum >= total}
          aria-label="الصفحة التالية"
          className="rounded-input p-2 text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40 disabled:opacity-30"
        >
          <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>
      </footer>
    </motion.section>
  );
}
