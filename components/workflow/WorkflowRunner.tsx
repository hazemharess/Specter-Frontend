"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronDown,
  FileText,
  Maximize2,
  UploadCloud,
} from "lucide-react";
import type {
  Case,
  Draft,
  ReasoningStep,
  Workflow,
  WorkflowStep,
} from "@/lib/types";
import { api } from "@/lib/api";
import { ReasoningSteps } from "@/components/chat/ReasoningSteps";
import { DocumentStudio } from "@/components/workflow/DocumentStudio";
import { Button, Spinner } from "@/components/ui";

interface UploadedFile {
  name: string;
  status: "indexing" | "ready";
}

const GENERATE_STEPS: ReasoningStep[] = [
  { id: "g-1", kind: "analyze", label: "تحليل الإجابات والمستندات" },
  {
    id: "g-2",
    kind: "search",
    label: "استخراج البيانات من المصادر",
    chips: [{ label: "عقد_البيع_الابتدائي.pdf", icon: "pdf" }],
  },
  { id: "g-3", kind: "evaluate", label: "تحرير الصياغة القانونية" },
];

/** Connector line between steps — draws downward as the flow advances. */
function Connector({ drawn }: { drawn: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <svg width="2" height="28" viewBox="0 0 2 28">
        <motion.line
          x1="1"
          y1="0"
          x2="1"
          y2="28"
          stroke="var(--border)"
          strokeWidth="2"
        />
        <motion.line
          x1="1"
          y1="0"
          x2="1"
          y2="28"
          stroke="var(--accent)"
          strokeWidth="2"
          initial={reduce ? { pathLength: drawn ? 1 : 0 } : { pathLength: 0 }}
          animate={{ pathLength: drawn ? 1 : 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}

export function WorkflowRunner({ workflow }: { workflow: Workflow }) {
  const steps = workflow.steps ?? [];
  const [current, setCurrent] = useState(0);
  const [cases, setCases] = useState<Case[]>([]);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerInput, setAnswerInput] = useState("");
  const [generateVisible, setGenerateVisible] = useState<ReasoningStep[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const generatingRef = useRef(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    api.cases.list().then(setCases);
  }, []);

  const advance = useCallback(() => setCurrent((c) => c + 1), []);

  // generate step: run the reasoning animation, then resolve the draft
  useEffect(() => {
    const step = steps[current];
    if (!step || step.kind !== "generate" || generatingRef.current) return;
    generatingRef.current = true;
    let cancelled = false;

    (async () => {
      for (const s of GENERATE_STEPS) {
        if (cancelled) return;
        setGenerateVisible((prev) => [...prev, s]);
        await new Promise((r) => setTimeout(r, 700));
      }
      const d = await api.workflows.generateDraft({
        workflowId: workflow.id,
        caseId,
        answers,
      });
      if (!cancelled) {
        setDraft(d);
        setStudioOpen(true); // pop the full editor open automatically
        advance();
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, steps, workflow.id]);

  const handleFiles = async (names: string[]) => {
    for (const name of names) {
      setFiles((prev) => [...prev, { name, status: "indexing" }]);
      api.workflows.uploadDocument({ name }).then(() => {
        setFiles((prev) =>
          prev.map((f) => (f.name === name ? { ...f, status: "ready" } : f))
        );
      });
    }
  };

  const questions = steps.find((s) => s.kind === "slot_questions")?.questions ?? [];

  const submitAnswer = () => {
    const q = questions[questionIndex];
    const value = answerInput.trim();
    if (!q || !value) return;
    setAnswers((prev) => ({ ...prev, [q.slot]: value }));
    setAnswerInput("");
    if (questionIndex + 1 < questions.length) {
      setQuestionIndex((i) => i + 1);
    } else {
      advance();
    }
  };

  const summaryFor = (step: WorkflowStep): string => {
    switch (step.kind) {
      case "case_select":
        return caseId
          ? cases.find((c) => c.id === caseId)?.number ?? ""
          : "بدون قضية";
      case "file_upload":
        return files.length > 0 ? `${files.length} ملفات مرفقة` : "بدون مستندات";
      case "slot_questions":
        return `${Object.keys(answers).length} إجابات`;
      case "generate":
        return "تم توليد المسودة";
      default:
        return "";
    }
  };

  const renderActive = (step: WorkflowStep) => {
    switch (step.kind) {
      case "case_select":
        return (
          <div className="space-y-4">
            <div className="relative">
              <select
                value={caseId ?? ""}
                onChange={(e) => setCaseId(e.target.value || null)}
                aria-label="اختر القضية"
                className="w-full appearance-none rounded-input border border-line bg-surface px-4 py-2.5 text-body text-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
              >
                <option value="">بدون قضية</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.number} — {c.title}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
                strokeWidth={1.5}
              />
            </div>
            <Button onClick={advance}>متابعة</Button>
          </div>
        );

      case "file_upload": {
        const allReady = files.length > 0 && files.every((f) => f.status === "ready");
        return (
          <div className="space-y-4">
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = Array.from(e.dataTransfer.files).map((f) => f.name);
                void handleFiles(dropped.length ? dropped : ["عقد_البيع_الابتدائي.pdf"]);
              }}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-card border border-dashed border-line bg-bg px-6 py-10 text-center transition-colors duration-150 hover:border-accent/40 hover:bg-accent-soft/30"
            >
              <UploadCloud className="h-6 w-6 text-ink-3" strokeWidth={1.5} />
              <span className="text-body text-ink-2">
                اسحب الملفات هنا أو اضغط للاختيار
              </span>
              <span className="text-label text-ink-3">PDF أو Word — حتى 25 م.ب</span>
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []).map((f) => f.name);
                  void handleFiles(picked.length ? picked : ["عقد_البيع_الابتدائي.pdf"]);
                }}
              />
            </label>
            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((f) => (
                  <li
                    key={f.name}
                    className="flex items-center gap-3 rounded-input border border-line bg-surface px-3 py-2 text-label text-ink"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.5} />
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    {f.status === "indexing" ? (
                      <span className="inline-flex items-center gap-1.5 text-ink-3">
                        <Spinner className="h-3.5 w-3.5" />
                        جارٍ الفهرسة…
                      </span>
                    ) : (
                      <motion.span
                        initial={reduce ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      >
                        <Check className="h-4 w-4 text-accent" strokeWidth={2} />
                      </motion.span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Button onClick={advance} disabled={!allReady}>
              متابعة
            </Button>
          </div>
        );
      }

      case "slot_questions": {
        const q = questions[questionIndex];
        return (
          <div className="space-y-4">
            {/* answered so far */}
            {questions.slice(0, questionIndex).map((prev) => (
              <div key={prev.id} className="space-y-2">
                <p className="text-body text-ink">{prev.question}</p>
                <div className="flex justify-start">
                  <p className="rounded-card bg-accent-soft px-3.5 py-2 text-body text-ink">
                    {answers[prev.slot]}
                  </p>
                </div>
              </div>
            ))}
            {q && (
              <motion.div
                key={q.id}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-3"
              >
                <p className="text-body text-ink">{q.question}</p>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
                    placeholder={q.placeholder}
                    aria-label={q.question}
                    className="min-w-0 flex-1 rounded-input border border-line bg-surface px-3.5 py-2 text-body text-ink placeholder:text-ink-3 focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
                  />
                  <Button onClick={submitAnswer} disabled={!answerInput.trim()}>
                    إجابة
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        );
      }

      case "generate":
        return (
          <div className="py-2">
            <ReasoningSteps steps={generateVisible} working collapsed={false} />
            <p className="text-label text-ink-3">جارٍ تحرير المسودة…</p>
          </div>
        );

      case "draft":
        return draft ? (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {/* mini document preview */}
            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-[3px] border border-line bg-white p-2 shadow-raised">
              <div className="space-y-1">
                <div className="mx-auto h-1 w-8 rounded bg-[#d9d5cc]" />
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 rounded bg-[#e6e3dc]"
                    style={{ width: `${70 + ((i * 13) % 30)}%` }}
                  />
                ))}
                <div className="h-1 w-1/2 rounded bg-[var(--gold-soft)]" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body font-medium text-ink">{draft.title}</p>
              <p className="mt-0.5 text-label text-ink-3">
                جاهزة للمراجعة — افتح المحرّر لتعديل الحقول والصياغة والتنزيل بصيغة Word أو PDF.
              </p>
              <Button className="mt-3" onClick={() => setStudioOpen(true)}>
                <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
                افتح محرّر المستند
              </Button>
            </div>
          </div>
        ) : null;
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 max-md:px-4">
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <div key={step.id}>
            {i > 0 && <Connector drawn={i <= current} />}
            <motion.section
              layout={!reduce}
              aria-current={state === "active" ? "step" : undefined}
              className={`rounded-card border bg-surface transition-colors duration-300 ${
                state === "active"
                  ? "border-accent/40 shadow-raised"
                  : "border-line"
              } ${state === "todo" ? "opacity-50" : ""}`}
            >
              {/* header row */}
              <div className="flex items-center gap-3 px-5 py-4">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-label ${
                    state === "done"
                      ? "border-accent bg-accent text-white"
                      : state === "active"
                        ? "border-accent text-accent"
                        : "border-line text-ink-3"
                  }`}
                >
                  {state === "done" ? (
                    <motion.span
                      initial={reduce ? false : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </motion.span>
                  ) : (
                    i + 1
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-ink">{step.title}</p>
                  {state === "done" ? (
                    <p className="truncate text-label text-ink-3">{summaryFor(step)}</p>
                  ) : (
                    state === "active" && (
                      <p className="text-label text-ink-3">{step.description}</p>
                    )
                  )}
                </div>
              </div>

              {/* body */}
              <AnimatePresence initial={false}>
                {state === "active" && (
                  <motion.div
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduce ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-line px-5 py-5">
                      {renderActive(step)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </div>
        );
      })}

      {/* Plain conditional (not AnimatePresence): the studio contains
          contentEditable regions in edit mode, which make framer's exit
          tracking hang and leave an invisible overlay blocking the page.
          Unmounting instantly on close is correct for a full-screen editor. */}
      {studioOpen && draft && (
        <DocumentStudio draft={draft} onClose={() => setStudioOpen(false)} />
      )}
    </div>
  );
}
