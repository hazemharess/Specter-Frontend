"use client";

import { Info } from "lucide-react";
import type { Citation, Message } from "@/lib/types";
import { MessageContent, toArabicDigits } from "@/components/chat/MessageContent";
import { ReasoningSteps } from "@/components/chat/ReasoningSteps";

export function SourcesRow({
  citations,
  onCitationClick,
}: {
  citations: Citation[];
  onCitationClick: (c: Citation) => void;
}) {
  if (citations.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="mb-2 text-label font-medium text-ink-3">المصادر</p>
      <div className="flex flex-wrap gap-2">
        {citations.map((c) => (
          <button
            key={c.id + c.index}
            onClick={() => onCitationClick(c)}
            className="inline-flex items-center gap-2 rounded-pill border border-gold/60 bg-surface px-3 py-1.5 text-label text-ink transition-colors duration-150 hover:bg-[var(--gold-soft)]"
          >
            <span className="font-semibold text-gold">﴾{toArabicDigits(c.index)}﴿</span>
            {c.docName} — صفحة {c.page}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MessageItem({
  message,
  streaming,
  working,
  onCitationClick,
}: {
  message: Message;
  /** true while this assistant message's tokens are still arriving */
  streaming?: boolean;
  /** true while reasoning steps are still arriving (before first token) */
  working?: boolean;
  onCitationClick: (c: Citation) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-card bg-accent-soft px-4 py-3 text-body leading-[1.7] text-ink">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div>
      <ReasoningSteps
        steps={message.reasoningSteps}
        working={!!working}
        collapsed={!working}
      />
      {message.isRefusal && message.content && (
        <div className="mb-3 flex items-center gap-2 text-label text-ink-2">
          <Info className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.5} />
          لم يُعثر على إجابة قاطعة في المصادر المتاحة
        </div>
      )}
      {message.content && (
        <MessageContent
          content={message.content}
          citations={message.citations}
          onCitationClick={onCitationClick}
        />
      )}
      {!streaming && !working && (
        <SourcesRow citations={message.citations} onCitationClick={onCitationClick} />
      )}
    </div>
  );
}
