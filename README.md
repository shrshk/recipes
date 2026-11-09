# Highchair Chef 🧑‍🍳

Step-by-step recipes for toddlers. Answer a few questions (age, cuisines, meal, time, allergies),
get recipes picked for your little one, make them yours (swap, remove or add ingredients, change
portions), then cook along with one big animated step at a time.

- **46 toddler recipes** across 18 cuisines, researched from parent communities and toddler-food
  creators, written in our own words with credit to each source.
- **Make it yours:** swap an ingredient for a listed substitute, take one out, add extras. The
  steps rewrite themselves to match, and quantities scale with portions.
- **Cook mode:** full-screen steps with an animated scene for each action (simmer, chop, whisk,
  bake…), built-in timers, swipe or arrow keys, and the screen stays on.
- **Toddler safety:** every recipe carries serving and choking notes, and a safety skill adds
  more when a risky ingredient shows up.
- **Extendable:** recommendations come from small plug-in *skills*; animations are plug-in
  *scenes*; recipes are JSON files. Adding any of the three needs no change to the engine.
- **Your own recipes:** save your version of any recipe, or let an assistant make one over
  [MCP](docs/MCP.md) (OpenClaw, Claude Desktop, any MCP client). No accounts: see [HOSTING.md](docs/HOSTING.md).
- Works as a plain static site too; answers and history stay in the browser.

## Run it

```sh
pnpm install
pnpm dev          # http://localhost:5181
pnpm test         # engine, knowledge base and animation checks
pnpm build        # static site in dist/ and server in dist-server/
pnpm start        # app + custom recipes + MCP on http://127.0.0.1:8726
```

In development, run `pnpm server:dev` next to `pnpm dev`; the dev app proxies `/api` and `/mcp` to it.

## How it fits together

```
kb/recipes/*.json          the knowledge base (one recipe per file)
src/kb/                    schema + loader (zod), validated in tests
src/engine/
  recommend.ts             runs skills: filter -> score -> rank, with reasons
  prepare.ts               applies swaps/removals/add-ins/portions, rewrites steps
src/skills/
  builtin/*.skill.ts       cuisine, meal, time, allergens, age, picky, popular, variety, safety
  community/*.skill.ts     your skills go here (example: batch-cook-sunday)
src/ui/actions/scenes/     one animated scene per cooking action
src/ui/screens/            Home -> Ask -> Picks -> Recipe -> Cook -> Done, plus Settings
server/                    one Node process: the app, /api/custom-recipes, /mcp (or --stdio)
```

## Extend it

| I want to… | Do this | Guide |
|---|---|---|
| Add a recipe | Add `kb/recipes/<id>.json` | [RECIPE_SCHEMA.md](docs/RECIPE_SCHEMA.md) |
| Change what gets recommended | Add `src/skills/community/<id>.skill.ts` | [SKILLS.md](docs/SKILLS.md) |
| Add a cooking animation | Add `src/ui/actions/scenes/<id>.action.tsx` | [STEP_ANIMATIONS.md](docs/STEP_ANIMATIONS.md) |
| Connect an assistant | Add the MCP server to your client | [MCP.md](docs/MCP.md) |
| Pull new ideas from Reddit/YouTube, read real recipes from blogs | `pnpm harvest "toddler lunch"`, `pnpm scrape <url>` | [KNOWLEDGE_BASE.md](docs/KNOWLEDGE_BASE.md) |

## Not medical advice

Recipes are ideas from parents, not guidance from a doctor or dietitian. Check with your
pediatrician about allergies, and always supervise toddlers while they eat.

## License

MIT. Recipe sources are credited in each file; the steps are our own wording.
