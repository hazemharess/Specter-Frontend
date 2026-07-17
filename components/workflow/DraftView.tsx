"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Download, Info, Save } from "lucide-react";
import type { Citation, Draft, DraftField } from "@/lib/types";
import { api } from "@/lib/api";
import { toArabicDigits } from "@/components/chat/MessageContent";

function FieldPopover({
  field,
  onEdit,
  onClose,
  onCitationClick,
}: {
  field: DraftField;
  onEdit: (value: string) => void;
  onClose: () => void;
  onCitationClick?: (c: Citation) => void;
}) {
  const [value, setValue] = useState(field.value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute right-0 top-full z-30 mt-1.5 w-80 rounded-card border border-line bg-surface p-3 shadow-floating"
      role="dialog"
      aria-label="مصدر الحقل وتحريره"
    >
      <p className="mb-2 text-label font-medium text-ink-3">المصدر</p>
      {field.sourceType === "user_answer" ? (
        <p className="mb-3 text-label text-ink-2">من إجابتك في خطوة الأسئلة</p>
      ) : field.citation ? (
        <button
          onClick={() => onCitationClick?.(field.citation!)}
          className="mb-3 inline-flex items-center gap-2 rounded-pill border border-gold/60 bg-surface px-3 py-1.5 text-label text-ink transition-colors duration-150 hover:bg-[var(--gold-soft)]"
        >
          <span className="font-semibold text-gold">
            [{toArabicDigits(field.citation.index)}]
          </span>
          {field.citation.docName} — صفحة {field.citation.page}
        </button>
      ) : null}
      <label className="mb-1 block text-label font-medium text-ink-3">تحرير القيمة</label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onEdit(value);
              onClose();
            }
          }}
          className="min-w-0 flex-1 rounded-input border border-line bg-bg px-3 py-1.5 text-label text-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
        />
        <button
          onClick={() => {
            onEdit(value);
            onClose();
          }}
          className="rounded-input bg-accent px-3 py-1.5 text-label text-white transition-colors duration-150 hover:bg-accent-hover"
        >
          حفظ
        </button>
      </div>
    </motion.div>
  );
}

/**
 * The document-styled draft surface. Every AI-filled field is a
 * gold-underlined span; clicking reveals its provenance + inline edit.
 */
export function DraftView({
  draft,
  onCitationClick,
}: {
  draft: Draft;
  onCitationClick?: (c: Citation) => void;
}) {
  const [fields, setFields] = useState<DraftField[]>(draft.fields);
  const [openField, setOpenField] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const byKey = new Map(fields.map((f) => [f.key, f]));

  const plainText = draft.body.replace(/\[\[field:([a-z_]+)\]\]/g, (_, key) => {
    return byKey.get(key)?.value ?? "—";
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable in some contexts — non-fatal */
    }
  };

  const save = async () => {
    await api.workflows.saveDraft({ ...draft, fields });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // split body into text segments and field tokens
  const segments = draft.body.split(/(\[\[field:[a-z_]+\]\])/);

  return (
    <div>
      {/* notice bar */}
      <div className="mb-4 flex items-center gap-2 rounded-input border border-line bg-bg px-4 py-2.5 text-label text-ink-2">
        <Info className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.5} />
        هذه مسودة أولية — تتطلب مراجعة المحامي قبل الاستخدام
      </div>

      {/* actions */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className="inline-flex items-center gap-2 rounded-input border border-line bg-surface px-3 py-1.5 text-label text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40">
          <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
          تحميل Word
        </button>
        <button
          onClick={save}
          className="inline-flex items-center gap-2 rounded-input border border-line bg-surface px-3 py-1.5 text-label text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40"
        >
          {saved ? (
            <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
          ) : (
            <Save className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          {saved ? "حُفظت في القضية" : "حفظ في القضية"}
        </button>
        <button
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-input border border-line bg-surface px-3 py-1.5 text-label text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
          ) : (
            <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          {copied ? "نُسخت" : "نسخ"}
        </button>
      </div>

      {/* the document */}
      <div className="paper-page rounded-[4px] px-12 py-14 max-md:px-6 max-md:py-8">
        <div
          className="whitespace-pre-wrap text-justify text-[15px] leading-[2] text-[#2c2a24]"
          dir="rtl"
        >
          {segments.map((seg, i) => {
            const m = seg.match(/^\[\[field:([a-z_]+)\]\]$/);
            if (!m) return <span key={i}>{seg}</span>;
            const field = byKey.get(m[1]);
            if (!field) return <span key={i}>—</span>;
            return (
              <span key={i} className="relative inline-block">
                <button
                  onClick={() => setOpenField(openField === field.id ? null : field.id)}
                  aria-label={`حقل مولّد: ${field.value} — اضغط لعرض المصدر والتحرير`}
                  className="rounded-sm border-b-2 border-gold/70 bg-[var(--gold-soft)] px-0.5 font-medium text-[#2c2a24] transition-colors duration-150 hover:bg-gold/25"
                >
                  {field.value}
                </button>
                <AnimatePresence>
                  {openField === field.id && (
                    <FieldPopover
                      field={field}
                      onClose={() => setOpenField(null)}
                      onCitationClick={onCitationClick}
                      onEdit={(v) =>
                        setFields((prev) =>
                          prev.map((f) => (f.id === field.id ? { ...f, value: v } : f))
                        )
                      }
                    />
                  )}
                </AnimatePresence>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
