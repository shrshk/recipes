import { RecipeSchema, type Recipe } from "../kb/schema";

export function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return RecipeSchema.parse({
    id: "test-pancakes",
    title: "Test Pancakes",
    summary: "Fixture.",
    cuisine: "american",
    meals: ["breakfast"],
    minAgeMonths: 12,
    prepMinutes: 5,
    cookMinutes: 10,
    yield: 4,
    difficulty: "easy",
    tags: [],
    allergens: ["egg", "dairy"],
    ingredients: [
      { id: "banana", name: "ripe banana", qty: 1, unit: "" },
      { id: "egg", name: "egg", qty: 2, unit: "", substitutes: [{ name: "flax egg", qty: 2, unit: "tbsp" }] },
      { id: "milk", name: "milk", qty: 0.5, unit: "cup", substitutes: [{ name: "oat milk", qty: 0.5, unit: "cup" }] },
      { id: "berries", name: "blueberries", qty: 0.25, unit: "cup", optional: true },
    ],
    steps: [
      { text: "Mash {banana} in a bowl." },
      { text: "Whisk in {list:egg,milk}." },
      { text: "Scatter {berries} on top.", requires: ["berries"] },
      { text: "Cook small rounds for 2 minutes a side.", minutes: 4 },
      { text: "Cool and serve." },
    ],
    addIns: [{ name: "cinnamon", qty: 0.25, unit: "tsp", afterStep: 2 }],
    sources: [{ platform: "family", url: "", title: "Fixture" }],
    ...overrides,
  });
}
