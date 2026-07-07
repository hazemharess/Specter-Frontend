import type {
  Citation,
  Message,
  ReasoningStep,
  Thread,
} from "@/lib/types";

// Citations reference hand-written pages in documents.ts so the source
// panel always opens on real, highlightable content.

const cite = (
  id: string,
  index: number,
  docId: string,
  docName: string,
  page: number,
  snippet: string
): Citation => ({ id, index, docId, docName, page, snippet });

export const CITE_CONTRACT_DELIVERY = cite(
  "cit-contract-4",
  1,
  "doc-contract",
  "عقد البيع الابتدائي",
  4,
  "يلتزم الطرف الأول (البائع) بتسليم الوحدة المبيعة كاملة التشطيب طبقًا للمواصفات الواردة بالملحق رقم 2 في موعد أقصاه الأول من سبتمبر سنة 2024"
);

export const CITE_EXPERT_FINDING = cite(
  "cit-expert-17",
  2,
  "doc-expert",
  "تقرير الخبير الهندسي",
  17,
  "التأخير في التسليم — والذي بلغ أربعة عشر شهرًا حتى تاريخ المعاينة — يرجع إلى فعل المدعى عليها وحدها"
);

export const CITE_DEFENSE_PLEA = cite(
  "cit-defense-14",
  3,
  "doc-defense",
  "مذكرة دفاع المدعى عليه",
  14,
  "توقفت عن سداد القسطين الخامس والسادس المستحقين في يناير ويوليو 2025"
);

export const CITE_PENALTY_CLAUSE = cite(
  "cit-contract-4b",
  1,
  "doc-contract",
  "عقد البيع الابتدائي",
  4,
  "يلتزم بأداء غرامة تأخيرية مقدارها خمسة آلاف جنيه عن كل شهر تأخير"
);

export const CITE_CASSATION_PENALTY = cite(
  "cit-cassation-6",
  2,
  "lib-civil-rescission",
  "مبادئ النقض في فسخ العقد والتعويض",
  6,
  "التعويض الاتفاقي لا يستحق إلا إذا توافرت أركان المسؤولية العقدية، ويجوز للقاضي تخفيضه إذا أثبت المدين أن التقدير كان مبالغًا فيه إلى درجة كبيرة"
);

export const CITE_WARNING = cite(
  "cit-warning-2",
  3,
  "doc-warning",
  "إنذار على يد محضر",
  2,
  "تنذر المنذر إليها بضرورة تسليم الوحدة محل التعاقد كاملة التشطيب طبقًا للمواصفات المتفق عليها خلال خمسة عشر يومًا"
);

export const CITE_LABOR_122 = cite(
  "cit-labor-41",
  1,
  "lib-labor-code",
  "قانون العمل رقم 12 لسنة 2003",
  41,
  "ولا يقل التعويض عن أجر شهرين عن كل سنة من سنوات الخدمة"
);

export const CITE_CIVIL_431 = cite(
  "cit-civil-9",
  2,
  "lib-civil-code",
  "القانون المدني — أحكام عقد البيع",
  9,
  "يلتزم البائع بتسليم المبيع للمشتري بالحالة التي كان عليها وقت البيع"
);

// -------------------------------------------------------- reasoning builders

let stepSeq = 0;
const step = (
  kind: ReasoningStep["kind"],
  label: string,
  detail?: string,
  chips?: ReasoningStep["chips"]
): ReasoningStep => ({ id: `rs-${++stepSeq}`, kind, label, detail, chips });

export const REASONING_CASE_ANALYSIS: ReasoningStep[] = [
  step(
    "analyze",
    "تحليل السؤال",
    "سأحلل وقائع النزاع والمستندات المتاحة لتحديد أقوى أدلة الإثبات على إخلال البائع بالتزامه بالتسليم، مع مراجعة دفوع الخصم وتقييم أثرها على مركز الموكلة القانوني."
  ),
  step("review_file", "مراجعة الملف المرفق", undefined, [
    { label: "عقد_البيع_الابتدائي.pdf", docId: "doc-contract", icon: "pdf" },
  ]),
  step("search", "البحث في مستندات القضية", undefined, [
    { label: "تقرير الخبير الهندسي", docId: "doc-expert", icon: "doc" },
    { label: "مذكرة دفاع المدعى عليه", docId: "doc-defense", icon: "doc" },
    { label: "إنذار على يد محضر", docId: "doc-warning", icon: "doc" },
    { label: "صحيفة الدعوى", docId: "doc-claim", icon: "doc" },
  ]),
  step(
    "evaluate",
    "تقييم الأدلة",
    "راجعت العقد وتقرير الخبير ومذكرة دفاع الخصم. سأقيّم الآن قوة كل دليل ومدى كفايته لإثبات الإخلال العقدي، وأحدد نقاط الضعف التي قد يستغلها الخصم."
  ),
];

export const REASONING_PENALTY: ReasoningStep[] = [
  step(
    "analyze",
    "تحليل السؤال",
    "سأراجع الشرط الجزائي الوارد بالعقد وموقف قضاء النقض من استحقاق التعويض الاتفاقي وسلطة القاضي في تخفيضه."
  ),
  step("review_file", "مراجعة بنود العقد", undefined, [
    { label: "عقد_البيع_الابتدائي.pdf", docId: "doc-contract", icon: "pdf" },
  ]),
  step("search", "البحث في المكتبة القانونية", undefined, [
    { label: "مبادئ النقض — الفسخ والتعويض", docId: "lib-civil-rescission", icon: "search" },
    { label: "القانون المدني — البيع", docId: "lib-civil-code", icon: "search" },
  ]),
  step("evaluate", "تقييم الأدلة"),
];

export const REASONING_SEARCH_ONLY: ReasoningStep[] = [
  step(
    "analyze",
    "تحليل السؤال",
    "سأبحث في مستندات القضية والمكتبة القانونية عن سوابق قضائية مطابقة لموضوع السؤال."
  ),
  step("search", "البحث في مستندات القضية", undefined, [
    { label: "مذكرة دفاع المدعى عليه", docId: "doc-defense", icon: "doc" },
    { label: "صحيفة الدعوى", docId: "doc-claim", icon: "doc" },
  ]),
  step("search", "البحث في المكتبة القانونية", undefined, [
    { label: "مبادئ النقض في العقد الابتدائي", docId: "lib-civil-preliminary", icon: "search" },
    { label: "مبادئ النقض — الفسخ والتعويض", docId: "lib-civil-rescission", icon: "search" },
  ]),
  step("evaluate", "تقييم نتائج البحث"),
];

export const REASONING_LABOR: ReasoningStep[] = [
  step(
    "analyze",
    "تحليل السؤال",
    "سأحسب التعويض المستحق عن الفصل التعسفي وفقًا لقانون العمل رقم 12 لسنة 2003 وما استقر عليه قضاء النقض."
  ),
  step("search", "البحث في المكتبة القانونية", undefined, [
    { label: "قانون العمل رقم 12 لسنة 2003", docId: "lib-labor-code", icon: "search" },
    { label: "مبادئ النقض — الفصل التعسفي", docId: "lib-labor-dismissal", icon: "search" },
  ]),
  step("evaluate", "تقييم الأساس القانوني"),
];

// ---------------------------------------------------------- canned messages

const now = "2026-07-06T10:00:00Z";

function msg(
  id: string,
  threadId: string,
  role: Message["role"],
  content: string,
  reasoningSteps: ReasoningStep[] = [],
  citations: Citation[] = [],
  isRefusal = false
): Message {
  return {
    id,
    threadId,
    role,
    content,
    reasoningSteps,
    citations,
    isRefusal,
    createdAt: now,
  };
}

export const ANSWER_EVIDENCE = `موقف الموكلة في إثبات إخلال البائع بالتزام التسليم قوي ومدعوم بأدلة كتابية قاطعة. فالبند الخامس من عقد البيع الابتدائي يحدد ميعاد التسليم تحديدًا نافيًا للجهالة بالأول من سبتمبر 2024، ويقرن الالتزام بالتسليم بمواصفات تشطيب محددة بالملحق رقم 2 [cite:1]. وقد جاء تقرير الخبير الهندسي المنتدب حاسمًا في هذه النقطة، إذ أثبت بالمعاينة أن الوحدة ما زالت عند مرحلة المحارة وأن مدة التأخير بلغت أربعة عشر شهرًا ترجع إلى فعل المدعى عليها وحدها [cite:2].

أما دفع الخصم بعدم التنفيذ المؤسس على التوقف عن سداد القسطين الخامس والسادس [cite:3]، فيرد عليه بأن الخبير انتهى صراحة إلى أن القسط الخامس لا يستحق الأداء إلا بعد التسليم وفقًا لصريح البند الخامس، ومن ثم ينهار الأساس الذي يقوم عليه هذا الدفع، إذ لا يجوز للمدين المتقاعس أن يتمسك بعدم تنفيذ التزام لم يحل أجله بعد.

وعليه، أرى أن الأدلة الحالية كافية لطلب الحكم بالتسليم مع غرامة التأخير الاتفاقية، وأنصح بالتركيز في مذكرة التعقيب على ما أورده الخبير بشأن ترتيب الالتزامات، مع التمسك احتياطيًا بالتنفيذ العيني عملًا بأحكام القانون المدني.`;

export const ANSWER_REFUSAL = `لا أجد في المستندات المتاحة ما يجيب عن هذا السؤال بشكل قاطع. بحثت في مستندات القضية وفي أقسام المكتبة القانونية ذات الصلة، ولم أعثر على سابقة صادرة عن الدائرة 12 مدني كلي بمحكمة جنوب القاهرة في نزاع مماثل خلال عام 2024.

ما أستطيع تأكيده من المصادر المتاحة يقتصر على المبادئ العامة لمحكمة النقض في الفسخ والتعويض الاتفاقي. إذا كانت لديكم مجموعة أحكام الدائرة أو مبادئ حديثة لم تُرفع بعد إلى المكتبة، يمكن إضافتها وسأعيد البحث فور فهرستها.`;

export const ANSWER_PENALTY = `الشرط الجزائي الوارد بالبند السادس من العقد يقرر غرامة تأخيرية مقدارها خمسة آلاف جنيه عن كل شهر تأخير، دون إخلال بحق المشتري في الفسخ أو التنفيذ العيني [cite:1]. وبتطبيق ما انتهى إليه تقرير الخبير من أن مدة التأخير بلغت أربعة عشر شهرًا، تكون الغرامة المستحقة حتى تاريخ المعاينة سبعين ألف جنيه، وهي في ازدياد حتى التسليم الفعلي.

غير أنه يلزم التنبه إلى أن قضاء النقض مستقر على أن التعويض الاتفاقي لا يستحق إلا بتوافر أركان المسؤولية العقدية، وأن للقاضي سلطة تخفيضه إذا أثبت المدين المبالغة في تقديره [cite:2]. لذلك أنصح بتضمين المذكرة القادمة ما يثبت عناصر الضرر الفعلي — كحرمان الموكلة من الانتفاع بالوحدة وفوات فرصة تأجيرها — حتى لا يجد الخصم سبيلًا للنعي بانتفاء الضرر، خاصة أن الإنذار الرسمي المعلن قد قطع بإعذار المدين قبل رفع الدعوى [cite:3].`;

export const ANSWER_LABOR = `وفقًا للمادة 122 من قانون العمل رقم 12 لسنة 2003، إذا أنهى صاحب العمل العقد دون مبرر مشروع وكافٍ التزم بتعويض العامل بما لا يقل عن أجر شهرين عن كل سنة من سنوات الخدمة [cite:1]. وبتطبيق ذلك على واقعة الموكل — الذي أمضى تسع سنوات في خدمة الشركة بأجر شامل قدره 12,000 جنيه شهريًا — فإن الحد الأدنى للتعويض المستحق يبلغ 216,000 جنيه.

ويضاف إلى ذلك مقابل مهلة الإخطار وبدل الإجازات غير المستعملة وأي مستحقات متأخرة، وكلها طلبات يجب إيرادها صراحة في صحيفة الدعوى حتى لا يسقط الحق في المطالبة بها أمام درجة التقاضي الأولى. مع ملاحظة أن عبء إثبات مشروعية الفصل يقع على عاتق صاحب العمل، فإذا عجز عن إثبات الخطأ الجسيم المنسوب للعامل قُضي له بالتعويض.`;

// ------------------------------------------------------------------ threads

const HOUR = 3600_000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();

export const THREADS: Thread[] = [
  {
    id: "t-4521-1",
    title: "قوة موقفنا في إثبات الإخلال بالتسليم",
    preview: "موقف الموكلة في إثبات إخلال البائع قوي ومدعوم بأدلة كتابية قاطعة…",
    caseId: "case-4521",
    scope: { type: "case", caseId: "case-4521", label: "قضية رقم 4521 لسنة 2026" },
    createdAt: "2026-07-06T09:40:00Z",
    updatedAt: ago(2),
    messages: [
      msg(
        "m-1",
        "t-4521-1",
        "user",
        "ما مدى قوة موقفنا في إثبات إخلال البائع بالتزامه بالتسليم؟ وما أثر دفعهم بعدم التنفيذ؟"
      ),
      msg(
        "m-2",
        "t-4521-1",
        "assistant",
        ANSWER_EVIDENCE,
        REASONING_CASE_ANALYSIS,
        [CITE_CONTRACT_DELIVERY, CITE_EXPERT_FINDING, CITE_DEFENSE_PLEA]
      ),
      msg(
        "m-3",
        "t-4521-1",
        "user",
        "هل توجد سابقة صادرة عن نفس الدائرة في نزاع مماثل خلال 2024؟"
      ),
      msg(
        "m-4",
        "t-4521-1",
        "assistant",
        ANSWER_REFUSAL,
        REASONING_SEARCH_ONLY,
        [],
        true
      ),
    ],
  },
  {
    id: "t-4521-2",
    title: "غرامة التأخير والتعويض الاتفاقي",
    preview: "الشرط الجزائي بالبند السادس يقرر غرامة خمسة آلاف جنيه عن كل شهر…",
    caseId: "case-4521",
    scope: { type: "case", caseId: "case-4521", label: "قضية رقم 4521 لسنة 2026" },
    createdAt: "2026-07-02T14:00:00Z",
    updatedAt: ago(30),
    messages: [
      msg(
        "m-5",
        "t-4521-2",
        "user",
        "احسب غرامة التأخير المستحقة حتى الآن، وهل يمكن للمحكمة تخفيض التعويض الاتفاقي؟"
      ),
      msg(
        "m-6",
        "t-4521-2",
        "assistant",
        ANSWER_PENALTY,
        REASONING_PENALTY,
        [CITE_PENALTY_CLAUSE, CITE_CASSATION_PENALTY, { ...CITE_WARNING, index: 3 }]
      ),
    ],
  },
  {
    id: "t-4521-3",
    title: "الرد على الدفع بعدم التنفيذ",
    preview: "ينهار الدفع متى ثبت أن القسط الخامس لا يستحق إلا بعد التسليم…",
    caseId: "case-4521",
    scope: { type: "case", caseId: "case-4521", label: "قضية رقم 4521 لسنة 2026" },
    createdAt: "2026-06-28T11:10:00Z",
    updatedAt: ago(26),
    messages: [
      msg(
        "m-7",
        "t-4521-3",
        "user",
        "جهّز نقاط الرد على الدفع بعدم التنفيذ الوارد بمذكرة الخصم صفحة 14."
      ),
      msg(
        "m-8",
        "t-4521-3",
        "assistant",
        `أقترح بناء الرد على ثلاث ركائز. أولًا: ترتيب الالتزامات التعاقدية — فالبند الخامس يجعل استحقاق القسط الخامس تاليًا للتسليم لا سابقًا عليه [cite:1]، ومن ثم فالمدعية لم تتخلف عن التزام حالّ الأداء. ثانيًا: ما أثبته الخبير من انتظام الموكلة في سداد الأقساط الأربعة الأولى في مواعيدها [cite:2]، وهو ما ينفي ركن الإخلال المقابل الذي يقوم عليه الدفع.

ثالثًا: التمسك بأن الدفع بعدم التنفيذ يشترط فيه أن يكون الالتزامان متقابلين ومستحقي الأداء معًا، وهو شرط غير متحقق هنا، فضلًا عن أن المدعى عليها هي البادئة بالإخلال، ولا يجوز لها أن تتخذ من إخلالها ذريعة للامتناع عن التنفيذ.`,
        REASONING_CASE_ANALYSIS,
        [
          { ...CITE_CONTRACT_DELIVERY, index: 1 },
          { ...CITE_EXPERT_FINDING, index: 2 },
        ]
      ),
    ],
  },
  {
    id: "t-892-1",
    title: "تعويض الفصل التعسفي — عبد الرحمن سالم",
    preview: "الحد الأدنى للتعويض وفق المادة 122 يبلغ 216,000 جنيه…",
    caseId: "case-892",
    scope: { type: "case", caseId: "case-892", label: "قضية رقم 892 لسنة 2025" },
    createdAt: "2026-07-05T16:00:00Z",
    updatedAt: ago(3 * 24),
    messages: [
      msg(
        "m-9",
        "t-892-1",
        "user",
        "احسب الحد الأدنى لتعويض الفصل التعسفي المستحق للموكل، مع الأساس القانوني."
      ),
      msg("m-10", "t-892-1", "assistant", ANSWER_LABOR, REASONING_LABOR, [
        CITE_LABOR_122,
      ]),
    ],
  },
  {
    id: "t-lib-1",
    title: "التزام البائع بالتسليم في القانون المدني",
    preview: "المادة 431 تلزم البائع بتسليم المبيع بالحالة التي كان عليها وقت البيع…",
    caseId: null,
    scope: { type: "library", label: "المكتبة القانونية" },
    createdAt: "2026-07-01T09:00:00Z",
    updatedAt: ago(5 * 24),
    messages: [
      msg(
        "m-11",
        "t-lib-1",
        "user",
        "ما نطاق التزام البائع بالتسليم في القانون المدني المصري؟"
      ),
      msg(
        "m-12",
        "t-lib-1",
        "assistant",
        `تلزم المادة 431 من القانون المدني البائع بتسليم المبيع للمشتري بالحالة التي كان عليها وقت البيع [cite:2]، ويتحقق التسليم قانونًا بوضع المبيع تحت تصرف المشتري بحيث يتمكن من حيازته والانتفاع به دون عائق ولو لم يستولِ عليه ماديًا.

ويمتد الالتزام إلى ملحقات المبيع وما أُعد بصفة دائمة لاستعماله، فإذا تخلف البائع كان للمشتري — بعد الإعذار — طلب التنفيذ العيني أو الفسخ مع التعويض في الحالين إن كان له مقتضى، ولمحكمة الموضوع سلطة تقدير جسامة الإخلال المبرر للفسخ.`,
        REASONING_SEARCH_ONLY,
        [{ ...CITE_CIVIL_431, index: 2 }]
      ),
    ],
  },
  {
    id: "t-general-1",
    title: "مقارنة نسختي عقد التوريد — الدلتا",
    preview: "أبرز الفروق تتركز في بند التحكيم وشرط المراجعة السنوية للأسعار…",
    caseId: "case-1203",
    scope: { type: "case", caseId: "case-1203", label: "قضية رقم 1203 لسنة 2026" },
    createdAt: "2026-06-25T12:00:00Z",
    updatedAt: ago(12 * 24),
    messages: [
      msg(
        "m-13",
        "t-general-1",
        "user",
        "قارن بين نسختي عقد التوريد وحدد البنود التي عُدلت لغير صالح الموكلة."
      ),
      msg(
        "m-14",
        "t-general-1",
        "assistant",
        `أبرز التعديلات في النسخة الثانية ثلاثة، وكلها لغير صالح الموكلة. أولًا: بند التحكيم عُدّل من التحكيم لدى مركز القاهرة الإقليمي إلى التحكيم في جهة أجنبية، بما يضاعف كلفة أي نزاع مستقبلي. ثانيًا: شرط المراجعة السنوية للأسعار حُذف واستُبدل به تثبيت الأسعار لمدة ثلاث سنوات رغم تقلب أسعار الخامات.

ثالثًا: مدة السماح في التسليم رُفعت من 15 يومًا إلى 45 يومًا مع إلغاء غرامة التأخير المقابلة. أنصح برفض النسخة المعدلة أو اشتراط إعادة بند المراجعة السنوية وغرامة التأخير كحد أدنى للتوقيع.`,
        [
          {
            id: "rs-cmp-1",
            kind: "analyze",
            label: "تحليل السؤال",
            detail: "سأقارن النسختين بندًا ببند وأرصد التعديلات الجوهرية وأثرها على مركز الموكلة.",
          },
          {
            id: "rs-cmp-2",
            kind: "review_file",
            label: "مراجعة النسختين",
            chips: [
              { label: "عقد_التوريد_v1.pdf", icon: "pdf" },
              { label: "عقد_التوريد_v2.pdf", icon: "pdf" },
            ],
          },
          { id: "rs-cmp-3", kind: "evaluate", label: "رصد الفروق الجوهرية" },
        ],
        []
      ),
    ],
  },
];

// Pool of responses served for brand-new questions typed in the demo.
export const RESPONSE_POOL: {
  content: string;
  reasoningSteps: ReasoningStep[];
  citations: Citation[];
  isRefusal?: boolean;
}[] = [
  {
    content: ANSWER_EVIDENCE,
    reasoningSteps: REASONING_CASE_ANALYSIS,
    citations: [CITE_CONTRACT_DELIVERY, CITE_EXPERT_FINDING, CITE_DEFENSE_PLEA],
  },
  {
    content: ANSWER_PENALTY,
    reasoningSteps: REASONING_PENALTY,
    citations: [
      CITE_PENALTY_CLAUSE,
      CITE_CASSATION_PENALTY,
      { ...CITE_WARNING, index: 3 },
    ],
  },
  {
    content: ANSWER_REFUSAL,
    reasoningSteps: REASONING_SEARCH_ONLY,
    citations: [],
    isRefusal: true,
  },
  {
    content: ANSWER_LABOR,
    reasoningSteps: REASONING_LABOR,
    citations: [CITE_LABOR_122],
  },
];
