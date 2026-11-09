import { defineSkill } from "../../engine/types";
import { one } from "../answers";

export default defineSkill({
  id: "picky",
  name: "Picky-eater helper",
  description: "In a picky phase, favours hidden-veg and finger foods toddlers can feed themselves.",
  weight: 2,
  questions: [
    {
      id: "picky",
      title: "How is the eating going lately?",
      kind: "single",
      order: 50,
      defaultValue: "good",
      choices: [
        { value: "good", label: "Eats most things", emoji: "😋" },
        { value: "some", label: "Some days", emoji: "🤔" },
        { value: "picky", label: "Very picky", emoji: "🙅" },
      ],
    },
  ],
  score(recipe, { answers }) {
    const level = one(answers, "picky");
    if (level !== "picky" && level !== "some") return 0;
    const factor = level === "picky" ? 1 : 0.5;
    if (recipe.tags.includes("hidden-veg")) return { score: factor, reason: "Veggies hidden inside" };
    if (recipe.tags.includes("finger-food")) return { score: factor * 0.7, reason: "Little hands can hold it" };
    return 0;
  },
});
