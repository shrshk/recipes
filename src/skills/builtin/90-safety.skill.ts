import { defineSkill } from "../../engine/types";

/** Ingredient-name patterns that need a toddler choking or safety note. */
const HAZARDS: [RegExp, string][] = [
  [/\bgrapes?\b|cherry tomato|blueberr|\bolives\b/i, "Quarter round foods like grapes, cherry tomatoes and olives lengthwise."],
  [/\b(nuts|almonds?|cashews?|walnuts?|pecans?)\b(?! butter)/i, "Use nuts only ground or as smooth butter. Whole nuts are a choking risk under 4."],
  [/peanut butter|nut butter|tahini/i, "Spread nut or seed butters thinly. Thick globs are hard to swallow."],
  [/sausage|hot dog/i, "Cut sausages lengthwise into thin strips, never coins."],
  [/raw carrot|\bcelery|\bapples?\b(?! ?sauce)/i, "Grate or steam hard raw fruit and veg until soft."],
  [/honey/i, "No honey for babies under 12 months."],
  [/chili|chilli|cayenne|jalape/i, "Keep the heat mild. Add chili to the grown-up portions after serving the toddler."],
];

export default defineSkill({
  id: "safety",
  name: "Toddler safety notes",
  description: "Adds choking and heat notes when a recipe uses a risky ingredient.",
  adapt(prepared) {
    const tips = new Set(prepared.toddlerTips);
    const names = prepared.ingredients.map((i) => i.name).join(" | ");
    for (const [pattern, tip] of HAZARDS) if (pattern.test(names)) tips.add(tip);
    tips.add("Check the temperature on your wrist before serving.");
    return { ...prepared, toddlerTips: [...tips] };
  },
});
