import type { Recipe } from "../kb/schema";

// Title keywords -> a dish emoji. First match wins, so put specific words before general ones.
const DISH: [RegExp, string][] = [
  [/pancake|uttapam|chilla|okonomiyaki/i, "🥞"], [/muffin|oatmeal cup/i, "🧁"], [/french toast/i, "🍞"],
  [/onigiri/i, "🍙"], [/fried rice|congee|porridge|chao|khichdi|rice bowl/i, "🍚"],
  [/pho|noodle|pad thai|soup/i, "🍜"], [/mac and cheese|pasta|ratatouille/i, "🍝"], [/pizza/i, "🍕"],
  [/taco|quesadilla/i, "🌮"], [/falafel|hummus/i, "🧆"], [/fish/i, "🐟"], [/meatball/i, "🧆"],
  [/nugget|chicken/i, "🍗"], [/shepherd|pie/i, "🥧"], [/tofu/i, "🥢"],
  [/egg|omelet|tortilla|gyeran|kai jeow|shakshuka/i, "🍳"], [/plantain|banana/i, "🍌"],
  [/sweet potato|stew/i, "🍠"], [/paratha/i, "🫓"], [/fritter/i, "🥕"], [/spinach/i, "🥬"],
];

const CUISINE_HUES: Record<string, number> = {
  indian: 28, italian: 8, mexican: 45, chinese: 0, japanese: 340, korean: 350, thai: 140,
  vietnamese: 160, mediterranean: 200, greek: 210, "middle-eastern": 35, american: 18, british: 230,
  french: 260, spanish: 20, caribbean: 90, african: 30, global: 280,
};

export function dishEmoji(recipe: Recipe): string {
  return DISH.find(([re]) => re.test(recipe.title))?.[1] ?? "🍽️";
}

/** A soft two-stop gradient per cuisine, so cards are recognisable at a glance. */
export function dishGradient(recipe: Recipe): string {
  const h = CUISINE_HUES[recipe.cuisine] ?? 20;
  return `linear-gradient(140deg, hsl(${h} 92% 86%), hsl(${(h + 34) % 360} 85% 76%))`;
}

export function cuisineLabel(c: string): string {
  return c.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

/** "Indian", "Indian or Thai", "Indian, Thai or Korean" for the parent's chosen cuisines. */
export function cuisineNames(chosen: string | string[] | undefined): string {
  const names = (Array.isArray(chosen) ? chosen : chosen ? [chosen] : []).map(cuisineLabel);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names.at(-1)}` : (names[0] ?? "");
}

export function totalMinutes(r: Recipe): number {
  return r.prepMinutes + r.cookMinutes;
}
