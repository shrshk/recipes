import type { Recipe } from "../kb/schema";
import type { PreparedRecipe, Recommendation, Skill, SkillContext } from "./types";

export interface RecommendOptions {
  limit?: number;
  /** Parent's skill switches from Settings. Missing ids fall back to `enabledByDefault`. */
  toggles?: SkillToggles;
}

export type SkillToggles = Record<string, boolean>;

export function isSkillOn(skill: Skill, toggles: SkillToggles = {}): boolean {
  return toggles[skill.id] ?? skill.enabledByDefault ?? true;
}

export function activeSkills(skills: Skill[], toggles: SkillToggles = {}): Skill[] {
  return skills.filter((s) => isSkillOn(s, toggles));
}

/**
 * Rank recipes. Each skill may hide a recipe (`filter`) or add points (`score` x `weight`).
 * Reasons from the top-scoring skills are kept, so the UI can say why a recipe was picked.
 * Recipes a skill marks as not matching the parent's choice (`match: false`) come last.
 */
export function recommend(
  recipes: Recipe[],
  skills: Skill[],
  ctx: SkillContext,
  { limit = 12, toggles = {} }: RecommendOptions = {},
): Recommendation[] {
  const on = activeSkills(skills, toggles);
  const ranked: Recommendation[] = [];

  for (const recipe of recipes) {
    if (on.some((s) => s.filter && isRejected(s.filter(recipe, ctx)))) continue;
    let score = 0;
    let offTarget = false;
    const reasons: { text: string; points: number }[] = [];
    for (const s of on) {
      if (!s.score) continue;
      const raw = s.score(recipe, ctx);
      const { score: points, reason, match } = typeof raw === "number" ? { score: raw, reason: undefined, match: undefined } : raw;
      if (match === false) offTarget = true;
      const weighted = points * (s.weight ?? 1);
      score += weighted;
      if (reason && weighted > 0) reasons.push({ text: reason, points: weighted });
    }
    reasons.sort((a, b) => b.points - a.points);
    ranked.push({ recipe, score, reasons: reasons.slice(0, 3).map((r) => r.text), offTarget });
  }

  ranked.sort((a, b) => Number(a.offTarget) - Number(b.offTarget) || b.score - a.score || a.recipe.title.localeCompare(b.recipe.title));
  return ranked.slice(0, limit);
}

function isRejected(result: boolean | string): boolean {
  return result === false || typeof result === "string";
}

/** Run every active skill's `adapt` hook over a prepared recipe, in registry order. */
export function adaptRecipe(
  prepared: PreparedRecipe,
  skills: Skill[],
  ctx: SkillContext,
  toggles: SkillToggles = {},
): PreparedRecipe {
  return activeSkills(skills, toggles).reduce((p, s) => (s.adapt ? s.adapt(p, ctx) : p), prepared);
}
