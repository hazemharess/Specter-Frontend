"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  CalendarDays,
  ChevronLeft,
  FileText,
  MessageSquareText,
  Paperclip,
  PenLine,
  Send,
} from "lucide-react";
import type {
  CaseDetail,
  CaseSession,
  Draft,
  LegalDocument,
  Thread,
} from "@/lib/types";
import { api } from "@/lib/api";
import { Badge, Spinner, formatDateAr, relativeTime } from "@/components/ui";
import { DocumentStudio } from "@/components/workflow/DocumentStudio";

const TABS = ["المرفقات", "المحادثات", "المستندات", "المسودات", "الجلسات"] as const;
type Tab = (typeof TABS)[number];

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const reduce = useReducedMotion();

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [docs, setDocs] = useState<LegalDocument[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [sessions, setSessions] = useState<CaseSession[]>([]);
  const [tab, setTab] = useState<Tab>("المرفقات");
  const [ask, setAsk] = useState("");
  const [loading, setLoading] = useState(true);
  const [openDraft, setOpenDraft] = useState<Draft | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.cases.get(id),
      api.cases.documents(id),
      api.assistant.listThreads(id),
      api.cases.drafts(id),
      api.cases.sessions(id),
    ]).then(([c, d, t, dr, s]) => {
      if (!alive) return;
      setCaseData(c);
      setDocs(d);
      setThreads(t);
      setDrafts(dr);
      setSessions(s);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  const counts = useMemo<Record<Tab, number>>(
    () => ({
      المرفقات: caseData?.attachments.length ?? 0,
      المحادثات: threads.length,
      المستندات: docs.length,
      المسودات: drafts.length,
      الجلسات: sessions.length,
    }),
    [caseData, threads, docs, drafts, sessions]
  );

  const submitAsk = () => {
    const q = ask.trim();
    if (!q) return;
    router.push(`/?case=${id}&q=${encodeURIComponent(q)}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <p className="py-24 text-center text-body text-ink-3">لم يُعثر على القضية.</p>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-8 pb-32 pt-10 max-md:px-4">
      {/* header */}
      <Link
        href="/cases"
        className="mb-4 inline-flex items-center gap-1 text-label text-ink-3 transition-colors duration-150 hover:text-ink"
      >
        القضايا
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        {caseData.number}
      </Link>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-page font-semibold text-ink">{caseData.title}</h1>
        <Badge tone="green">{caseData.status}</Badge>
        {caseData.caseType && <Badge tone="blue">{caseData.caseType}</Badge>}
        {(caseData.priority === "urgent" || caseData.priority === "high") && (
          <span className="rounded-pill bg-danger px-2.5 py-0.5 text-label font-medium text-white">
            عاجل
          </span>
        )}
        {caseData.source === "telegram" && (
          <span className="inline-flex items-center gap-1 rounded-pill bg-[#229ED9] px-2.5 py-0.5 text-label font-medium text-white">
            <Send className="h-3 w-3" strokeWidth={2} />
            أُنشئت عبر Telegram
          </span>
        )}
      </div>

      <dl className="mb-10 flex flex-wrap gap-x-8 gap-y-2 text-label text-ink-2">
        <div>
          <dt className="inline text-ink-3">الموكل: </dt>
          <dd className="inline">{caseData.client}</dd>
        </div>
        {caseData.assignedLawyer && (
          <div>
            <dt className="inline text-ink-3">المحامي المسؤول: </dt>
            <dd className="inline">{caseData.assignedLawyer}</dd>
          </div>
        )}
        {caseData.court !== "—" && (
          <div>
            <dt className="inline text-ink-3">المحكمة: </dt>
            <dd className="inline">{caseData.court}</dd>
          </div>
        )}
        {caseData.opponent !== "—" && (
          <div>
            <dt className="inline text-ink-3">الخصم: </dt>
            <dd className="inline">{caseData.opponent}</dd>
          </div>
        )}
        <div>
          <dt className="inline text-ink-3">أُنشئت: </dt>
          <dd className="inline">{formatDateAr(caseData.createdAt)}</dd>
        </div>
      </dl>

      {/* tabs */}
      <div role="tablist" aria-label="أقسام القضية" className="mb-6 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-2.5 text-body transition-colors duration-150 ${
              tab === t ? "font-medium text-accent" : "text-ink-2 hover:text-ink"
            }`}
          >
            {t}
            <span className="mr-1.5 text-label text-ink-3">{counts[t]}</span>
            {tab === t && (
              <motion.span
                layoutId="case-tab-underline"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
              />
            )}
          </button>
        ))}
      </div>

      {/* tab bodies */}
      {tab === "المرفقات" && (
        <ul className="space-y-2">
          {caseData.attachments.map((a, i) => (
            <motion.li
              key={a.id}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.04 }}
              className="flex items-center gap-4 rounded-card border border-line bg-surface px-5 py-4"
            >
              <Paperclip className="h-[18px] w-[18px] shrink-0 text-ink-3" strokeWidth={1.5} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-medium text-ink">{a.filename}</span>
                <span className="mt-0.5 flex items-center gap-3 text-label text-ink-3">
                  {a.mimeType && <Badge>{a.mimeType}</Badge>}
                  <span>{formatDateAr(a.uploadedAt)}</span>
                </span>
              </span>
            </motion.li>
          ))}
          {caseData.attachments.length === 0 && (
            <p className="py-12 text-center text-body text-ink-3">لا توجد مرفقات.</p>
          )}
        </ul>
      )}

      {tab === "المحادثات" && (
        <ul className="space-y-2">
          {threads.map((t, i) => (
            <motion.li
              key={t.id}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.04 }}
            >
              <Link
                href={`/?thread=${t.id}`}
                className="flex items-center gap-4 rounded-card border border-line bg-surface px-5 py-4 transition-colors duration-150 hover:bg-accent-soft/40"
              >
                <MessageSquareText className="h-[18px] w-[18px] shrink-0 text-ink-3" strokeWidth={1.5} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-medium text-ink">{t.title}</span>
                  <span className="block truncate text-label text-ink-3">{t.preview}</span>
                </span>
                <span className="shrink-0 text-label text-ink-3">{relativeTime(t.updatedAt)}</span>
              </Link>
            </motion.li>
          ))}
          {threads.length === 0 && (
            <p className="py-12 text-center text-body text-ink-3">لا توجد محادثات بعد.</p>
          )}
        </ul>
      )}

      {tab === "المستندات" && (
        <ul className="space-y-2">
          {docs.map((d, i) => (
            <motion.li
              key={d.id}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.04 }}
              className="flex items-center gap-4 rounded-card border border-line bg-surface px-5 py-4"
            >
              <FileText className="h-[18px] w-[18px] shrink-0 text-ink-3" strokeWidth={1.5} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-medium text-ink">{d.name}</span>
                <span className="mt-0.5 flex items-center gap-3 text-label text-ink-3">
                  <Badge>{d.kind}</Badge>
                  <span>{formatDateAr(d.uploadedAt)}</span>
                  <span>{d.pageCount} صفحة</span>
                  {d.status !== "ready" && (
                    <span className="inline-flex items-center gap-1.5 text-ink-2">
                      <Spinner className="h-3 w-3" />
                      {d.status === "indexing" ? "جارٍ الفهرسة…" : "جارٍ المعالجة…"}
                    </span>
                  )}
                </span>
              </span>
              <button
                onClick={() => router.push(`/?doc=${d.id}`)}
                disabled={d.status !== "ready"}
                className="shrink-0 rounded-input px-3 py-1.5 text-label text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40 hover:text-accent disabled:opacity-40"
              >
                اسأل عن هذا المستند
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      {tab === "المسودات" && (
        <ul className="space-y-2">
          {drafts.map((d, i) => (
            <motion.li
              key={d.id}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.04 }}
            >
              <button
                onClick={() => setOpenDraft(d)}
                className="flex w-full items-center gap-4 rounded-card border border-line bg-surface px-5 py-4 text-right transition-colors duration-150 hover:bg-accent-soft/40"
              >
                <PenLine className="h-[18px] w-[18px] shrink-0 text-ink-3" strokeWidth={1.5} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-medium text-ink">{d.title}</span>
                  <span className="block text-label text-ink-3">{formatDateAr(d.createdAt)}</span>
                </span>
                <Badge tone="amber">مسودة</Badge>
              </button>
            </motion.li>
          ))}
          {drafts.length === 0 && (
            <p className="py-12 text-center text-body text-ink-3">لا توجد مسودات محفوظة.</p>
          )}
        </ul>
      )}

      {tab === "الجلسات" && (
        <ol className="relative mr-2 border-r border-line pr-6">
          {sessions.map((s, i) => (
            <motion.li
              key={s.id}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.04 }}
              className="relative pb-8 last:pb-0"
            >
              <span className="absolute -right-[31px] top-1.5 flex h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent" />
              <p className="flex items-center gap-2 text-label text-ink-3">
                <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
                {formatDateAr(s.date)}
              </p>
              <p className="mt-1 text-body font-medium text-ink">{s.title}</p>
              <p className="mt-1 text-label leading-relaxed text-ink-2">{s.note}</p>
              {s.outcome && (
                <p className="mt-1.5 text-label text-accent">◂ {s.outcome}</p>
              )}
            </motion.li>
          ))}
          {sessions.length === 0 && (
            <p className="py-12 text-center text-body text-ink-3">لا توجد جلسات مسجلة.</p>
          )}
        </ol>
      )}

      {/* docked ask bar */}
      <div className="fixed bottom-0 left-0 z-20 md:right-16 xl:right-60 max-md:right-0">
        <div className="mx-auto w-full max-w-5xl px-8 pb-5 max-md:px-4">
          <div className="flex items-center gap-2 rounded-card border border-line bg-surface p-2 shadow-raised">
            <input
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAsk()}
              placeholder="اسأل المساعد عن هذه القضية…"
              aria-label="اسأل المساعد عن هذه القضية"
              className="flex-1 bg-transparent px-3 py-2 text-body text-ink placeholder:text-ink-3 focus:outline-none"
            />
            <button
              onClick={submitAsk}
              disabled={!ask.trim()}
              aria-label="إرسال السؤال"
              className="flex h-9 w-9 items-center justify-center rounded-input bg-accent text-white transition-all duration-150 hover:bg-[#16302b] active:scale-[.96] disabled:opacity-30"
            >
              <ArrowUp className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Plain conditional (not AnimatePresence) — see WorkflowRunner note:
          the studio's edit-mode contentEditable hangs framer's exit tracking. */}
      {openDraft && (
        <DocumentStudio draft={openDraft} onClose={() => setOpenDraft(null)} />
      )}
    </div>
  );
}
