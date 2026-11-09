import { describe, expect, it } from "vitest";
import { recommend } from "./recommend";
import { makeRecipe } from "./fixtures";
import { skills } from "../skills";
import type { SkillContext } from "./types";

const morning = new Date("2026-11-10T08:00:00"); // a Tuesday, breakfast time
const pancakes = makeRecipe();
const congee = makeRecipe({ id: "congee", title: "Congee", cuisine: "chinese", allergens: [] });
const dinner = makeRecipe({ id: "stew", title: "Stew", meals: ["dinner"], allergens: [] });

function ctx(answers: SkillContext["answers"], history: string[] = []): SkillContext {
  return { answers, history, now: morning };
}

describe("recommend with the built-in skills", () => {
  it("never shows a recipe with an avoided allergen", () => {
    const ids = recommend([pancakes, congee], skills, ctx({ avoid: ["egg"] })).map((r) => r.recipe.id);
    expect(ids).toEqual(["congee"]);
  });

  it("defaults the meal from the clock", () => {
    const ids = recommend([pancakes, dinner], skills, ctx({})).map((r) => r.recipe.id);
    expect(ids).toEqual(["test-pancakes"]);
  });

  it("ranks a favourite cuisine first and says why", () => {
    const [top] = recommend([pancakes, congee], skills, ctx({ cuisines: ["chinese"] }));
    expect(top.recipe.id).toBe("congee");
    expect(top.reasons).toContain("Chinese favourite");
  });

  it("pushes down a recipe cooked yesterday", () => {
    const [top] = recommend([pancakes, congee], skills, ctx({}, ["congee"]));
    expect(top.recipe.id).toBe("test-pancakes");
  });

  it("ranks the family's own version above the original", () => {
    const mine = makeRecipe({ id: "my-congee", title: "My Congee", cuisine: "chinese", allergens: [], basedOn: "congee" });
    const [top] = recommend([congee, mine], skills, ctx({}));
    expect(top.recipe.id).toBe("my-congee");
    expect(top.reasons).toContain("Your recipe");
  });

  it("lets the parent switch a skill off", () => {
    const ids = recommend([pancakes, congee], skills, ctx({ avoid: ["egg"] }), { toggles: { allergens: false } });
    expect(ids.map((r) => r.recipe.id).sort()).toEqual(["congee", "test-pancakes"]);
  });
});
