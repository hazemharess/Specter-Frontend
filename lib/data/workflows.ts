import type { Draft, DraftField, Workflow } from "@/lib/types";
import {
  CITE_CONTRACT_DELIVERY,
  CITE_EXPERT_FINDING,
} from "@/lib/data/conversations";

export const WORKFLOWS: Workflow[] = [
  {
    id: "wf-claim",
    slug: "claim",
    title: "صياغة صحيفة دعوى",
    description: "إعداد صحيفة دعوى كاملة من وقائع القضية ومستنداتها",
    icon: "scroll-text",
    stepCount: 6,
    estimatedMinutes: 5,
    steps: null,
  },
  {
    id: "wf-defense",
    slug: "defense",
    title: "مذكرة دفاع",
    description: "صياغة مذكرة دفاع مبنية على أوراق القضية ودفوع الخصم",
    icon: "shield",
    stepCount: 5,
    estimatedMinutes: 4,
    steps: [
      {
        id: "wfd-1",
        kind: "case_select",
        title: "اختيار القضية",
        description: "اختر القضية التي ستُحرر المذكرة في ملفها",
      },
      {
        id: "wfd-2",
        kind: "file_upload",
        title: "رفع المستندات",
        description: "أرفق مذكرة الخصم وأي مستندات ترغب في الرد عليها",
      },
      {
        id: "wfd-3",
        kind: "slot_questions",
        title: "أسئلة المساعد",
        description: "أجب عن أسئلة قصيرة لتحديد إطار الدفاع",
        questions: [
          {
            id: "q-def-1",
            question: "ما صفة الموكل في الدعوى (مدعٍ أم مدعى عليه)؟",
            slot: "client_capacity",
            placeholder: "مثال: مدعى عليه",
          },
          {
            id: "q-def-2",
            question: "ما أبرز الدفوع التي تريد التركيز عليها؟",
            slot: "main_pleas",
            placeholder: "مثال: بطلان الإعلان، انتفاء الخطأ العقدي",
          },
          {
            id: "q-def-3",
            question: "ما الطلبات الختامية المطلوب إيرادها بالمذكرة؟",
            slot: "final_requests",
            placeholder: "مثال: أصليًا رفض الدعوى، واحتياطيًا ندب خبير",
          },
        ],
      },
      {
        id: "wfd-4",
        kind: "generate",
        title: "توليد المسودة",
        description: "يحلل المساعد الأوراق ويحرر المذكرة",
      },
      {
        id: "wfd-5",
        kind: "draft",
        title: "المسودة",
        description: "راجع المسودة وحرر الحقول قبل الاعتماد",
      },
    ],
  },
  {
    id: "wf-warning",
    slug: "warning",
    title: "إنذار على يد محضر",
    description: "تحرير إنذار رسمي جاهز للإعلان على يد محضر",
    icon: "bell-ring",
    stepCount: 5,
    estimatedMinutes: 3,
    steps: [
      {
        id: "wfw-1",
        kind: "case_select",
        title: "اختيار القضية",
        description: "اربط الإنذار بقضية قائمة أو تابع بدون قضية",
      },
      {
        id: "wfw-2",
        kind: "file_upload",
        title: "رفع المستندات",
        description: "أرفق العقد أو السند المنشئ للالتزام",
      },
      {
        id: "wfw-3",
        kind: "slot_questions",
        title: "أسئلة المساعد",
        description: "ثلاثة أسئلة لتحديد أطراف الإنذار ومضمونه",
        questions: [
          {
            id: "q-warn-1",
            question: "من هو المُنذَر إليه؟",
            slot: "recipient",
            placeholder: "الاسم الكامل وصفته",
          },
          {
            id: "q-warn-2",
            question: "ما قيمة المبلغ المستحق؟",
            slot: "amount",
            placeholder: "مثال: 250,000 جنيه",
          },
          {
            id: "q-warn-3",
            question: "ما المهلة الممنوحة للسداد؟",
            slot: "deadline",
            placeholder: "مثال: خمسة عشر يومًا",
          },
        ],
      },
      {
        id: "wfw-4",
        kind: "generate",
        title: "توليد المسودة",
        description: "يحرر المساعد الإنذار من إجاباتك ومستنداتك",
      },
      {
        id: "wfw-5",
        kind: "draft",
        title: "المسودة",
        description: "راجع الإنذار وحرر الحقول قبل الطباعة",
      },
    ],
  },
  {
    id: "wf-contract-review",
    slug: "contract-review",
    title: "مراجعة عقد",
    description: "فحص بنود العقد ورصد المخاطر والبنود المجحفة",
    icon: "file-search",
    stepCount: 4,
    estimatedMinutes: 4,
    steps: null,
  },
  {
    id: "wf-poa",
    slug: "poa",
    title: "صياغة توكيل",
    description: "إعداد توكيل رسمي عام أو خاص بصيغة الشهر العقاري",
    icon: "pen-line",
    stepCount: 3,
    estimatedMinutes: 2,
    steps: null,
  },
  {
    id: "wf-appeal",
    slug: "appeal",
    title: "صحيفة استئناف",
    description: "تحرير صحيفة استئناف بأسباب الطعن على الحكم",
    icon: "corner-up-left",
    stepCount: 6,
    estimatedMinutes: 6,
    steps: null,
  },
  {
    id: "wf-summary",
    slug: "summary",
    title: "تلخيص ملف قضية",
    description: "ملخص تنفيذي للوقائع والمستندات وحالة الدعوى",
    icon: "list-tree",
    stepCount: 3,
    estimatedMinutes: 3,
    steps: null,
  },
  {
    id: "wf-compare",
    slug: "compare",
    title: "مقارنة نسختي عقد",
    description: "رصد الفروق بين نسختين وتحديد أثر كل تعديل",
    icon: "git-compare",
    stepCount: 4,
    estimatedMinutes: 3,
    steps: null,
  },
];

// ------------------------------------------------------------ draft bodies
// AI-filled fields appear as [[field:key]] tokens; DraftField records where
// each value came from (user answer vs. document citation).

export const WARNING_DRAFT_BODY = `إنذار على يد محضر

إنه في يوم           الموافق     /    / 2026

بناءً على طلب [[field:sender]]، ومحله المختار مكتب الحق للمحاماة — 22 شارع قصر النيل، القاهرة.

أنا محضر محكمة           الجزئية، قد انتقلت وأعلنت:

[[field:recipient]]

الموضوع

بموجب [[field:instrument]] ترتب في ذمة المنذر إليه مبلغ [[field:amount]] مستحق الأداء للمنذر، وقد حل أجل الوفاء دون أن يقوم المنذر إليه بالسداد رغم المطالبات الودية المتكررة.

وحيث إن المنذر يحتفظ بكامل حقوقه القانونية، فإنه يوجه هذا الإنذار للمنذر إليه للوفاء بالمبلغ المذكور خلال [[field:deadline]] من تاريخ إعلانه بهذا الإنذار.

لذلك

فإن المنذر ينذر المنذر إليه بضرورة سداد مبلغ [[field:amount]] خلال [[field:deadline]]، وإلا اضطر المنذر آسفًا إلى اتخاذ كافة الإجراءات القانونية قبله للمطالبة بأصل الدين والفوائد القانونية والتعويضات، مع تحميله كافة المصاريف ومقابل أتعاب المحاماة.

مع حفظ كافة الحقوق الأخرى للمنذر أيًا ما كانت،

وكيل المنذر
مكتب الحق للمحاماة`;

export const DEFENSE_DRAFT_BODY = `محكمة جنوب القاهرة الابتدائية
الدائرة 12 مدني كلي

مذكرة بدفاع

[[field:client_name]] ([[field:client_capacity]])

ضد

[[field:opponent_name]]

في الدعوى رقم [[field:case_number]]

أولًا — في الوقائع

تخلص وقائع الدعوى في أن الطرفين ارتبطا بعقد بيع ابتدائي مؤرخ 5 مارس 2023، التزم بمقتضاه البائع بتسليم الوحدة محل التعاقد كاملة التشطيب في موعد أقصاه [[field:delivery_date]]، وقد أخل البائع بهذا الالتزام على النحو الثابت بتقرير الخبير المنتدب.

ثانيًا — في الدفاع

[[field:main_pleas]]

وحيث انتهى تقرير الخبير الهندسي إلى أن [[field:expert_finding]]، فإن ركن الإخلال العقدي يكون ثابتًا في جانب الخصم ثبوتًا لا تجدي معه المنازعة.

ثالثًا — الطلبات

بناءً على ما تقدم، يلتمس مقدمها الحكم:
[[field:final_requests]]

مع إلزام الخصم بالمصاريف ومقابل أتعاب المحاماة.

وكيل المدعية
مكتب الحق للمحاماة`;

export function buildWarningDraft(
  answers: Record<string, string>,
  caseId: string | null
): Draft {
  const fields: DraftField[] = [
    {
      id: "f-sender",
      key: "sender",
      value: "شركة النيل للتطوير العقاري",
      sourceType: "citation",
      citation: { ...CITE_CONTRACT_DELIVERY, index: 1 },
    },
    {
      id: "f-recipient",
      key: "recipient",
      value: answers["recipient"] || "—",
      sourceType: "user_answer",
    },
    {
      id: "f-instrument",
      key: "instrument",
      value: "عقد البيع الابتدائي المؤرخ 5 مارس 2023",
      sourceType: "citation",
      citation: { ...CITE_CONTRACT_DELIVERY, index: 1 },
    },
    {
      id: "f-amount",
      key: "amount",
      value: answers["amount"] || "—",
      sourceType: "user_answer",
    },
    {
      id: "f-deadline",
      key: "deadline",
      value: answers["deadline"] || "—",
      sourceType: "user_answer",
    },
  ];
  return {
    id: `draft-${Date.now()}`,
    workflowId: "wf-warning",
    caseId,
    title: "إنذار على يد محضر — مسودة",
    body: WARNING_DRAFT_BODY,
    fields,
    createdAt: new Date().toISOString(),
  };
}

export function buildDefenseDraft(
  answers: Record<string, string>,
  caseId: string | null
): Draft {
  const fields: DraftField[] = [
    {
      id: "f-client",
      key: "client_name",
      value: "شركة النيل للتطوير العقاري",
      sourceType: "citation",
      citation: { ...CITE_CONTRACT_DELIVERY, index: 1 },
    },
    {
      id: "f-capacity",
      key: "client_capacity",
      value: answers["client_capacity"] || "—",
      sourceType: "user_answer",
    },
    {
      id: "f-opponent",
      key: "opponent_name",
      value: "محمود عبد العظيم حسن",
      sourceType: "citation",
      citation: { ...CITE_CONTRACT_DELIVERY, index: 1 },
    },
    {
      id: "f-number",
      key: "case_number",
      value: "4521 لسنة 2026 مدني كلي جنوب القاهرة",
      sourceType: "user_answer",
    },
    {
      id: "f-delivery",
      key: "delivery_date",
      value: "الأول من سبتمبر 2024",
      sourceType: "citation",
      citation: { ...CITE_CONTRACT_DELIVERY, index: 1 },
    },
    {
      id: "f-pleas",
      key: "main_pleas",
      value: answers["main_pleas"] || "—",
      sourceType: "user_answer",
    },
    {
      id: "f-expert",
      key: "expert_finding",
      value:
        "التأخير في التسليم بلغ أربعة عشر شهرًا ويرجع إلى فعل المدعى عليها وحدها",
      sourceType: "citation",
      citation: { ...CITE_EXPERT_FINDING, index: 2 },
    },
    {
      id: "f-requests",
      key: "final_requests",
      value: answers["final_requests"] || "—",
      sourceType: "user_answer",
    },
  ];
  return {
    id: `draft-${Date.now()}`,
    workflowId: "wf-defense",
    caseId,
    title: "مذكرة دفاع — مسودة",
    body: DEFENSE_DRAFT_BODY,
    fields,
    createdAt: new Date().toISOString(),
  };
}

/** Saved drafts shown in the case detail "المسودات" tab. */
export const CASE_DRAFTS: Draft[] = [
  {
    id: "draft-saved-1",
    workflowId: "wf-warning",
    caseId: "case-4521",
    title: "إنذار بالتسليم — نسخة 12 نوفمبر",
    body: WARNING_DRAFT_BODY,
    fields: buildWarningDraft(
      {
        recipient: "السيد/ محمود عبد العظيم حسن — 8 شارع الحرية، المعادي",
        amount: "70,000 جنيه (غرامة تأخير)",
        deadline: "خمسة عشر يومًا",
      },
      "case-4521"
    ).fields,
    createdAt: "2025-11-10T09:00:00Z",
  },
  {
    id: "draft-saved-2",
    workflowId: "wf-defense",
    caseId: "case-4521",
    title: "مذكرة تعقيب على تقرير الخبير — مسودة أولى",
    body: DEFENSE_DRAFT_BODY,
    fields: buildDefenseDraft(
      {
        client_capacity: "مدعية",
        main_pleas:
          "التمسك بدلالة تقرير الخبير، والرد على الدفع بعدم التنفيذ بعدم حلول أجل القسط الخامس",
        final_requests:
          "أصليًا: إلزام المدعى عليها بالتسليم وغرامة التأخير، واحتياطيًا: الفسخ مع التعويض",
      },
      "case-4521"
    ).fields,
    createdAt: "2026-06-29T13:40:00Z",
  },
];
