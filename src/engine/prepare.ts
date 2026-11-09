import type { Recipe } from "../kb/schema";
import type { PreparedIngredient, PreparedRecipe, PreparedStep, RecipeEdits } from "./types";

const FRACTIONS: [number, string][] = [
  [1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"], [1 / 2, "½"], [2 / 3, "⅔"], [3 / 4, "¾"],
];

/** 1.5 -> "1½", 0.33 -> "⅓", 2 -> "2". Rounds to the nearest kitchen fraction. */
export function formatQty(qty: number): string {
  if (qty >= 10) return String(Math.round(qty));
  const whole = Math.floor(qty);
  const rest = qty - whole;
  let best = { diff: rest, text: "" };
  for (const [value, text] of FRACTIONS) {
    const diff = Math.abs(rest - value);
    if (diff < best.diff) best = { diff, text };
  }
  if (Math.abs(1 - rest) < best.diff) return String(whole + 1);
  if (whole === 0) return best.text || "a pinch of";
  return `${whole}${best.text}`;
}

export function formatAmount(qty: number | null, unit: string, scale = 1): string {
  if (qty === null) return unit ? `some ${unit}` : "to taste";
  const q = formatQty(qty * scale);
  return unit ? `${q} ${unit}` : q;
}

export function emptyEdits(recipe: Recipe): RecipeEdits {
  return { removed: [], swaps: {}, addIns: [], extras: [], portions: recipe.yield };
}

/** "a", "a and b", "a, b and c". */
export function naturalList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export const MIXING = /\b(mix|stir|combine|whisk|fold|add|toss)\b/i;
export const TOKEN = /\{(list:)?([a-z0-9,-]+)\}/g;

const TOKEN_RUN = /\{[a-z0-9-]+\}(?:(?:,\s*|,?\s+and\s+)\{[a-z0-9-]+\})+/g;

/** Treat "{a}, {b} and {c}" like "{list:a,b,c}", so removing one item keeps the sentence whole. */
export function groupTokenRuns(text: string): string {
  return text.replace(TOKEN_RUN, (run) => `{list:${[...run.matchAll(/\{([a-z0-9-]+)\}/g)].map((m) => m[1]).join(",")}}`);
}

export function tidy(text: string): string {
  return text
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/,\s*,/g, ",")
    .replace(/\s*\b(and|or|with|of|the)\s*([,.;:!?])/gi, "$2")
    .replace(/\b(and|or|with)\s+(and|or|with)\b/gi, "$2")
    .replace(/[,;]\s*\./g, ".")
    .replace(/^\s*[,;]\s*/, "")
    .trim();
}

/**
 * Apply a parent's edits to a recipe: swaps, removals, add-ins, extras and portion scaling.
 * Steps whose ingredients were all removed are dropped; the rest are rewritten to match.
 */
export function prepareRecipe(recipe: Recipe, edits: RecipeEdits): PreparedRecipe {
  const scale = edits.portions / recipe.yield;
  const removed = new Set(edits.removed.filter((id) => !(id in edits.swaps)));
  const nameOf = new Map<string, string>();
  const ingredients: PreparedIngredient[] = [];
  const notes: string[] = [];

  for (const ing of recipe.ingredients) {
    if (removed.has(ing.id)) {
      notes.push(`Left out: ${ing.name}.`);
      continue;
    }
    const swap = edits.swaps[ing.id] !== undefined ? ing.substitutes[edits.swaps[ing.id]] : undefined;
    if (swap) {
      nameOf.set(ing.id, swap.name);
      notes.push(`Using ${swap.name} instead of ${ing.name}.`);
      ingredients.push({
        id: ing.id,
        name: swap.name,
        amount: swap.qty === undefined ? formatAmount(ing.qty, ing.unit, scale) : formatAmount(swap.qty, swap.unit ?? ing.unit, scale),
        note: swap.note,
        kind: "swap",
      });
    } else {
      nameOf.set(ing.id, ing.name);
      ingredients.push({
        id: ing.id, name: ing.name, amount: formatAmount(ing.qty, ing.unit, scale), note: ing.note, kind: "base",
      });
    }
  }

  const steps: PreparedStep[] = [];
  const insertAfter = new Map<number, PreparedStep[]>();
  edits.addIns.forEach((n) => {
    const a = recipe.addIns[n];
    if (!a) return;
    const amount = formatAmount(a.qty, a.unit, scale);
    ingredients.push({ id: `add-in-${n}`, name: a.name, amount, note: a.note, kind: "add-in" });
    const list = insertAfter.get(a.afterStep) ?? [];
    list.push({ text: `Add the ${a.name} and stir it through.`, action: "add", uses: [a.name] });
    insertAfter.set(a.afterStep, list);
  });

  steps.push(...(insertAfter.get(0) ?? []));
  recipe.steps.forEach((step, n) => {
    const tokens = [...step.text.matchAll(TOKEN)].flatMap((m) => m[2].split(","));
    const gate = step.requires ?? tokens;
    const dropped = gate.length > 0 && gate.every((id) => removed.has(id));
    if (!dropped) {
      const text = tidy(
        groupTokenRuns(step.text).replace(TOKEN, (_, list: string | undefined, ids: string) => {
          const names = ids.split(",").filter((id) => nameOf.has(id)).map((id) => nameOf.get(id)!);
          return list ? naturalList(names) : (names[0] ?? "");
        }),
      );
      steps.push({
        text,
        action: step.action,
        minutes: step.minutes,
        tip: step.tip,
        uses: [...new Set(tokens.filter((id) => nameOf.has(id)).map((id) => nameOf.get(id)!))],
      });
    }
    steps.push(...(insertAfter.get(n + 1) ?? []));
  });

  const extras = edits.extras.map((e) => e.trim()).filter(Boolean);
  if (extras.length) {
    extras.forEach((e, n) => ingredients.push({ id: `extra-${n}`, name: e, amount: "a handful", kind: "extra" }));
    const extraStep: PreparedStep = {
      text: `Fold in your extras: ${naturalList(extras)}.`,
      action: "add",
      tip: "Chop extras small and soften any hard veg first, so they cook through in time.",
      uses: extras,
    };
    // Fold extras in at the first mixing step; with none, just before the last step.
    const mixAt = steps.findIndex((s) => MIXING.test(s.text));
    steps.splice(mixAt >= 0 ? mixAt + 1 : Math.max(steps.length - 1, 0), 0, extraStep);
  }

  return { recipe, ingredients, steps, notes, toddlerTips: [...recipe.toddlerTips] };
}
