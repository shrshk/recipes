import { RecipeSchema, recipeProblems, type Recipe } from "./schema";

export * from "./schema";

const files = import.meta.glob("../../kb/recipes/*.json", { eager: true, import: "default" });

export interface LoadResult {
  recipes: Recipe[];
  errors: { file: string; problems: string[] }[];
}

export function loadKnowledgeBase(raw: Record<string, unknown> = files): LoadResult {
  const recipes: Recipe[] = [];
  const errors: LoadResult["errors"] = [];
  for (const [file, data] of Object.entries(raw)) {
    const parsed = RecipeSchema.safeParse(data);
    if (!parsed.success) {
      errors.push({ file, problems: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) });
      continue;
    }
    const problems = recipeProblems(parsed.data);
    const expectedId = file.split("/").pop()!.replace(/\.json$/, "");
    if (parsed.data.id !== expectedId) problems.push(`id "${parsed.data.id}" does not match file name`);
    if (problems.length) errors.push({ file, problems });
    else recipes.push(parsed.data);
  }
  recipes.sort((a, b) => a.title.localeCompare(b.title));
  return { recipes, errors };
}

let cache: LoadResult | undefined;
export function knowledgeBase(): LoadResult {
  if (!cache) {
    cache = loadKnowledgeBase();
    for (const e of cache.errors) console.warn("recipe skipped", e.file, e.problems);
  }
  return cache;
}
