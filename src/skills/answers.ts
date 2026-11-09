import type { Answers } from "../engine/types";

/** Read a multi-choice answer as a list. */
export function many(answers: Answers, id: string): string[] {
  const v = answers[id];
  return Array.isArray(v) ? v : v ? [v] : [];
}

/** Read a single-choice answer. */
export function one(answers: Answers, id: string): string | undefined {
  const v = answers[id];
  return Array.isArray(v) ? v[0] : v;
}
