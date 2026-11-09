import { defineSkill } from "../../engine/types";

/** Recipes the family saved (or an assistant made for them) come before the originals. */
export default defineSkill({
  id: "family",
  name: "Your recipes first",
  description: "Puts recipes you saved or made with an assistant ahead of the built-in ones.",
  weight: 2,
  score(recipe) {
    const mine = recipe.basedOn !== undefined || recipe.sources.some((s) => s.platform === "custom");
    return mine ? { score: 1, reason: "Your recipe" } : 0;
  },
});
