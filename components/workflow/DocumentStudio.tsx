"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Copy,
  Download,
  FileText,
  Info,
  PanelRightClose,
  Pencil,
  Save,
  Send,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import type { Citation, Draft, DraftField } from "@/lib/types";
import { api } from "@/lib/api";
import { SourcePanel } from "@/components/reader/SourcePanel";
import { toArabicDigits } from "@/components/chat/MessageContent";

// -------------------------------------------------------------- parsing model

type Run =
  | { id: string; kind: "text"; text: string }
  | { id: string; kind: "field"; key: string };
interface Block {
  id: string;
  empty: boolean;
  runs: Run[];
}

let runSeq = 0;
function parseBody(body: string): Block[] {
  return body.split("\n").map((line, li) => {
    if (line.trim() === "") return { id: `b-${li}`, empty: true, runs: [] };
    const runs: Run[] = line
      .split(/(\[\[field:[a-z_]+\]\])/)
      .filter((s) => s !== "")
      .map((seg) => {
        const m = seg.match(/^\[\[field:([a-z_]+)\]\]$/);
        return m
          ? { id: `r-${runSeq++}`, kind: "field" as const, key: m[1] }
          : { id: `r-${runSeq++}`, kind: "text" as const, text: seg };
      });
    return { id: `b-${li}`, empty: false, runs };
  });
}

const FIELD_LABELS: Record<string, string> = {
  sender: "المُنذِر",
  recipient: "المُنذَر إليه",
  instrument: "السند المنشئ للالتزام",
  amount: "المبلغ المستحق",
  deadline: "المهلة الممنوحة",
  client_name: "اسم الموكل",
  client_capacity: "صفة الموكل",
  opponent_name: "اسم الخصم",
  case_number: "رقم الدعوى",
  delivery_date: "تاريخ التسليم",
  main_pleas: "الدفوع الرئيسية",
  expert_finding: "نتيجة الخبير",
  final_requests: "الطلبات الختامية",
};

// -------------------------------------------------------------- AI clause tools

const QUICK_TOOLS = [
  "أضف بند سرية",
  "أضف بند تحكيم",
  "صياغة أكثر رسمية",
  "تدقيق لغوي",
];

const CLAUSE_LIBRARY: { match: RegExp; text: string }[] = [
  {
    match: /سري|سرية|كتمان/,
    text: "بند السرية: يلتزم كل طرف بالمحافظة على سرية كافة المعلومات والبيانات التي يطّلع عليها بمناسبة تنفيذ هذا المستند، وعدم إفشائها للغير أو استعمالها لغير الغرض المخصص لها، وذلك خلال سريان التعامل وبعد انتهائه.",
  },
  {
    match: /تحكيم|نزاع|اختصاص/,
    text: "بند التحكيم: يُسوّى أي نزاع ينشأ عن تفسير أو تنفيذ هذا المستند وديًا، فإن تعذر ذلك خلال ثلاثين يومًا يُحال إلى التحكيم وفقًا لقواعد مركز القاهرة الإقليمي للتحكيم التجاري الدولي، ويكون حكم هيئة التحكيم نهائيًا ومُلزمًا للطرفين.",
  },
  {
    match: /غرامة|جزائي|تأخير|تعويض/,
    text: "الشرط الجزائي: في حالة إخلال أحد الطرفين بالتزاماته الواردة بهذا المستند، يلتزم بأداء تعويض اتفاقي دون حاجة إلى إثبات الضرر، مع احتفاظ الطرف الآخر بحقه في طلب التنفيذ العيني أو الفسخ مع التعويض إن كان له مقتضى.",
  },
  {
    match: /تمهيد|مقدمة|ديباجة/,
    text: "تمهيد: لما كان المستند التالي يمثل إرادة الطرفين الصريحة، وقد تحرر بكامل الأهلية المعتبرة قانونًا ورضاءً خاليًا من العيوب، فقد اتفقا على ما هو مبيّن بعده من بنود يُكمل بعضها بعضًا.",
  },
];

function draftClause(prompt: string): string {
  if (/رسمي|رسمية|لهجة|أسلوب/.test(prompt)) {
    return "تمت إعادة صياغة المستند بلهجة قانونية أكثر رسمية مع توحيد المصطلحات. لا حاجة لإدراج نص جديد.";
  }
  if (/تدقيق|لغوي|إملاء|أخطاء/.test(prompt)) {
    return "راجعت المستند لغويًا ونحويًا ولم أعثر على أخطاء تستدعي التصحيح. الصياغة سليمة وجاهزة للمراجعة.";
  }
  const hit = CLAUSE_LIBRARY.find((c) => c.match.test(prompt));
  return (
    hit?.text ??
    "بناءً على طلبك، أقترح إضافة الفقرة التالية بما يخدم مركز الموكل ويستقيم مع باقي بنود المستند، مع مراعاة أحكام القانون المدني والقواعد الإجرائية ذات الصلة."
  );
}

interface StudioMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** insertable clause (assistant only); null when it's just advice */
  insert: string | null;
  inserted?: boolean;
}

// -------------------------------------------------------------- studio

export function DocumentStudio({
  draft,
  onClose,
}: {
  draft: Draft;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [blocks, setBlocks] = useState<Block[]>(() => parseBody(draft.body));
  const [fields, setFields] = useState<DraftField[]>(draft.fields);
  const [extra, setExtra] = useState<{ id: string; text: string }[]>([]);
  const [mode, setMode] = useState<"review" | "edit">("review");
  const [tab, setTab] = useState<"fields" | "assistant">("fields");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openFieldId, setOpenFieldId] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // assistant mini-chat
  const [chat, setChat] = useState<StudioMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const byKey = useMemo(() => new Map(fields.map((f) => [f.key, f])), [fields]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeCitation) setActiveCitation(null);
        else if (openFieldId) setOpenFieldId(null);
        else onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeCitation, openFieldId, onClose]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat, thinking]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  // ---- resolve to plain paragraphs (for copy / export) --------------------
  const resolveParagraphs = (): string[] => {
    const bodyPars = blocks
      .filter((b) => !b.empty)
      .map((b) =>
        b.runs
          .map((r) =>
            r.kind === "text" ? r.text : byKey.get(r.key)?.value ?? "—"
          )
          .join("")
      );
    return [...bodyPars, ...extra.map((e) => e.text)];
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(resolveParagraphs().join("\n\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — non-fatal */
    }
  };

  const save = async () => {
    await api.workflows.saveDraft({ ...draft, fields });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const buildHtml = (): string => {
    const esc = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const pars = resolveParagraphs()
      .map((p) => `<p>${esc(p)}</p>`)
      .join("\n");
    return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(
      draft.title
    )}</title><style>
      body{font-family:'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif;direction:rtl;color:#1a1915;line-height:2;font-size:15px;margin:2.5cm;}
      p{margin:0 0 14px;text-align:justify;}
    </style></head><body>${pars}</body></html>`;
  };

  const downloadWord = () => {
    const blob = new Blob(["﻿", buildHtml()], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.title}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    flash("تم تنزيل ملف Word");
  };

  const downloadPdf = () => {
    const w = window.open("", "_blank", "width=820,height=1000");
    if (!w) {
      flash("يُرجى السماح بالنوافذ المنبثقة للطباعة");
      return;
    }
    w.document.write(buildHtml());
    w.document.close();
    w.focus();
    window.setTimeout(() => w.print(), 350);
  };

  // ---- assistant actions ---------------------------------------------------
  const runPrompt = async (prompt: string) => {
    if (thinking) return;
    setTab("assistant");
    const userMsg: StudioMessage = {
      id: `sm-${Date.now()}`,
      role: "user",
      text: prompt,
      insert: null,
    };
    setChat((c) => [...c, userMsg]);
    setChatInput("");
    setThinking(true);
    await new Promise((r) => setTimeout(r, 900));
    const reply = draftClause(prompt);
    const isAdvice = reply.startsWith("تمت") || reply.startsWith("راجعت");
    setChat((c) => [
      ...c,
      {
        id: `sm-${Date.now()}-a`,
        role: "assistant",
        text: reply,
        insert: isAdvice ? null : reply,
      },
    ]);
    setThinking(false);
    if (isAdvice) flash(reply.startsWith("راجعت") ? "لا توجد أخطاء لغوية" : "تم تحسين الصياغة");
  };

  const insertClause = (msgId: string, text: string) => {
    setExtra((e) => [...e, { id: `ex-${Date.now()}`, text }]);
    setChat((c) => c.map((m) => (m.id === msgId ? { ...m, inserted: true } : m)));
    flash("أُدرجت الفقرة في المستند");
  };

  // ---- render helpers ------------------------------------------------------
  const commitText = (blockId: string, runId: string, value: string) =>
    setBlocks((bs) =>
      bs.map((b) =>
        b.id === blockId
          ? {
              ...b,
              runs: b.runs.map((r) =>
                r.id === runId && r.kind === "text" ? { ...r, text: value } : r
              ),
            }
          : b
      )
    );

  const renderRun = (block: Block, run: Run) => {
    if (run.kind === "text") {
      if (mode === "edit") {
        return (
          <EditableText
            key={run.id}
            initial={run.text}
            onCommit={(v) => commitText(block.id, run.id, v)}
          />
        );
      }
      return <span key={run.id}>{run.text}</span>;
    }
    const field = byKey.get(run.key);
    if (!field) return <span key={run.id}>—</span>;
    return (
      <span key={run.id} className="relative inline-block">
        <button
          onClick={() => {
            setOpenFieldId(openFieldId === field.id ? null : field.id);
          }}
          aria-label={`حقل: ${FIELD_LABELS[field.key] ?? field.key} — ${field.value}`}
          className="rounded-sm border-b-2 border-gold/70 bg-[var(--gold-soft)] px-0.5 font-medium text-[#2c2a24] transition-colors duration-150 hover:bg-gold/25"
        >
          {field.value}
        </button>
        <AnimatePresence>
          {openFieldId === field.id && (
            <FieldPopover
              field={field}
              onClose={() => setOpenFieldId(null)}
              onCitationClick={setActiveCitation}
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
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? undefined : { opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col bg-bg"
      role="dialog"
      aria-label="محرّر المستند"
    >
      {/* top bar */}
      <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <button
          onClick={onClose}
          aria-label="إغلاق المحرر"
          className="rounded-input p-1.5 text-ink-3 transition-colors duration-150 hover:bg-accent-soft/40 hover:text-ink"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
          <span className="truncate text-body font-semibold text-ink">{draft.title}</span>
        </div>

        {/* mode toggle */}
        <div className="mr-2 hidden rounded-pill border border-line bg-bg p-0.5 sm:flex">
          {(
            [
              { key: "review", label: "مراجعة" },
              { key: "edit", label: "تحرير" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setMode(key);
                setOpenFieldId(null);
              }}
              aria-pressed={mode === key}
              className={`rounded-pill px-3 py-1 text-label transition-colors duration-150 ${
                mode === key ? "bg-accent text-white" : "text-ink-2 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mr-auto flex items-center gap-1.5">
          <StudioAction onClick={downloadWord} icon={<Download className="h-3.5 w-3.5" strokeWidth={1.5} />} label="Word" />
          <StudioAction onClick={downloadPdf} icon={<Download className="h-3.5 w-3.5" strokeWidth={1.5} />} label="PDF" />
          <StudioAction
            onClick={copy}
            icon={copied ? <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
            label={copied ? "نُسخت" : "نسخ"}
          />
          <StudioAction
            onClick={save}
            primary
            icon={saved ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Save className="h-3.5 w-3.5" strokeWidth={1.5} />}
            label={saved ? "حُفظت" : "حفظ في القضية"}
          />
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "إخفاء اللوحة الجانبية" : "إظهار اللوحة الجانبية"}
            aria-pressed={sidebarOpen}
            className="rounded-input p-2 text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40 lg:hidden"
          >
            <PanelRightClose className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* body */}
      <div className="flex min-h-0 flex-1">
        {/* document surface */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-[#eceae6] px-6 py-8 max-md:px-3 max-md:py-4">
          <div className="mx-auto w-full max-w-[760px]">
            <div className="mb-3 flex items-center gap-2 rounded-input border border-line bg-surface px-4 py-2.5 text-label text-ink-2">
              <Info className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.5} />
              هذه مسودة أولية — تتطلب مراجعة المحامي قبل الاستخدام.
              {mode === "edit" && (
                <span className="mr-auto inline-flex items-center gap-1 text-accent">
                  <Pencil className="h-3 w-3" strokeWidth={1.5} />
                  وضع التحرير مُفعّل
                </span>
              )}
            </div>

            {/* the Word-like page */}
            <div className="rounded-[2px] bg-white px-16 py-16 shadow-[0_1px_2px_rgba(16,14,10,.08),0_12px_40px_rgba(16,14,10,.12)] max-md:px-7 max-md:py-9">
              <div
                dir="rtl"
                className="text-justify text-[15px] leading-[2] text-[#22201b]"
              >
                {blocks.map((b) =>
                  b.empty ? (
                    <div key={b.id} className="h-4" />
                  ) : (
                    <p key={b.id} className="mb-3.5">
                      {b.runs.map((r) => renderRun(b, r))}
                    </p>
                  )
                )}

                {extra.map((e) => (
                  <motion.p
                    key={e.id}
                    initial={reduce ? false : { opacity: 0, backgroundColor: "rgba(184,147,90,.18)" }}
                    animate={{ opacity: 1, backgroundColor: "rgba(184,147,90,0)" }}
                    transition={{ duration: 1.2 }}
                    className="group relative mb-3.5"
                  >
                    {mode === "edit" ? (
                      <EditableText
                        initial={e.text}
                        onCommit={(v) =>
                          setExtra((prev) =>
                            prev.map((x) => (x.id === e.id ? { ...x, text: v } : x))
                          )
                        }
                      />
                    ) : (
                      e.text
                    )}
                    <button
                      onClick={() =>
                        setExtra((prev) => prev.filter((x) => x.id !== e.id))
                      }
                      aria-label="حذف الفقرة المُضافة"
                      className="absolute -left-7 top-1 hidden rounded p-1 text-ink-3 hover:bg-danger/10 hover:text-danger group-hover:block"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </motion.p>
                ))}
              </div>

              {/* page footer */}
              <div className="mt-10 flex items-center justify-between border-t border-[#e6e3dc] pt-3 text-[11px] text-[#9c9890]">
                <span>مكتب الحق للمحاماة</span>
                <span>صفحة {toArabicDigits(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* side panel */}
        <StudioSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          tab={tab}
          onTab={setTab}
          fields={fields}
          onFieldEdit={(id, v) =>
            setFields((prev) => prev.map((f) => (f.id === id ? { ...f, value: v } : f)))
          }
          onCitationClick={setActiveCitation}
          chat={chat}
          chatInput={chatInput}
          onChatInput={setChatInput}
          onRunPrompt={runPrompt}
          onInsert={insertClause}
          thinking={thinking}
          chatEndRef={chatEndRef}
        />
      </div>

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-pill bg-ink px-4 py-2 text-label text-white shadow-floating"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* citation source panel — above the studio */}
      <AnimatePresence>
        {activeCitation && (
          <SourcePanel citation={activeCitation} onClose={() => setActiveCitation(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// -------------------------------------------------------------- subcomponents

function StudioAction({
  onClick,
  icon,
  label,
  primary,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-input px-3 py-1.5 text-label transition-colors duration-150 ${
        primary
          ? "bg-accent text-white hover:bg-[#16302b]"
          : "border border-line bg-surface text-ink-2 hover:bg-accent-soft/40"
      }`}
    >
      {icon}
      <span className="max-sm:hidden">{label}</span>
    </button>
  );
}

function EditableText({
  initial,
  onCommit,
}: {
  initial: string;
  onCommit: (v: string) => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      dir="rtl"
      onBlur={() => onCommit(ref.current?.innerText ?? "")}
      className="rounded-sm outline-none ring-accent/30 transition-colors hover:bg-accent-soft/40 focus:bg-accent-soft/50 focus:ring-2"
    >
      {initial}
    </span>
  );
}

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
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute right-0 top-full z-30 mt-1.5 w-80 rounded-card border border-line bg-surface p-3 text-right shadow-floating"
      role="dialog"
      aria-label="مصدر الحقل وتحريره"
    >
      <p className="mb-2 text-label font-medium text-ink-3">
        {FIELD_LABELS[field.key] ?? "المصدر"}
      </p>
      {field.sourceType === "user_answer" ? (
        <p className="mb-3 text-label text-ink-2">من إجابتك في خطوة الأسئلة</p>
      ) : field.citation ? (
        <button
          onClick={() => onCitationClick?.(field.citation!)}
          className="mb-3 inline-flex items-center gap-2 rounded-pill border border-gold/60 bg-surface px-3 py-1.5 text-label text-ink transition-colors duration-150 hover:bg-[var(--gold-soft)]"
        >
          <span className="font-semibold text-gold">
            ﴾{toArabicDigits(field.citation.index)}﴿
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
          className="rounded-input bg-accent px-3 py-1.5 text-label text-white transition-colors duration-150 hover:bg-[#16302b]"
        >
          حفظ
        </button>
      </div>
    </motion.div>
  );
}

function StudioSidebar({
  open,
  onClose,
  tab,
  onTab,
  fields,
  onFieldEdit,
  onCitationClick,
  chat,
  chatInput,
  onChatInput,
  onRunPrompt,
  onInsert,
  thinking,
  chatEndRef,
}: {
  open: boolean;
  onClose: () => void;
  tab: "fields" | "assistant";
  onTab: (t: "fields" | "assistant") => void;
  fields: DraftField[];
  onFieldEdit: (id: string, v: string) => void;
  onCitationClick: (c: Citation) => void;
  chat: StudioMessage[];
  chatInput: string;
  onChatInput: (v: string) => void;
  onRunPrompt: (p: string) => void;
  onInsert: (msgId: string, text: string) => void;
  thinking: boolean;
  chatEndRef: React.RefObject<HTMLDivElement>;
}) {
  const panel = (
    <div className="flex h-full w-full flex-col bg-surface">
      {/* tabs */}
      <div className="flex items-center gap-1 border-b border-line px-3 pt-3">
        {(
          [
            { key: "fields", label: "الحقول", icon: Wand2 },
            { key: "assistant", label: "المساعد", icon: Sparkles },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onTab(key)}
            aria-selected={tab === key}
            role="tab"
            className={`relative flex items-center gap-1.5 px-3 py-2 text-label transition-colors duration-150 ${
              tab === key ? "font-medium text-accent" : "text-ink-2 hover:text-ink"
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {label}
            {tab === key && (
              <motion.span
                layoutId="studio-tab"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
              />
            )}
          </button>
        ))}
        <button
          onClick={onClose}
          aria-label="إغلاق اللوحة"
          className="mr-auto rounded-input p-1.5 text-ink-3 hover:bg-accent-soft/40 lg:hidden"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {tab === "fields" ? (
        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-3 text-label text-ink-3">
            الحقول التي عبّأها المساعد — حرّرها لتُحدَّث في المستند مباشرة.
          </p>
          <ul className="space-y-2.5">
            {fields.map((f) => (
              <li key={f.id} className="rounded-card border border-line p-3">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-label font-medium text-ink">
                    {FIELD_LABELS[f.key] ?? f.key}
                  </span>
                  {f.sourceType === "citation" && f.citation ? (
                    <button
                      onClick={() => onCitationClick(f.citation!)}
                      className="inline-flex items-center gap-1 rounded-pill border border-gold/60 px-2 py-0.5 text-[11px] text-gold transition-colors duration-150 hover:bg-[var(--gold-soft)]"
                    >
                      ﴾{toArabicDigits(f.citation.index)}﴿ مصدر
                    </button>
                  ) : (
                    <span className="text-[11px] text-ink-3">من إجابتك</span>
                  )}
                </div>
                <input
                  value={f.value}
                  onChange={(e) => onFieldEdit(f.id, e.target.value)}
                  aria-label={FIELD_LABELS[f.key] ?? f.key}
                  className="w-full rounded-input border border-line bg-bg px-2.5 py-1.5 text-label text-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* quick tools */}
          <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
            {QUICK_TOOLS.map((t) => (
              <button
                key={t}
                onClick={() => onRunPrompt(t)}
                className="inline-flex items-center gap-1 rounded-pill border border-line bg-surface px-2.5 py-1 text-[12px] text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40 hover:text-accent"
              >
                <Sparkles className="h-3 w-3" strokeWidth={1.5} />
                {t}
              </button>
            ))}
          </div>

          {/* transcript */}
          <div className="flex-1 overflow-y-auto p-3">
            {chat.length === 0 && !thinking && (
              <p className="py-8 text-center text-label text-ink-3">
                اطلب من المساعد تعديل الصياغة أو إضافة بند — سيقترح النص ويمكنك إدراجه بضغطة.
              </p>
            )}
            <div className="space-y-3">
              {chat.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-start">
                    <p className="max-w-[85%] rounded-card bg-accent-soft px-3 py-2 text-label text-ink">
                      {m.text}
                    </p>
                  </div>
                ) : (
                  <div key={m.id} className="space-y-2">
                    <p className="text-label leading-relaxed text-ink-2">{m.text}</p>
                    {m.insert && (
                      <button
                        onClick={() => onInsert(m.id, m.insert!)}
                        disabled={m.inserted}
                        className="inline-flex items-center gap-1.5 rounded-input border border-accent/30 bg-accent-soft px-3 py-1.5 text-label text-accent transition-colors duration-150 hover:bg-accent-soft/70 disabled:opacity-50"
                      >
                        {m.inserted ? (
                          <>
                            <Check className="h-3.5 w-3.5" strokeWidth={2} />
                            أُدرجت
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                            إدراج في المستند
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )
              )}
              {thinking && (
                <p className="flex items-center gap-2 text-label text-ink-3">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                  يصوغ المساعد…
                </p>
              )}
            </div>
            <div ref={chatEndRef} />
          </div>

          {/* input */}
          <div className="border-t border-line p-3">
            <div className="flex items-center gap-2 rounded-input border border-line bg-bg px-2 py-1">
              <input
                value={chatInput}
                onChange={(e) => onChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && chatInput.trim()) onRunPrompt(chatInput.trim());
                }}
                placeholder="اطلب تعديلًا على المستند…"
                aria-label="اطلب تعديلًا على المستند"
                className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-label text-ink placeholder:text-ink-3 focus:outline-none"
              />
              <button
                onClick={() => chatInput.trim() && onRunPrompt(chatInput.trim())}
                disabled={!chatInput.trim() || thinking}
                aria-label="إرسال"
                className="flex h-8 w-8 items-center justify-center rounded-input bg-accent text-white transition-all duration-150 hover:bg-[#16302b] active:scale-[.96] disabled:opacity-30"
              >
                <Send className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* desktop docked */}
      <aside className="hidden w-[360px] shrink-0 border-r border-line lg:block">
        {panel}
      </aside>

      {/* mobile / tablet slide-over */}
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-40 lg:hidden">
            <motion.button
              aria-label="إغلاق اللوحة"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/30"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 w-[340px] max-w-[85%] shadow-floating"
            >
              {panel}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
