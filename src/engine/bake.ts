import type { Ingredient, Recipe, Step } from "../kb/schema";
import { MIXING, TOKEN, groupTokenRuns, tidy } from "./prepare";
import type { RecipeEdits } from "./types";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Turn a recipe plus a parent's edits into a new standalone recipe: swaps become the
 * ingredient (the original becomes its substitute), removed ingredients and their steps are
 * gone, add-ins and extras become ingredients with their own steps, and amounts are scaled to
 * the chosen portions. `prepareRecipe(baked, emptyEdits(baked))` reads the same as
 * `prepareRecipe(recipe, edits)`.
 */
export function bakeRecipe(recipe: Recipe, edits: RecipeEdits, id: string, title: string): Recipe {
  const scale = edits.portions / recipe.yield;
  const removed = new Set(edits.removed.filter((x) => !(x in edits.swaps)));
  const sized = (qty: number | null | undefined) => (qty == null ? null : round(qty * scale));
  const used = new Set(recipe.ingredients.map((i) => i.id));
  const freshId = (name: string) => {
    let base = slug(name), n = 2, out = base;
    while (used.has(out)) out = `${base}-${n++}`;
    used.add(out);
    return out;
  };

  const ingredients: Ingredient[] = [];
  for (const ing of recipe.ingredients) {
    if (removed.has(ing.id)) continue;
    const swapAt = edits.swaps[ing.id];
    const swap = swapAt !== undefined ? ing.substitutes[swapAt] : undefined;
    if (!swap) {
      ingredients.push({ ...ing, qty: sized(ing.qty) });
      continue;
    }
    ingredients.push({
      ...ing,
      name: swap.name,
      qty: swap.qty === undefined ? sized(ing.qty) : sized(swap.qty),
      unit: swap.unit ?? ing.unit,
      note: swap.note,
      substitutes: [
        { name: ing.name, qty: sized(ing.qty), unit: ing.unit, note: ing.note },
        ...ing.substitutes.filter((_, n) => n !== swapAt),
      ],
    });
  }

  const present = (x: string) => !removed.has(x);
  const rewrite = (text: string) =>
    tidy(
      groupTokenRuns(text).replace(TOKEN, (_, list: string | undefined, ids: string) => {
        const keep = ids.split(",").filter(present);
        if (!keep.length) return "";
        return list && keep.length > 1 ? `{list:${keep.join(",")}}` : `{${keep[0]}}`;
      }),
    );

  // Add-ins the parent turned on become ingredients, each with a step after its anchor step.
  const addInSteps = new Map<number, Step[]>();
  for (const n of edits.addIns) {
    const a = recipe.addIns[n];
    if (!a) continue;
    const aid = freshId(a.name);
    ingredients.push({ id: aid, name: a.name, qty: sized(a.qty), unit: a.unit, note: a.note, optional: true, substitutes: [] });
    addInSteps.set(a.afterStep, [...(addInSteps.get(a.afterStep) ?? []), { text: `Add the {${aid}} and stir it through.`, action: "add" }]);
  }

  const steps: Step[] = [...(addInSteps.get(0) ?? [])];
  const newIndexAfter = new Map<number, number>([[0, steps.length]]);
  recipe.steps.forEach((step, n) => {
    const tokens = [...step.text.matchAll(TOKEN)].flatMap((m) => m[2].split(","));
    const gate = step.requires ?? tokens;
    if (!(gate.length > 0 && gate.every((x) => removed.has(x)))) {
      const requires = step.requires?.filter(present);
      steps.push({ ...step, text: rewrite(step.text), requires: requires?.length ? requires : undefined });
    }
    steps.push(...(addInSteps.get(n + 1) ?? []));
    newIndexAfter.set(n + 1, steps.length);
  });

  const extras = edits.extras.map((e) => e.trim()).filter(Boolean);
  if (extras.length) {
    const ids = extras.map((e) => {
      const xid = freshId(e);
      ingredients.push({ id: xid, name: e, qty: null, unit: "", optional: true, substitutes: [] });
      return xid;
    });
    const at = steps.findIndex((s) => MIXING.test(s.text));
    steps.splice(at >= 0 ? at + 1 : Math.max(steps.length - 1, 0), 0, {
      text: `Fold in your extras: {list:${ids.join(",")}}.`,
      action: "add",
      tip: "Chop extras small and soften any hard veg first, so they cook through in time.",
    });
  }

  return {
    ...recipe,
    id,
    title,
    yield: edits.portions,
    ingredients,
    steps,
    // Add-ins not chosen stay available, re-anchored to the new step numbers.
    addIns: recipe.addIns
      .filter((_, n) => !edits.addIns.includes(n))
      .map((a) => ({ ...a, qty: sized(a.qty), afterStep: newIndexAfter.get(a.afterStep) ?? steps.length })),
    sources: recipe.sources,
    // Re-saving a custom recipe keeps what it was first based on.
    basedOn: id === recipe.id ? recipe.basedOn : recipe.id,
  };
}
