import { defineSkill } from "../../engine/types";

export default defineSkill({
  id: "variety",
  name: "Keep it varied",
  description: "Pushes down what you cooked recently, so the week does not repeat.",
  score(recipe, { history }) {
    const at = history.indexOf(recipe.id);
    if (at === -1) return history.length ? { score: 0.3, reason: "Something new" } : 0;
    return at < 3 ? -2 : -0.5;
  },
});
