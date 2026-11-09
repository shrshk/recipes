import { defineSkill } from "../../engine/types";

export default defineSkill({
  id: "popular",
  name: "Parent favourites",
  description: "Nudges up recipes that many parents cook and share.",
  score(recipe) {
    return recipe.popularity >= 0.75
      ? { score: recipe.popularity, reason: "Parent favourite" }
      : recipe.popularity * 0.5;
  },
});
