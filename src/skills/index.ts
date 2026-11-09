import type { Question, Skill } from "../engine/types";

/**
 * Every `*.skill.ts` file under src/skills is a skill. Drop a file into `community/` and it is
 * picked up at build time: no registration needed. Built-ins run first, then community skills,
 * each group in file-name order.
 */
const modules = import.meta.glob<{ default: Skill }>("./**/*.skill.ts", { eager: true });

export const skills: Skill[] = Object.keys(modules)
  .sort((a, b) => Number(a.includes("/community/")) - Number(b.includes("/community/")) || a.localeCompare(b))
  .map((path) => modules[path].default);

/** All questions from the given skills, in `order`, without duplicate ids. */
export function questionsFor(list: Skill[]): Question[] {
  const seen = new Map<string, Question>();
  for (const s of list) for (const q of s.questions ?? []) if (!seen.has(q.id)) seen.set(q.id, q);
  return [...seen.values()].sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}
