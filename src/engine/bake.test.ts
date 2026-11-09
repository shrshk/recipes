import { describe, expect, it } from "vitest";
import { bakeRecipe } from "./bake";
import { emptyEdits, prepareRecipe } from "./prepare";
import { makeRecipe } from "./fixtures";
import { RecipeSchema, recipeProblems } from "../kb/schema";
import type { RecipeEdits } from "./types";

const recipe = makeRecipe();
const edits: RecipeEdits = {
  removed: ["berries", "egg"],
  swaps: { milk: 0 },
  addIns: [0],
  extras: ["grated zucchini"],
  portions: 8,
};

describe("bakeRecipe", () => {
  const baked = bakeRecipe(recipe, edits, "my-pancakes", "My Pancakes");

  it("produces a valid recipe", () => {
    expect(RecipeSchema.parse(baked)).toBeTruthy();
    expect(recipeProblems(baked)).toEqual([]);
  });

  it("reads the same as the edited original", () => {
    const text = (r: ReturnType<typeof prepareRecipe>) => r.steps.map((s) => s.text);
    expect(text(prepareRecipe(baked, emptyEdits(baked)))).toEqual(text(prepareRecipe(recipe, edits)));
  });

  it("keeps the swap as the ingredient and the original as its substitute", () => {
    const milk = baked.ingredients.find((i) => i.id === "milk")!;
    expect(milk).toMatchObject({ name: "oat milk", qty: 1, unit: "cup" });
    expect(milk.substitutes[0]).toMatchObject({ name: "milk", qty: 1 });
  });

  it("drops removed ingredients and scales the rest", () => {
    expect(baked.ingredients.map((i) => i.id)).not.toContain("egg");
    expect(baked.ingredients.find((i) => i.id === "banana")!.qty).toBe(2);
    expect(baked.yield).toBe(8);
    expect(baked.basedOn).toBe("test-pancakes");
  });
});
