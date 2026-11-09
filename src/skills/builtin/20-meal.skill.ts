import { defineSkill } from "../../engine/types";
import type { Meal } from "../../kb/schema";
import { one } from "../answers";

export function mealForHour(hour: number): Meal {
  if (hour < 10) return "breakfast";
  if (hour < 14) return "lunch";
  if (hour < 16) return "snack";
  return "dinner";
}

export default defineSkill({
  id: "meal",
  name: "Meal of the day",
  description: "Shows only recipes that suit the meal you are cooking.",
  questions: [
    {
      id: "meal",
      title: "Which meal are we making?",
      kind: "single",
      order: 0,
      choices: [
        { value: "breakfast", label: "Breakfast", emoji: "🌅" },
        { value: "lunch", label: "Lunch", emoji: "☀️" },
        { value: "snack", label: "Snack", emoji: "🍎" },
        { value: "dinner", label: "Dinner", emoji: "🌙" },
      ],
    },
  ],
  filter(recipe, { answers, now }) {
    const meal = (one(answers, "meal") ?? mealForHour(now.getHours())) as Meal;
    return recipe.meals.includes(meal);
  },
});
