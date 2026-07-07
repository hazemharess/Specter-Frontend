"use client";

import type { Citation } from "@/lib/types";

const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
export function toArabicDigits(n: number): string {
  return String(n)
    .split("")
    .map((d) => AR_DIGITS[Number(d)] ?? d)
    .join("");
}

/**
 * Renders assistant text. Inline [cite:N] tokens become gold superscript
 * markers ﴾١﴿ that open the source panel.
 */
export function MessageContent({
  content,
  citations,
  onCitationClick,
}: {
  content: string;
  citations: Citation[];
  onCitationClick?: (citation: Citation) => void;
}) {
  const paragraphs = content.split(/\n\n+/);
  return (
    <div className="space-y-4 text-body leading-[1.7] text-ink">
      {paragraphs.map((para, pi) => (
        <p key={pi}>
          {para.split(/(\[cite:\d+\])/).map((part, i) => {
            const m = part.match(/^\[cite:(\d+)\]$/);
            if (!m) return <span key={i}>{part}</span>;
            const index = Number(m[1]);
            const citation = citations.find((c) => c.index === index);
            const marker = `﴾${toArabicDigits(index)}﴿`;
            if (!citation) {
              // token streamed in before its citation event — show inert marker
              return (
                <span
                  key={i}
                  className="relative -top-[0.4em] mx-0.5 inline-flex text-[11px] font-semibold text-gold"
                >
                  {marker}
                </span>
              );
            }
            return (
              <button
                key={i}
                onClick={() => onCitationClick?.(citation)}
                aria-label={`المصدر ${toArabicDigits(index)}: ${citation.docName} — صفحة ${citation.page}`}
                className="relative -top-[0.4em] mx-0.5 inline-flex items-center rounded px-0.5 text-[11px] font-semibold leading-4 text-gold transition-colors duration-150 hover:bg-[var(--gold-soft)]"
              >
                {marker}
              </button>
            );
          })}
        </p>
      ))}
    </div>
  );
}
