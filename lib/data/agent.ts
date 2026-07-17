/**
 * Seed catalog for the agentic layer — the "Hermes stand-in" for the demo.
 *
 * TONIGHT: classifyIntent() decides answer-vs-plan, selectPlan() keyword-matches
 * an executable request to one of these pre-built plans (each = a firm skill),
 * and artifactsFor() materializes the deliverables. executePlan() (in the api
 * layer) streams the steps.
 * TOMORROW: the real Hermes backend returns the SAME Plan / Artifact shapes and
 * makes the answer-vs-plan call itself, so nothing downstream changes.
 * See lib/api/agent.ts and docs/BACKEND-INTEGRATION.md §8.
 */
import type {
  Artifact,
  CaseSummaryArtifactData,
  Plan,
  ReasoningStep,
  TaskListArtifactData,
} from "@/lib/types";

// ----------------------------------------------------------------- plans
// Each plan is a firm SKILL the assistant can execute — its "mind". Skills are
// not a separate destination; they surface only when the assistant recommends
// one in answer to an executable request.

const CASE_ANALYSIS_PLAN: Plan = {
  id: "plan_case_analysis",
  title: "تحليل قضية وإعداد ملخص",
  capability: "تقييم القضايا",
  goal: "قراءة مستندات القضية، استخراج الوقائع الرئيسية، تحديد الأدلة الجوهرية، وإعداد مذكرة تقييم مع قائمة مهام للفريق.",
  steps: [
    { id: "s1", title: "مراجعة أولية للمستندات", tool: "document_extract", toolLabel: "قراءة المستندات", estimatedSeconds: 4 },
    { id: "s2", title: "استخراج الوقائع والتواريخ الرئيسية", tool: "summarize", estimatedSeconds: 3 },
    { id: "s3", title: "تحديد الأطراف والادعاءات", tool: "summarize", estimatedSeconds: 2 },
    { id: "s4", title: "البحث في السوابق ذات الصلة", tool: "rag_search", toolLabel: "المكتبة القانونية", estimatedSeconds: 5 },
    { id: "s5", title: "صياغة مذكرة التقييم", tool: "draft", estimatedSeconds: 4 },
    { id: "s6", title: "توليد قائمة المهام للفريق", tool: "draft", estimatedSeconds: 2 },
  ],
  expectedArtifacts: ["case_summary", "task_list"],
};

const CONTRACT_COMPARE_PLAN: Plan = {
  id: "plan_contract_compare",
  title: "مقارنة نسختي عقد",
  capability: "مراجعة العقود",
  goal: "تحديد البنود المضافة والمحذوفة والمعدلة، وتقييم أثرها على مصلحة الموكل.",
  steps: [
    { id: "s1", title: "قراءة النسختين", tool: "document_extract", toolLabel: "قراءة المستندات", estimatedSeconds: 3 },
    { id: "s2", title: "استخراج البنود من كلا النسختين", tool: "summarize", estimatedSeconds: 3 },
    { id: "s3", title: "مطابقة البنود وتحديد الفروق", estimatedSeconds: 4 },
    { id: "s4", title: "تقييم أثر التعديلات على الموكل", tool: "summarize", estimatedSeconds: 3 },
    { id: "s5", title: "إعداد تقرير المقارنة", tool: "draft", estimatedSeconds: 3 },
  ],
  expectedArtifacts: ["case_summary"],
};

const LEGAL_RESEARCH_PLAN: Plan = {
  id: "plan_legal_research",
  title: "بحث في السوابق القضائية",
  capability: "البحث القانوني",
  goal: "البحث في مبادئ محكمة النقض والقوانين ذات الصلة وإعداد مذكرة بحث موثّقة بالاستشهادات.",
  steps: [
    { id: "s1", title: "تحديد المسألة القانونية", estimatedSeconds: 2 },
    { id: "s2", title: "البحث في المكتبة القانونية", tool: "rag_search", toolLabel: "قاعدة البيانات", estimatedSeconds: 5 },
    { id: "s3", title: "تصنيف المبادئ المستخرجة", tool: "summarize", estimatedSeconds: 3 },
    { id: "s4", title: "صياغة مذكرة البحث مع الاستشهادات", tool: "draft", estimatedSeconds: 4 },
  ],
  expectedArtifacts: ["case_summary"],
};

const NOTICE_DRAFT_PLAN: Plan = {
  id: "plan_notice_draft",
  title: "صياغة إنذار رسمي",
  capability: "صياغة المحررات",
  goal: "إعداد إنذار على يد محضر بصيغة قانونية دقيقة تحفظ حقوق الموكل، مع خطوات المتابعة.",
  steps: [
    { id: "s1", title: "تحديد أطراف الإنذار", tool: "case_lookup", toolLabel: "ملف القضية", estimatedSeconds: 2 },
    { id: "s2", title: "استخراج الوقائع من مستندات القضية", tool: "document_extract", estimatedSeconds: 3 },
    { id: "s3", title: "البحث عن الأساس القانوني", tool: "rag_search", toolLabel: "المكتبة القانونية", estimatedSeconds: 3 },
    { id: "s4", title: "صياغة الإنذار", tool: "draft", estimatedSeconds: 4 },
    { id: "s5", title: "مراجعة نهائية وتوليد ملف Word", estimatedSeconds: 2 },
  ],
  expectedArtifacts: ["case_summary", "task_list"],
};

const GENERIC_PLAN: Plan = {
  id: "plan_generic",
  title: "تحليل الطلب وتنفيذه",
  capability: "المهام العامة",
  goal: "فهم المطلوب، جمع المعلومات من المصادر ذات الصلة، وتقديم النتيجة.",
  steps: [
    { id: "s1", title: "تحليل الطلب", estimatedSeconds: 2 },
    { id: "s2", title: "البحث في المصادر ذات الصلة", tool: "rag_search", toolLabel: "المكتبة القانونية", estimatedSeconds: 4 },
    { id: "s3", title: "إعداد الإجابة", tool: "draft", estimatedSeconds: 3 },
    { id: "s4", title: "توليد قائمة المهام", tool: "draft", estimatedSeconds: 2 },
  ],
  expectedArtifacts: ["task_list"],
};

export const PLAN_CATALOG: Plan[] = [
  CASE_ANALYSIS_PLAN,
  CONTRACT_COMPARE_PLAN,
  LEGAL_RESEARCH_PLAN,
  NOTICE_DRAFT_PLAN,
  GENERIC_PLAN,
];

/**
 * Keyword intent routing. Mirrors the four suggestion cards and the skills
 * catalog. A real backend replaces this with the model's own plan.
 */
export function selectPlan(message: string): Plan {
  const m = message.toLowerCase();

  if (/إنذار|محضر|صيغة رسمية|صِغ|صغ /.test(message) || /draft.*notice/.test(m))
    return NOTICE_DRAFT_PLAN;

  if (/قارن|مقارنة|نسخت|العقدين|redline/.test(message) || /compare.*contract/.test(m))
    return CONTRACT_COMPARE_PLAN;

  if (/سابقة|نقض|بحث قانوني|مبدأ|اجتهاد/.test(message) || /(precedent|research)/.test(m))
    return LEGAL_RESEARCH_PLAN;

  if (/لخّص|لخص|حلّل|حلل|ملخص|تحليل|مذكرة تقييم|مستندات|قضية/.test(message) ||
      /(analyze|summari[sz]e).*(case|document)/.test(m))
    return CASE_ANALYSIS_PLAN;

  return GENERIC_PLAN;
}

/**
 * Answer vs. execute. Informational questions ("ما حكم…", "هل يجوز…") get a
 * normal cited answer; requests to PRODUCE something ("صِغ", "أعدّ", "قارن",
 * "لخّص"…) get a recommended plan. This keyword pass is the tonight stand-in
 * for the model's own decision (see AgentRecommendation / docs §8).
 */
const ACTION_VERBS =
  /(^|\s)(صِغ|صغ|أعِدّ|أعد|اعد|جهّز|جهز|أنشئ|انشئ|اكتب|حرّر|حرر|قارن|قارِن|لخّص|لخص|حلّل|حلل|راجع|استخرج|ابحث|أعدّي)/;
const ACTION_NOUNS =
  /(إنذار|مذكرة|صحيفة|عقد|مقارنة|ملخّص|ملخص|تقرير|قائمة مهام|جدول زمني|مسودة|صيغة|سابقة|بحث قانوني)/;

export function classifyIntent(message: string): "answer" | "plan" {
  const en = message.toLowerCase();
  if (/(draft|prepare|compare|summari[sz]e|generate|create|write)\b/.test(en))
    return "plan";
  if (ACTION_VERBS.test(message) || ACTION_NOUNS.test(message)) return "plan";
  return "answer";
}

/** The short intro the assistant speaks above the plan card. */
export function leadFor(plan: Plan): string {
  const cap = plan.capability ? `ضمن مهارة «${plan.capability}»` : "";
  return `يمكنني تنفيذ ذلك ${cap}. أعددتُ خطة مقترحة — راجع الخطوات واعتمدها للبدء.`.replace(
    /\s+/g,
    " ",
  );
}

/**
 * The trust-block steps shown while the assistant decides. The middle step
 * makes the "reach into the firm's skills" moment visible.
 */
export function planningReasoning(plan: Plan): ReasoningStep[] {
  return [
    { id: "pr-1", kind: "analyze", label: "تحليل الطلب وتحديد المطلوب" },
    {
      id: "pr-2",
      kind: "search",
      label: "مطابقة المهارة المناسبة من مهارات المكتب",
      detail: plan.capability ? `المهارة: ${plan.capability}` : undefined,
    },
    { id: "pr-3", kind: "evaluate", label: "إعداد خطة تنفيذ مقترحة" },
  ];
}

// ------------------------------------------------------------- artifacts

const TASK_LIST: TaskListArtifactData = {
  kind: "task_list",
  id: "artifact_task_list",
  title: "قائمة المهام",
  tasks: [
    { id: "t1", title: "مراجعة عقد التوريد الأصلي", status: "done", assignee: "lawyer", assigneeName: "أحمد مصطفى" },
    { id: "t2", title: "طلب مستندات التسليم من الموكل", status: "review", assignee: "client" },
    { id: "t3", title: "إعداد صيغة الإنذار الرسمي", status: "pending", assignee: "lawyer", assigneeName: "أحمد مصطفى" },
    { id: "t4", title: "توكيل محضر لإعلان الإنذار", status: "pending", assignee: "lawyer" },
    { id: "t5", title: "توفير مراسلات التسوية السابقة", status: "review", assignee: "client" },
    { id: "t6", title: "مراجعة السوابق المتعلقة بالتعويض الاتفاقي", status: "done", assignee: "lawyer", assigneeName: "أحمد مصطفى" },
  ],
};

const CASE_SUMMARY: CaseSummaryArtifactData = {
  kind: "case_summary",
  id: "artifact_case_summary",
  title: "مذكرة التقييم",
  meta: "٤ صفحات · ١٢ استشهاد قانوني",
  summary:
    "تدور القضية حول إخلال المورّد بالتزاماته التعاقدية في توريد وتسليم الوحدة محل التعاقد ضمن المواعيد المتفق عليها، مع مطالبة الموكل بالتعويض الاتفاقي المنصوص عليه في العقد.",
  facts: [
    { label: "الموكل", value: "شركة النيل للتطوير العقاري" },
    { label: "الخصم", value: "مؤسسة الإنشاءات الحديثة" },
    { label: "محل النزاع", value: "التأخر في التسليم والتعويض الاتفاقي" },
    { label: "التكييف القانوني", value: "مسؤولية عقدية — إخلال بالتزام" },
  ],
  sections: [
    {
      heading: "الوقائع الجوهرية",
      body: "أبرم الطرفان عقد توريد في يناير ٢٠٢٥ يلتزم بموجبه المورّد بالتسليم خلال ستة أشهر. انقضى الأجل دون تنفيذ، ووجّه الموكل إخطارًا وديًّا لم يُستجب له.",
    },
    {
      heading: "الأساس القانوني",
      body: "تقوم المسؤولية على نص المادة ٢١٥ مدني في التعويض عن عدم الوفاء، مع إعمال شرط التعويض الاتفاقي وفق المادة ٢٢٣ مدني وسلطة المحكمة في تعديله.",
    },
    {
      heading: "التقييم والتوصية",
      body: "مركز الموكل قوي استنادًا إلى ثبوت التأخير وصحة الإخطار. يُوصى بتوجيه إنذار رسمي على يد محضر تمهيدًا لرفع الدعوى، مع تجهيز مستندات التسليم.",
    },
  ],
};

/** The artifacts a plan promises, materialized. */
export function artifactsFor(plan: Plan): Artifact[] {
  const out: Artifact[] = [];
  if (plan.expectedArtifacts.includes("case_summary")) out.push(CASE_SUMMARY);
  if (plan.expectedArtifacts.includes("task_list")) out.push(TASK_LIST);
  return out;
}
