import { RecipeSchema, recipeProblems, type Recipe } from "./schema";

export type Validation = { ok: true; recipe: Recipe } | { ok: false; problems: string[] };

/**
 * Full check of an untrusted recipe (from an LLM client or the browser): schema, tokens, and
 * that any declared step `action` is a real animation. Problems are written for a human or an
 * LLM to fix: "steps.2.minutes: Expected number, received string".
 */
export function validateRecipe(data: unknown, actionIds: ReadonlySet<string>): Validation {
  const parsed = RecipeSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, problems: parsed.error.issues.map((i) => `${i.path.join(".") || "recipe"}: ${i.message}`) };
  }
  const problems = recipeProblems(parsed.data);
  parsed.data.steps.forEach((s, n) => {
    if (s.action && !actionIds.has(s.action))
      problems.push(`step ${n + 1}: unknown action "${s.action}" (use one of ${[...actionIds].join(", ")}, or leave it out)`);
  });
  return problems.length ? { ok: false, problems } : { ok: true, recipe: parsed.data };
}
