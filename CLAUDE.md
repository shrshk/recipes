# Highchair Chef (recipes)

Toddler recipe app. Vite + React 18 + TypeScript, `motion` for animation, `zod` for the recipe
schema. No backend; state is localStorage (`src/state/store.ts`).

- Three plug-in points, each found by `import.meta.glob`, never by a hand-kept list:
  recipes `kb/recipes/*.json`, skills `src/skills/**/*.skill.ts`, scenes `src/ui/actions/scenes/*.action.tsx`.
  Keep it that way: a new recipe, skill or scene must not need an engine change.
- `pnpm test` must pass before a commit. It validates every recipe and step token, and fails if
  >10% of steps fall back to the generic `prep` scene.
- After editing recipes, run `pnpm render-check` and read steps with optional ingredients removed.
- `server/` is one Node process (built with `vite build --ssr`, so the globs work there too): static app,
  `/api/custom-recipes` (trusts the network, refuses cross-site writes), `/mcp` (bearer token, stateless).
  No user accounts by design: docs/HOSTING.md. Custom recipes are JSON files validated by `src/kb/validate.ts`.
- Recipe text is written in our own words; every recipe credits a real source URL or `family`.
