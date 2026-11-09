import { describe, expect, it } from "vitest";
import { loadKnowledgeBase } from ".";

describe("knowledge base", () => {
  const { recipes, errors } = loadKnowledgeBase();

  it("every recipe file is valid", () => {
    expect(errors).toEqual([]);
  });

  it("has recipes for every meal", () => {
    for (const meal of ["breakfast", "lunch", "dinner", "snack"] as const)
      expect(recipes.filter((r) => r.meals.includes(meal)).length, meal).toBeGreaterThan(2);
  });

  it("rejects a step token that names no ingredient", () => {
    const bad = {
      ...recipes[0],
      steps: [{ text: "Stir in {ghost}." }],
    };
    const result = loadKnowledgeBase({ [`x/${recipes[0].id}.json`]: bad });
    expect(result.errors[0].problems).toContain("step 1: unknown token {ghost}");
  });
});
