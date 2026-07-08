"use client";

import { useEffect, useRef } from "react";
import { Scale } from "lucide-react";
import type { DocumentPage } from "@/lib/types";

/**
 * Renders one fake "scanned" page of an Arabic legal document: paper
 * texture, court header, justified text. When `highlightSnippet` matches
 * part of a paragraph it is wrapped in the gold evidence highlight,
 * auto-scrolled into view with a 600ms pulse.
 */
export function PdfPage({
  page,
  highlightSnippet,
  zoom = 1,
}: {
  page: DocumentPage;
  highlightSnippet?: string | null;
  zoom?: number;
}) {
  const highlightRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [highlightSnippet, page.page]);

  return (
    <div
      className="paper-page mx-auto w-full max-w-[640px] rounded-[4px] px-10 py-12 max-md:px-6 max-md:py-8"
      style={{
        fontSize: `${15 * zoom}px`,
        lineHeight: 1.9,
      }}
      dir="rtl"
    >
      {/* court header */}
      <header className="mb-8 border-b border-[#d9d5cc] pb-4 text-center">
        <Scale className="mx-auto mb-2 h-5 w-5 text-[#8a857a]" strokeWidth={1.2} />
        <p className="text-[0.8em] tracking-wide text-[#6b6860]">
          جمهورية مصر العربية — وزارة العدل
        </p>
        <p className="mt-1 text-[0.95em] font-semibold text-[#3a3830]">
          {page.header}
        </p>
      </header>

      <div className="space-y-5 text-justify text-[#2c2a24]">
        {page.paragraphs.map((para, i) => {
          if (highlightSnippet && para.includes(highlightSnippet)) {
            const [before, after] = [
              para.slice(0, para.indexOf(highlightSnippet)),
              para.slice(para.indexOf(highlightSnippet) + highlightSnippet.length),
            ];
            return (
              <p key={i} id={`reader-p-${i}`} style={{ scrollMarginTop: "1.5rem" }}>
                {before}
                <mark
                  ref={highlightRef}
                  className="citation-highlight citation-highlight--pulse text-inherit"
                >
                  {highlightSnippet}
                </mark>
                {after}
              </p>
            );
          }
          return (
            <p key={i} id={`reader-p-${i}`} style={{ scrollMarginTop: "1.5rem" }}>
              {para}
            </p>
          );
        })}
      </div>

      <footer className="mt-10 flex items-center justify-between border-t border-[#d9d5cc] pt-3 text-[0.75em] text-[#8a857a]">
        <span>سري — للاستخدام القانوني</span>
        <span>{page.page}</span>
      </footer>
    </div>
  );
}
