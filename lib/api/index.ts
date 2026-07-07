/**
 * The single service layer. Components import ONLY from here:
 *
 *   import { api } from "@/lib/api";
 *   const cases = await api.cases.list();
 *
 * Swapping mock → real backend touches only the modules in this folder
 * (plus NEXT_PUBLIC_API_BASE_URL). See docs/BACKEND-INTEGRATION.md.
 */
import * as assistant from "@/lib/api/assistant";
import * as cases from "@/lib/api/cases";
import * as workflows from "@/lib/api/workflows";
import * as library from "@/lib/api/library";
import * as history from "@/lib/api/history";
import * as voice from "@/lib/api/voice";

export const api = { assistant, cases, workflows, library, history, voice };
