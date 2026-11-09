import { describe, expect, it } from "vitest";
import { knowledgeBase } from "../../kb";
import { FALLBACK_ACTION, resolveAction } from "./registry";
import { stepActions } from ".";
import { ACTION_IDS } from "./ids";

const ids = new Set(stepActions.map((a) => a.id));

describe("step actions", () => {
  it("has unique ids and a fallback", () => {
    expect(ids.size).toBe(stepActions.length);
    expect(ids.has(FALLBACK_ACTION)).toBe(true);
  });

  it("names each scene file after its id", () => {
    expect([...ACTION_IDS].sort()).toEqual([...ids].sort());
  });

  it("gives each verb to one action only", () => {
    const owner = new Map<string, string>();
    for (const a of stepActions)
      for (const v of a.verbs) {
        expect(owner.get(v), `"${v}" is in ${owner.get(v)} and ${a.id}`).toBeUndefined();
        owner.set(v, a.id);
      }
  });

  it("prefers a declared action, then a keyword, then the first verb", () => {
    const pick = (text: string, action?: string) => resolveAction(stepActions, { text, action }).id;
    expect(pick("Mash the banana.", "bake")).toBe("bake");
    expect(pick("Spoon into the cups and bake until firm.")).toBe("bake");
    expect(pick("Mash {banana}, then serve.")).toBe("mash");
    expect(pick("Wonder about life.")).toBe(FALLBACK_ACTION);
  });

  it("every declared recipe action exists, and most steps get a specific scene", () => {
    let total = 0;
    const fallback: string[] = [];
    for (const r of knowledgeBase().recipes)
      for (const s of r.steps) {
        total++;
        if (s.action) expect(ids.has(s.action), `${r.id}: unknown action ${s.action}`).toBe(true);
        if (resolveAction(stepActions, s).id === FALLBACK_ACTION) fallback.push(`${r.id}: ${s.text}`);
      }
    expect(fallback.length / total, fallback.join("\n")).toBeLessThan(0.1);
  });
});
