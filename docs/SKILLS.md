# Writing a recommendation skill

A skill changes which recipes the app suggests, and how. Every built-in behaviour is a skill:
favourite cuisines, the allergy guard, the time budget, the picky-eater helper. You can add your
own without touching the engine.

## The short version

1. Copy `src/skills/community/batch-cook-sunday.skill.ts` to `src/skills/community/<your-id>.skill.ts`.
2. Change the `id`, `name` and `description`, and the hooks.
3. Run `pnpm dev`. The skill shows in Settings and its questions show on the home screen.

Any `*.skill.ts` file under `src/skills/` is found at build time. There is no list to edit.

## The hooks

All hooks are optional. The engine runs them in this order.

| Hook | Signature | Use it to |
|---|---|---|
| `questions` | `Question[]` | Ask the parent something. Answers arrive in `ctx.answers[question.id]`. |
| `filter` | `(recipe, ctx) => boolean \| string` | Hide a recipe. Return `false`, or a string that says why. |
| `score` | `(recipe, ctx) => number \| { score, reason, match }` | Add points. The engine multiplies by `weight` and sums all skills. A `reason` is shown on the card ("Freezes well"). `match: false` means "not what the parent asked for": the recipe goes under "Something different". |
| `adapt` | `(prepared, ctx) => prepared` | Change the recipe before cooking: add tips, rewrite steps. Return a new object; do not mutate. |

`ctx` holds `answers` (all onboarding answers), `history` (recipe ids cooked before, newest
first) and `now`.

Other fields:

- `weight` (default 1): how much your `score` counts against other skills. The cuisine skill
  uses 3; nudges like popularity use 1.
- `enabledByDefault` (default true): set `false` for opt-in skills. Parents switch skills on
  and off in Settings.

## Example: an iron boost

```ts
import { defineSkill } from "../../engine/types";

export default defineSkill({
  id: "iron-boost",
  name: "Iron boost",
  description: "Favours iron-rich recipes, and suggests vitamin C on the side.",
  enabledByDefault: false,
  weight: 2,
  score: (recipe) => (recipe.tags.includes("iron-rich") ? { score: 1, reason: "Iron-rich" } : 0),
  adapt: (prepared) => ({
    ...prepared,
    toddlerTips: [...prepared.toddlerTips, "Serve with strawberries or orange slices: vitamin C helps iron absorb."],
  }),
});
```

## Asking a question

```ts
questions: [
  {
    id: "iron.level",           // namespace your ids: "<skill>.<name>"
    title: "Has your doctor mentioned iron?",
    kind: "single",             // or "multi"
    order: 70,                  // core questions use 0-50
    defaultValue: "no",
    choices: [
      { value: "yes", label: "Yes", emoji: "🩸" },
      { value: "no", label: "No", emoji: "👍" },
    ],
  },
],
```

Read it back with the helpers in `src/skills/answers.ts`: `one(ctx.answers, "iron.level")` or
`many(ctx.answers, "cuisines")`.

## Testing

Add a case to `src/engine/recommend.test.ts`, or a `<your-id>.test.ts` beside your skill. Build
recipes with `makeRecipe()` from `src/engine/fixtures.ts`, and assert on what `recommend()` returns.

## Rules

- Never weaken the allergy guard. A skill may hide more recipes, never show one the parent said to avoid.
- Keep skills pure: no network calls, no storage. The engine may call them many times per render.
