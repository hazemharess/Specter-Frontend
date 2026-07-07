import type { VoiceTranscriptEvent } from "@/lib/types";
import {
  ANSWER_LABOR,
  CITE_EXPERT_FINDING,
  CITE_LABOR_122,
  CITE_PENALTY_CLAUSE,
  REASONING_LABOR,
  REASONING_PENALTY,
} from "@/lib/data/conversations";

/**
 * A full canned voice exchange: 2 user turns + 2 assistant turns.
 * The mock voice session yields these events with realistic pacing;
 * a real websocket (ElevenLabs/Vapi-style) emits the same union.
 */

export const VOICE_USER_TURN_1 =
  "كم تبلغ غرامة التأخير المستحقة في قضية شركة النيل حتى اليوم؟";

export const VOICE_ASSISTANT_TURN_1 = `وفقًا للبند السادس من عقد البيع الابتدائي، الغرامة الاتفاقية خمسة آلاف جنيه عن كل شهر تأخير [cite:1]. وقد أثبت تقرير الخبير أن مدة التأخير بلغت أربعة عشر شهرًا حتى تاريخ المعاينة [cite:2]، وبذلك تكون الغرامة المستحقة سبعين ألف جنيه، وهي مستمرة في التزايد حتى التسليم الفعلي.`;

export const VOICE_USER_TURN_2 =
  "طيب، وبالنسبة لقضية عبد الرحمن سالم، ما الحد الأدنى للتعويض عن الفصل التعسفي؟";

export const VOICE_ASSISTANT_TURN_2 = ANSWER_LABOR;

export const VOICE_SCRIPT: {
  user: string;
  assistant: string;
  reasoning: typeof REASONING_PENALTY;
  citations: (typeof CITE_PENALTY_CLAUSE)[];
}[] = [
  {
    user: VOICE_USER_TURN_1,
    assistant: VOICE_ASSISTANT_TURN_1,
    reasoning: REASONING_PENALTY,
    citations: [
      { ...CITE_PENALTY_CLAUSE, index: 1 },
      { ...CITE_EXPERT_FINDING, index: 2 },
    ],
  },
  {
    user: VOICE_USER_TURN_2,
    assistant: VOICE_ASSISTANT_TURN_2,
    reasoning: REASONING_LABOR,
    citations: [{ ...CITE_LABOR_122, index: 1 }],
  },
];

export type { VoiceTranscriptEvent };
