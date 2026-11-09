import { defineSkill } from "../../engine/types";
import { ALLERGENS } from "../../kb/schema";
import { many } from "../answers";

const LABELS: Record<string, string> = {
  dairy: "Dairy", egg: "Egg", gluten: "Gluten", wheat: "Wheat", peanut: "Peanut", "tree-nut": "Tree nuts",
  soy: "Soy", fish: "Fish", shellfish: "Shellfish", sesame: "Sesame",
};

export default defineSkill({
  id: "allergens",
  name: "Allergy guard",
  description: "Never shows a recipe that contains something you said to avoid.",
  questions: [
    {
      id: "avoid",
      title: "Anything we should avoid?",
      subtitle: "Allergies or foods you are not giving yet.",
      kind: "multi",
      order: 40,
      choices: ALLERGENS.map((a) => ({ value: a, label: LABELS[a] })),
    },
  ],
  filter(recipe, { answers }) {
    const avoid = many(answers, "avoid");
    const hit = recipe.allergens.find((a) => avoid.includes(a));
    return hit ? `contains ${hit}` : true;
  },
});
