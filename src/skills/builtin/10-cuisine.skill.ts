import { defineSkill } from "../../engine/types";
import { many } from "../answers";

const CUISINES: [string, string, string][] = [
  ["indian", "Indian", "🍛"], ["italian", "Italian", "🍝"], ["mexican", "Mexican", "🌮"],
  ["chinese", "Chinese", "🥟"], ["japanese", "Japanese", "🍙"], ["korean", "Korean", "🥢"],
  ["thai", "Thai", "🥥"], ["vietnamese", "Vietnamese", "🍜"], ["mediterranean", "Mediterranean", "🫒"],
  ["greek", "Greek", "🥙"], ["middle-eastern", "Middle Eastern", "🧆"], ["american", "American", "🥞"],
  ["british", "British", "🥧"], ["french", "French", "🥖"], ["spanish", "Spanish", "🥘"],
  ["caribbean", "Caribbean", "🍌"], ["african", "African", "🍠"], ["global", "Anything goes", "🌍"],
];
const label = Object.fromEntries(CUISINES.map(([v, l]) => [v, l]));

export default defineSkill({
  id: "cuisine",
  name: "Favourite cuisines",
  description: "Puts the cuisines your toddler loves first. Others show below, under Something different.",
  weight: 3,
  questions: [
    {
      id: "cuisines",
      title: "What does your little one love to eat?",
      subtitle: "Pick as many as you like.",
      kind: "multi",
      order: 10,
      choices: CUISINES.map(([value, l, emoji]) => ({ value, label: l, emoji })),
    },
  ],
  score(recipe, { answers }) {
    const liked = many(answers, "cuisines");
    if (!liked.length || liked.includes("global")) return 0;
    return liked.includes(recipe.cuisine)
      ? { score: 1, reason: `${label[recipe.cuisine]} favourite`, match: true }
      : { score: 0, match: false };
  },
});
