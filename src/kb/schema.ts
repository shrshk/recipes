import { z } from "zod";

export const CUISINES = [
  "american", "british", "chinese", "french", "greek", "indian", "italian", "japanese", "korean",
  "mediterranean", "mexican", "middle-eastern", "spanish", "thai", "vietnamese", "caribbean",
  "african", "global",
] as const;
export const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
export const TAGS = [
  "finger-food", "hidden-veg", "freezer-friendly", "one-pot", "no-cook", "batch-cook", "picky-eater",
  "iron-rich", "protein-packed", "sheet-pan", "family-meal", "quick", "lunchbox", "sweet", "savory",
] as const;
export const ALLERGENS = [
  "dairy", "egg", "gluten", "wheat", "peanut", "tree-nut", "soy", "fish", "shellfish", "sesame",
] as const;
export const PLATFORMS = ["reddit", "youtube", "tiktok", "instagram", "blog", "family", "custom"] as const;

const kebab = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be kebab-case");

const Amount = {
  qty: z.number().positive().nullable(),
  unit: z.string(),
  note: z.string().optional(),
};

/** A swap. Leave out qty and unit to mean "same amount as the original". */
export const SubstituteSchema = z.object({
  name: z.string().min(1),
  qty: Amount.qty.optional(),
  unit: z.string().optional(),
  note: z.string().optional(),
});

export const IngredientSchema = z.object({
  id: kebab,
  name: z.string().min(1),
  ...Amount,
  optional: z.boolean().default(false),
  substitutes: z.array(SubstituteSchema).default([]),
});

export const StepSchema = z.object({
  text: z.string().min(1),
  /** Animation to play ("boil", "chop"). Optional: the app infers it from the step's first verb. */
  action: kebab.optional(),
  minutes: z.number().positive().optional(),
  requires: z.array(kebab).optional(),
  tip: z.string().optional(),
});

export const AddInSchema = z.object({
  name: z.string().min(1),
  ...Amount,
  afterStep: z.number().int().nonnegative(),
});

export const SourceSchema = z.object({
  platform: z.enum(PLATFORMS),
  url: z.string(),
  title: z.string(),
  author: z.string().optional(),
});

/** An openly licensed photo of the dish, stored in public/dishes/. Credit is shown in the app. */
export const PhotoSchema = z.object({
  file: z.string().regex(/^[a-z0-9-]+\.(jpg|webp)$/),
  author: z.string(),
  license: z.string(),
  url: z.string().url(),
});

export const RecipeSchema = z.object({
  id: kebab,
  title: z.string().min(1),
  summary: z.string().min(1).max(160),
  cuisine: z.enum(CUISINES),
  meals: z.array(z.enum(MEALS)).min(1),
  minAgeMonths: z.number().int().min(6).max(48),
  prepMinutes: z.number().nonnegative(),
  cookMinutes: z.number().nonnegative(),
  yield: z.number().positive(),
  difficulty: z.enum(["easy", "medium"]),
  tags: z.array(z.enum(TAGS)).default([]),
  allergens: z.array(z.enum(ALLERGENS)).default([]),
  ingredients: z.array(IngredientSchema).min(1),
  steps: z.array(StepSchema).min(1),
  addIns: z.array(AddInSchema).default([]),
  toddlerTips: z.array(z.string()).default([]),
  sources: z.array(SourceSchema).min(1),
  popularity: z.number().min(0).max(1).default(0.5),
  /** For custom recipes: the id of the recipe this one was made from. */
  basedOn: kebab.optional(),
  photo: PhotoSchema.optional(),
});

export type Cuisine = (typeof CUISINES)[number];
export type Meal = (typeof MEALS)[number];
export type Tag = (typeof TAGS)[number];
export type Allergen = (typeof ALLERGENS)[number];
export type Ingredient = z.infer<typeof IngredientSchema>;
export type Substitute = z.infer<typeof SubstituteSchema>;
export type Step = z.infer<typeof StepSchema>;
export type AddIn = z.infer<typeof AddInSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;

const TOKEN = /\{(list:)?([a-z0-9,-]+)\}/g;

/** Ids referenced by `{id}` and `{list:a,b}` tokens in a step's text. */
export function tokenIds(text: string): string[] {
  const ids: string[] = [];
  for (const m of text.matchAll(TOKEN)) ids.push(...m[2].split(","));
  return ids;
}

/** Cross-field checks zod cannot express: token ids, `requires` ids, addIn step bounds. */
export function recipeProblems(r: Recipe): string[] {
  const problems: string[] = [];
  const ids = new Set(r.ingredients.map((i) => i.id));
  if (ids.size !== r.ingredients.length) problems.push("duplicate ingredient ids");
  r.steps.forEach((s, n) => {
    for (const id of tokenIds(s.text)) if (!ids.has(id)) problems.push(`step ${n + 1}: unknown token {${id}}`);
    for (const id of s.requires ?? []) if (!ids.has(id)) problems.push(`step ${n + 1}: unknown requires ${id}`);
  });
  r.addIns.forEach((a) => {
    if (a.afterStep > r.steps.length) problems.push(`addIn ${a.name}: afterStep ${a.afterStep} out of range`);
  });
  return problems;
}
