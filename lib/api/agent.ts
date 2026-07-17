import type {
  AgentRecommendation,
  Plan,
  PlanExecutionEvent,
  PlanRequest,
} from "@/lib/types";
import {
  artifactsFor,
  classifyIntent,
  leadFor,
  planningReasoning,
  selectPlan,
} from "@/lib/data/agent";
import { delay, jitter } from "@/lib/api/latency";

/**
 * The agentic layer: the assistant answers info questions normally, but when a
 * request is executable it recommends a plan the lawyer approves before
 * anything runs (plan → approve → execute → deliver). Skills are the "mind"
 * behind the recommendation — never a separate destination.
 *
 * Both functions are single seams: swap each body for the real backend and the
 * UI is unchanged, because the returned shapes are identical.
 */

// @backend: the routing decision belongs to the ASSISTANT stream. LIVE, this
// helper disappears: POST /api/v1/assistant/messages emits a `plan` event
// (AssistantStreamEvent) instead of tokens when the model decides to act, and
// ChatView reads it inline. TONIGHT we decide client-side by keyword so the
// demo runs with no backend.
export async function recommend(
  req: PlanRequest,
): Promise<AgentRecommendation> {
  if (classifyIntent(req.content) === "answer") {
    return { intent: "answer" };
  }
  const plan = selectPlan(req.content);
  return {
    intent: "plan",
    lead: leadFor(plan),
    reasoning: planningReasoning(plan),
    plan,
  };
}

// @backend: POST /api/v1/agent/plans/:id/execute  (Accept: text/event-stream)
// Streams step_start / step_done per step, then one `artifact` per deliverable,
// then `done`. Reuse the assistant's parseSSE and
// `yield JSON.parse(data) as PlanExecutionEvent`. See docs §8.
export async function* executePlan(
  plan: Plan,
): AsyncGenerator<PlanExecutionEvent> {
  for (const step of plan.steps) {
    yield { type: "step_start", stepId: step.id };
    // crisp, "earned" pacing — ~500-750ms/step (see LAWFIRM-DESIGN-SYSTEM §5)
    await delay(320 + (step.estimatedSeconds ?? 3) * 90 + jitter(120, 0.6));
    yield { type: "step_done", stepId: step.id };
  }

  for (const artifact of artifactsFor(plan)) {
    await delay(jitter(360));
    yield { type: "artifact", artifact };
  }

  yield { type: "done" };
}
