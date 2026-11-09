import { defineSkill } from "../../engine/types";
import { one } from "../answers";

export default defineSkill({
  id: "time",
  name: "Time budget",
  description: "Hides recipes that take longer than you have, and favours quick ones.",
  questions: [
    {
      id: "time",
      title: "How much time do you have?",
      kind: "single",
      order: 30,
      defaultValue: "any",
      choices: [
        { value: "15", label: "15 min", emoji: "⚡" },
        { value: "30", label: "30 min", emoji: "⏱️" },
        { value: "45", label: "45 min", emoji: "🍳" },
        { value: "any", label: "No rush", emoji: "🛋️" },
      ],
    },
  ],
  filter(recipe, { answers }) {
    const max = Number(one(answers, "time"));
    return Number.isNaN(max) || recipe.prepMinutes + recipe.cookMinutes <= max;
  },
  score(recipe) {
    const total = recipe.prepMinutes + recipe.cookMinutes;
    return total <= 20 ? { score: 0.5, reason: `Ready in ${total} min` } : 0;
  },
});
