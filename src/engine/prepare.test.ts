import { describe, expect, it } from "vitest";
import { emptyEdits, formatQty, prepareRecipe } from "./prepare";
import { makeRecipe } from "./fixtures";

const recipe = makeRecipe();

describe("formatQty", () => {
  it("rounds to kitchen fractions", () => {
    expect(formatQty(1.5)).toBe("1½");
    expect(formatQty(0.33)).toBe("⅓");
    expect(formatQty(2)).toBe("2");
    expect(formatQty(0.98)).toBe("1");
  });
});

describe("prepareRecipe", () => {
  it("keeps the recipe as written with no edits", () => {
    const p = prepareRecipe(recipe, emptyEdits(recipe));
    expect(p.steps.map((s) => s.text)).toEqual([
      "Mash ripe banana in a bowl.",
      "Whisk in egg and milk.",
      "Scatter blueberries on top.",
      "Cook small rounds for 2 minutes a side.",
      "Cool and serve.",
    ]);
  });

  it("drops a step whose required ingredient was removed", () => {
    const p = prepareRecipe(recipe, { ...emptyEdits(recipe), removed: ["berries"] });
    expect(p.steps.some((s) => s.text.includes("Scatter"))).toBe(false);
    expect(p.notes).toContain("Left out: blueberries.");
  });

  it("renders a list token without the removed item", () => {
    const p = prepareRecipe(recipe, { ...emptyEdits(recipe), removed: ["egg"] });
    expect(p.steps[1].text).toBe("Whisk in milk.");
  });

  it("drops a dangling joining word with the removed item", () => {
    const r = makeRecipe({ steps: [{ text: "Mash {banana} with {berries}." }] });
    expect(prepareRecipe(r, { ...emptyEdits(r), removed: ["berries"] }).steps[0].text).toBe("Mash ripe banana.");
  });

  it("treats a run of tokens like a list", () => {
    const r = makeRecipe({ steps: [{ text: "Add {banana}, {egg} and {berries} to a bowl." }] });
    expect(prepareRecipe(r, { ...emptyEdits(r), removed: ["berries"] }).steps[0].text).toBe(
      "Add ripe banana and egg to a bowl.",
    );
  });

  it("uses the substitute name and amount for a swap", () => {
    const p = prepareRecipe(recipe, { ...emptyEdits(recipe), swaps: { milk: 0 } });
    expect(p.steps[1].text).toBe("Whisk in egg and oat milk.");
    expect(p.ingredients.find((i) => i.id === "milk")).toMatchObject({ name: "oat milk", amount: "½ cup", kind: "swap" });
  });

  it("scales amounts to the portions asked for", () => {
    const p = prepareRecipe(recipe, { ...emptyEdits(recipe), portions: 8 });
    expect(p.ingredients.find((i) => i.id === "egg")!.amount).toBe("4");
    expect(p.ingredients.find((i) => i.id === "milk")!.amount).toBe("1 cup");
  });

  it("inserts an add-in after its step", () => {
    const p = prepareRecipe(recipe, { ...emptyEdits(recipe), addIns: [0] });
    expect(p.steps[2].text).toMatch(/^Add the cinnamon/);
  });

  it("folds extras in at the first mixing step", () => {
    const p = prepareRecipe(recipe, { ...emptyEdits(recipe), extras: ["grated zucchini"] });
    expect(p.steps.map((s) => s.text).slice(1, 3)).toEqual(["Whisk in egg and milk.", "Fold in your extras: grated zucchini."]);
  });

  it("puts extras before the last step when nothing is mixed", () => {
    const r = makeRecipe({ steps: [{ text: "Bake {banana}." }, { text: "Serve." }] });
    const p = prepareRecipe(r, { ...emptyEdits(r), extras: ["peas"] });
    expect(p.steps.map((s) => s.text)).toEqual(["Bake ripe banana.", "Fold in your extras: peas.", "Serve."]);
  });
});
