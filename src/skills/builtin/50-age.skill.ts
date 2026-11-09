import { defineSkill } from "../../engine/types";
import { one } from "../answers";

export default defineSkill({
  id: "age",
  name: "Age fit",
  description: "Hides recipes meant for older children.",
  questions: [
    {
      id: "age",
      title: "How old is your little one?",
      kind: "single",
      order: 5,
      defaultValue: "24",
      choices: [
        { value: "12", label: "1 – 1½ yrs", emoji: "🍼" },
        { value: "18", label: "1½ – 2 yrs", emoji: "🧸" },
        { value: "24", label: "2 – 3 yrs", emoji: "🚲" },
        { value: "36", label: "3+ yrs", emoji: "🎒" },
      ],
    },
  ],
  filter(recipe, { answers }) {
    const months = Number(one(answers, "age") ?? 24);
    return recipe.minAgeMonths <= months;
  },
});
