import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { beforeEach, describe, expect, it } from "vitest";
import { knowledgeBase } from "../src/kb";
import { createMcpServer } from "./mcp";
import { CustomStore } from "./store";

const kb = knowledgeBase().recipes;
let client: Client;
let store: CustomStore;

async function call(name: string, args: Record<string, unknown> = {}) {
  const res = (await client.callTool({ name, arguments: args })) as { content: { text: string }[]; isError?: boolean };
  return { isError: !!res.isError, body: JSON.parse(res.content[0].text) };
}

beforeEach(async () => {
  store = new CustomStore(mkdtempSync(join(tmpdir(), "recipes-test-")), new Set(kb.map((r) => r.id)));
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createMcpServer(kb, store).connect(a);
  client = new Client({ name: "test", version: "0" });
  await client.connect(b);
});

const custom = {
  id: "grandmas-dal",
  title: "Grandma's Dal",
  summary: "Soft yellow dal for little ones.",
  cuisine: "indian",
  meals: ["lunch", "dinner"],
  minAgeMonths: 12,
  prepMinutes: 5,
  cookMinutes: 25,
  yield: 4,
  difficulty: "easy",
  ingredients: [
    { id: "dal", name: "yellow moong dal", qty: 0.5, unit: "cup" },
    { id: "ghee", name: "ghee", qty: 1, unit: "tsp", optional: true },
  ],
  steps: [{ text: "Simmer {dal} in water until very soft.", minutes: 20 }, { text: "Stir in {ghee} and cool." }],
};

describe("MCP server", () => {
  it("never returns a recipe with an avoided allergen", async () => {
    const { body } = await call("find_recipes", { avoid: ["egg", "dairy"], limit: 50 });
    expect(body.length).toBeGreaterThan(0);
    for (const r of body) expect(r.allergens).not.toContain("egg"), expect(r.allergens).not.toContain("dairy");
  });

  it("filters by query words", async () => {
    const { body } = await call("find_recipes", { query: "lentil" });
    expect(body.map((r: { id: string }) => r.id)).toContain("lentil-fritters");
  });

  it("saves a valid custom recipe and finds it afterwards", async () => {
    expect((await call("save_custom_recipe", { recipe: custom })).body).toEqual({ saved: "grandmas-dal", title: "Grandma's Dal" });
    const { body } = await call("find_recipes", { query: "dal", cuisines: ["indian"] });
    expect(body.find((r: { id: string }) => r.id === "grandmas-dal")).toMatchObject({ custom: true });
    expect((await call("get_recipe", { id: "grandmas-dal" })).body.sources[0].platform).toBe("custom");
  });

  it("returns fixable problems for an invalid recipe and saves nothing", async () => {
    const bad = { ...custom, steps: [{ text: "Add {salt}.", action: "juggle" }] };
    const { isError, body } = await call("save_custom_recipe", { recipe: bad });
    expect(isError).toBe(true);
    expect(body.problems).toEqual(expect.arrayContaining(["step 1: unknown token {salt}", expect.stringMatching(/unknown action "juggle"/)]));
    expect(store.list()).toEqual([]);
  });

  it("refuses to overwrite a built-in recipe", async () => {
    const { isError, body } = await call("save_custom_recipe", { recipe: { ...custom, id: kb[0].id } });
    expect(isError).toBe(true);
    expect(body.problems[0]).toMatch(/built-in/);
  });

  it("prepares a recipe with a removal", async () => {
    await call("save_custom_recipe", { recipe: custom });
    const { body } = await call("prepare_recipe", { id: "grandmas-dal", remove: ["ghee"], portions: 8 });
    expect(body.ingredients).toEqual(["1 cup yellow moong dal"]);
    // "Stir in {ghee} and cool." names only ghee, so it goes with it.
    expect(body.steps).toEqual(["Simmer yellow moong dal in water until very soft. [20 min]"]);
  });

  it("deletes a custom recipe", async () => {
    await call("save_custom_recipe", { recipe: custom });
    expect((await call("delete_custom_recipe", { id: "grandmas-dal" })).body).toEqual({ deleted: "grandmas-dal" });
    expect(store.list()).toEqual([]);
  });
});
