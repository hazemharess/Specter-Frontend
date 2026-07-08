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
 * Renders assistant text. Inline [cite:N] tokens become gold, hyperlink-style
 * superscript markers that open the source panel on the cited article.
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
            const label = toArabicDigits(index);
            if (!citation) {
              // token streamed in before its citation event — inert placeholder
              return (
                <sup
                  key={i}
                  className="mx-0.5 text-[0.7em] font-semibold text-gold/60"
                >
                  [{label}]
                </sup>
              );
            }
            return (
              <button
                key={i}
                onClick={() => onCitationClick?.(citation)}
                aria-label={`المصدر ${label}: ${citation.docName}`}
                title={citation.docName}
                className="cursor-pointer align-super text-[0.7em] font-semibold text-gold underline decoration-dotted decoration-gold/50 underline-offset-2 transition-colors duration-150 hover:decoration-gold hover:decoration-solid"
              >
                [{label}]
              </button>
            );
          })}
        </p>
      ))}
    </div>
  );
}
