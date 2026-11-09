import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import schemaDoc from "../docs/RECIPE_SCHEMA.md?raw";
import { prepareRecipe } from "../src/engine/prepare";
import { adaptRecipe, recommend } from "../src/engine/recommend";
import type { Answers, RecipeEdits } from "../src/engine/types";
import { ALLERGENS, CUISINES, MEALS, type Recipe } from "../src/kb/schema";
import { skills } from "../src/skills";
import { ACTION_IDS } from "../src/ui/actions/ids";
import type { CustomStore } from "./store";

const INSTRUCTIONS = `Highchair Chef: toddler recipes (ages 1-4) with step-by-step cook mode.
- find_recipes to search or get suggestions; get_recipe for one recipe's full JSON.
- prepare_recipe shows a recipe with swaps/removals/extras/portions applied, as the parent would cook it.
- To make a custom recipe: call get_recipe_format first, start from get_recipe of a similar recipe when one exists,
  then save_custom_recipe. It validates and returns problems to fix; fix them and call it again.
- Toddler rules: little or no salt, no honey under 12 months, no whole nuts/grapes/popcorn, mild heat, soft textures.`;

const text = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
const fail = (message: string, extra?: object) => ({ ...text({ error: message, ...extra }), isError: true });

function summary(r: Recipe, custom: boolean) {
  return {
    id: r.id, title: r.title, summary: r.summary, cuisine: r.cuisine, meals: r.meals,
    minutes: r.prepMinutes + r.cookMinutes, minAgeMonths: r.minAgeMonths, allergens: r.allergens, tags: r.tags,
    ...(custom ? { custom: true } : {}),
  };
}

export function createMcpServer(kb: Recipe[], store: CustomStore): McpServer {
  const server = new McpServer({ name: "highchair-chef", version: "0.1.0" }, { instructions: INSTRUCTIONS });
  const all = () => {
    const custom = store.list();
    return { recipes: [...kb, ...custom], customIds: new Set(custom.map((r) => r.id)) };
  };
  const find = (id: string) => all().recipes.find((r) => r.id === id);

  server.registerTool(
    "find_recipes",
    {
      title: "Find toddler recipes",
      description: "Search and rank recipes, best match first. Every filter is optional. Includes custom recipes.",
      inputSchema: {
        query: z.string().optional().describe("Words to match in title, summary, ingredients or tags, e.g. 'lentil'"),
        cuisines: z.array(z.enum(CUISINES)).optional().describe("Preferred cuisines; ranked first, not exclusive"),
        meal: z.enum(MEALS).optional(),
        maxMinutes: z.number().int().positive().optional().describe("Total prep + cook time limit"),
        avoid: z.array(z.enum(ALLERGENS)).optional().describe("Allergens to exclude completely"),
        ageMonths: z.number().int().min(6).max(72).optional().describe("Child's age; hides recipes for older children"),
        picky: z.boolean().optional().describe("Favour hidden-veg and finger foods"),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async ({ query, cuisines, meal, maxMinutes, avoid, ageMonths, picky, limit }) => {
      const { recipes, customIds } = all();
      const words = query?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
      const pool = recipes.filter((r) => {
        const hay = [r.title, r.summary, r.cuisine, ...r.tags, ...r.ingredients.map((i) => i.name)].join(" ").toLowerCase();
        return words.every((w) => hay.includes(w));
      });
      const answers: Answers = {
        cuisines, meal, avoid,
        time: maxMinutes ? String(maxMinutes) : "any",
        age: String(ageMonths ?? 36),
        picky: picky ? "picky" : "good",
      };
      // Without a meal, don't let the meal skill guess from the server's clock.
      const ranked = recommend(pool, skills, { answers, history: [], now: new Date() }, {
        limit: limit ?? 10,
        toggles: meal ? {} : { meal: false },
      });
      return text(ranked.map((p) => ({ ...summary(p.recipe, customIds.has(p.recipe.id)), why: p.reasons })));
    },
  );

  server.registerTool(
    "get_recipe",
    { title: "Get a recipe", description: "The full recipe JSON (ingredients with ids, steps with {tokens}).", inputSchema: { id: z.string() } },
    async ({ id }) => {
      const r = find(id);
      return r ? text(r) : fail(`no recipe "${id}"; use find_recipes to get ids`);
    },
  );

  server.registerTool(
    "prepare_recipe",
    {
      title: "Prepare a recipe with changes",
      description: "Apply swaps, removals, extras and portions, and return the ingredient list and steps as the parent will cook them.",
      inputSchema: {
        id: z.string(),
        remove: z.array(z.string()).optional().describe("Ingredient ids to leave out"),
        swaps: z.record(z.string(), z.number().int().min(0)).optional().describe("Ingredient id -> index into its substitutes"),
        extras: z.array(z.string()).optional().describe("Extra ingredients to fold in, e.g. 'frozen peas'"),
        portions: z.number().int().min(1).max(24).optional().describe("Toddler portions (default: the recipe's yield)"),
      },
    },
    async ({ id, remove, swaps, extras, portions }) => {
      const r = find(id);
      if (!r) return fail(`no recipe "${id}"`);
      const edits: RecipeEdits = { removed: remove ?? [], swaps: swaps ?? {}, addIns: [], extras: extras ?? [], portions: portions ?? r.yield };
      const p = adaptRecipe(prepareRecipe(r, edits), skills, { answers: {}, history: [], now: new Date() });
      return text({
        title: r.title, portions: edits.portions, notes: p.notes,
        ingredients: p.ingredients.map((i) => `${i.amount} ${i.name}${i.note ? ` (${i.note})` : ""}`),
        steps: p.steps.map((s) => s.text + (s.minutes ? ` [${s.minutes} min]` : "") + (s.tip ? ` Tip: ${s.tip}` : "")),
        toddlerTips: p.toddlerTips,
      });
    },
  );

  server.registerTool(
    "get_recipe_format",
    { title: "Recipe format", description: "The JSON format a custom recipe must follow, with rules. Read before save_custom_recipe." },
    async () => ({
      content: [{
        type: "text" as const,
        text: `${schemaDoc}\n\n## For custom recipes\n- id: new kebab-case id, not a built-in recipe's id. Saving an existing custom id replaces it.\n- sources: optional for custom recipes; defaults to platform "custom".\n- basedOn: the id of the recipe you adapted, if any.\n- Valid step actions: ${[...ACTION_IDS].join(", ")}.`,
      }],
    }),
  );

  server.registerTool(
    "save_custom_recipe",
    {
      title: "Save a custom recipe",
      description: "Validate and save a custom recipe (format: get_recipe_format). Returns problems to fix if invalid. It appears in the app right away.",
      inputSchema: { recipe: z.record(z.string(), z.unknown()).describe("The full recipe object") },
    },
    async ({ recipe }) => {
      const result = store.save(recipe);
      if (!result.ok) return fail("recipe not saved; fix these and call again", { problems: result.problems });
      return text({ saved: result.recipe.id, title: result.recipe.title });
    },
  );

  server.registerTool(
    "list_custom_recipes",
    { title: "List custom recipes", description: "Custom recipes saved by the family or by assistants." },
    async () => text(store.list().map((r) => summary(r, true))),
  );

  server.registerTool(
    "delete_custom_recipe",
    { title: "Delete a custom recipe", description: "Delete one custom recipe by id. Built-in recipes cannot be deleted.", inputSchema: { id: z.string() } },
    async ({ id }) => (store.delete(id) ? text({ deleted: id }) : fail(`no custom recipe "${id}"`)),
  );

  return server;
}
