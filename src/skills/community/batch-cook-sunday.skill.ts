// Example community skill. Copy this file, change the id, and you have a new skill.
// It is off by default; parents switch it on in Settings. See docs/SKILLS.md.
import { defineSkill } from "../../engine/types";
import { one } from "../answers";

export default defineSkill({
  id: "batch-cook-sunday",
  name: "Batch-cook Sunday",
  description: "On weekends, favours freezer-friendly and batch-cook recipes for the week ahead.",
  enabledByDefault: false,
  weight: 2,
  questions: [
    {
      id: "batch.portions",
      title: "Cooking ahead for the week?",
      kind: "single",
      order: 60,
      defaultValue: "no",
      choices: [
        { value: "yes", label: "Yes, fill the freezer", emoji: "🧊" },
        { value: "no", label: "Just today", emoji: "🍽️" },
      ],
    },
  ],
  score(recipe, { answers, now }) {
    const weekend = now.getDay() === 0 || now.getDay() === 6;
    if (one(answers, "batch.portions") !== "yes" && !weekend) return 0;
    const good = recipe.tags.includes("freezer-friendly") || recipe.tags.includes("batch-cook");
    return good ? { score: 1, reason: "Freezes well" } : 0;
  },
});
