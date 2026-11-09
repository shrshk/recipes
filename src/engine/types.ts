import type { Recipe } from "../kb/schema";

/** One choice in a home-screen question. */
export interface Choice {
  value: string;
  label: string;
  emoji?: string;
}

/**
 * A question shown on the home screen. Core questions and skill questions use the same
 * shape, so a skill can ask the parent anything it needs (see docs/SKILLS.md).
 */
export interface Question {
  /** Answer key. Read it back with `ctx.answers[id]`. Namespace skill questions: "picky.level". */
  id: string;
  title: string;
  subtitle?: string;
  kind: "single" | "multi";
  choices: Choice[];
  /** Used when the parent skips the question. */
  defaultValue?: string | string[];
  /** Lower comes first. Core questions use 0-50. */
  order?: number;
}

export type Answers = Record<string, string | string[] | undefined>;

/** Everything a skill can see when it judges a recipe. */
export interface SkillContext {
  answers: Answers;
  /** Ids of recipes cooked before, newest first. */
  history: string[];
  now: Date;
}

/** A score with an optional reason shown to the parent ("Ready in 20 min"). */
export interface Scored {
  score: number;
  reason?: string;
}

/**
 * A recommendation skill. Every hook is optional. The engine runs them in this order:
 *  1. `filter`  — return false (or a string reason) to hide a recipe.
 *  2. `score`   — add points. The engine multiplies by `weight` and sums all skills.
 *  3. `adapt`   — change the prepared recipe before cooking (add tips, swap words).
 */
export interface Skill {
  id: string;
  name: string;
  description: string;
  /** Multiplier for `score`. Default 1. */
  weight?: number;
  /** Off skills do nothing. Parents can toggle skills in Settings. Default true. */
  enabledByDefault?: boolean;
  questions?: Question[];
  filter?(recipe: Recipe, ctx: SkillContext): boolean | string;
  score?(recipe: Recipe, ctx: SkillContext): number | Scored;
  adapt?(prepared: PreparedRecipe, ctx: SkillContext): PreparedRecipe;
}

/** Helper so skill files get type checking without importing the interface by hand. */
export function defineSkill(skill: Skill): Skill {
  return skill;
}

export interface Recommendation {
  recipe: Recipe;
  score: number;
  reasons: string[];
}

/** A parent's changes to one recipe before cooking. */
export interface RecipeEdits {
  /** Ingredient ids taken out. */
  removed: string[];
  /** Ingredient id -> index into that ingredient's `substitutes`. Implies not removed. */
  swaps: Record<string, number>;
  /** Indexes into the recipe's `addIns` the parent turned on. */
  addIns: number[];
  /** Free-text extras the parent typed ("frozen peas"). */
  extras: string[];
  /** Toddler portions wanted. Scales quantities against `recipe.yield`. */
  portions: number;
}

export interface PreparedIngredient {
  id: string;
  name: string;
  amount: string;
  note?: string;
  kind: "base" | "swap" | "add-in" | "extra";
}

export interface PreparedStep {
  text: string;
  /** Declared animation id, if the recipe set one. The UI infers one otherwise. */
  action?: string;
  minutes?: number;
  tip?: string;
  /** Ingredient names this step uses, for highlighting. */
  uses: string[];
}

export interface PreparedRecipe {
  recipe: Recipe;
  ingredients: PreparedIngredient[];
  steps: PreparedStep[];
  /** Notes the parent should see before starting ("Dairy-free swap: oat milk"). */
  notes: string[];
  toddlerTips: string[];
}
