"use client";

import { Download, FileText, Share2 } from "lucide-react";
import type { CaseSummaryArtifactData } from "@/lib/types";

/**
 * Secondary deliverable: a real assessment memo, styled like a firm document —
 * lead paragraph, key-facts grid, headed sections. Not a chat bubble.
 */
export function CaseSummaryArtifact({ data }: { data: CaseSummaryArtifactData }) {
  return (
    <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-raised">
      {/* header */}
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
        <span className="flex h-6 w-6 items-center justify-center rounded-input bg-surface-2">
          <FileText className="h-3.5 w-3.5 text-ink-2" strokeWidth={1.5} />
        </span>
        <h3 className="text-title font-semibold text-ink">{data.title}</h3>
        {data.meta && (
          <span className="mr-auto text-label text-ink-3">{data.meta}</span>
        )}
      </div>

      <div className="space-y-5 px-5 py-5">
        {/* lead */}
        <p className="text-body leading-[1.9] text-ink">{data.summary}</p>

        {/* key facts */}
        {data.facts.length > 0 && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-input bg-surface-2 px-4 py-4 max-md:grid-cols-1">
            {data.facts.map((f) => (
              <div key={f.label} className="flex flex-col gap-0.5">
                <span className="text-[11px] text-ink-3">{f.label}</span>
                <span className="text-label font-medium text-ink">{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* sections */}
        {data.sections?.map((s) => (
          <div key={s.heading}>
            <h4 className="mb-1.5 text-label font-semibold text-ink">{s.heading}</h4>
            <p className="text-label leading-[1.9] text-ink-2">{s.body}</p>
          </div>
        ))}
      </div>

      {/* footer */}
      <div className="flex items-center gap-2 border-t border-line px-5 py-3.5">
        <button className="inline-flex items-center gap-2 rounded-input border border-line-strong bg-surface px-4 py-2 text-label font-medium text-ink transition-colors duration-150 hover:bg-surface-2">
          <Share2 className="h-4 w-4" strokeWidth={1.5} />
          مشاركة
        </button>
        <button className="inline-flex items-center gap-2 rounded-input px-3 py-2 text-label text-ink-2 transition-colors duration-150 hover:bg-surface-2">
          <Download className="h-4 w-4" strokeWidth={1.5} />
          تصدير Word
        </button>
      </div>
    </div>
  );
}
