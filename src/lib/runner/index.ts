import type { LanguageId } from "@/types/language";
import { runCode as runCodeJudge0 } from "./judge0";
import { runCode as runCodePiston } from "./piston";
import { runCode as runCodeWandbox } from "./wandbox";
import type { RunResult } from "./types";

export type { RunResult } from "./types";

/**
 * Runs user code via whichever provider is configured.
 *
 * Resolution order:
 *   1. `PISTON_URL` — explicit self-hosted Piston instance.
 *      Set this when you've deployed your own Piston container with privileged
 *      Docker (e.g. on a VPS, Oracle Cloud, Fly.io machines).
 *   2. `RAPIDAPI_KEY` — Judge0 CE on RapidAPI (free, but requires a card on
 *      some plans).
 *   3. Default: Wandbox public API — truly free, no key, no signup.
 *      The default path so the playground works out of the box with only
 *      `GEMINI_API_KEY` configured.
 */
export async function runCode(
  language: LanguageId,
  code: string,
  stdin = "",
): Promise<RunResult> {
  if (process.env.PISTON_URL) {
    return runCodePiston(language, code, stdin);
  }
  if (process.env.RAPIDAPI_KEY) {
    return runCodeJudge0(language, code, stdin);
  }
  return runCodeWandbox(language, code, stdin);
}

export function getRunnerName(): "piston" | "judge0" | "wandbox" {
  if (process.env.PISTON_URL) return "piston";
  if (process.env.RAPIDAPI_KEY) return "judge0";
  return "wandbox";
}
