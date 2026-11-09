# Step animations

In cook mode every step plays a short looping scene: a pot simmering, a knife chopping, a bowl
being whisked. Scenes are generic. They draw the step's own ingredients as emoji, so one "boil"
scene works for congee, pho and pasta.

## How a step gets its scene

`resolveAction` in `src/ui/actions/registry.ts` picks one in this order:

1. The step's `action` field, if the recipe sets one.
2. A **keyword** anywhere in the text: "…then bake until firm" plays `bake`.
3. The first known **verb** in the text: "Mash the banana…" plays `mash`.
4. The fallback scene, `prep`.

So a new recipe needs no code. Write natural steps and the right scenes play. Set `action` only
when the guess is wrong.

## Adding a scene

Create `src/ui/actions/scenes/<id>.action.tsx`:

```tsx
import { defineAction } from "../registry";
import { Drop, Emoji, Stage, loop } from "./_parts";

export default defineAction({
  id: "microwave",
  label: "Microwave",
  verbs: ["microwave", "zap"],
  keywords: ["microwave"],
  Scene: ({ emojis }) => (
    <Stage>
      <Drop emojis={emojis} y={56} />
      <Emoji e="📦" y={62} size={110} animate={{ scale: [1, 1.04, 1] }} transition={loop(0.8)} />
    </Stage>
  ),
});
```

That is all. The registry finds the file at build time.

`Scene` receives:

- `emojis`: up to four emoji for the step's main ingredients (`🥕`, `🥚`). May be empty, so
  always have a default.
- `minutes`: the step's wait, if any.

Shared parts in `scenes/_parts.tsx`: `Stage` (the 260x210 box), `Emoji` (placed by its centre,
in percent), `Drop` (ingredients falling in), `Bubbles`, `Steam`, and `loop(duration, delay)` for
repeating transitions. Animations use [Motion](https://motion.dev). Visitors with "reduce
motion" turned on get still scenes automatically.

## Rules

- A verb belongs to one scene only. The test `src/ui/actions/actions.test.ts` fails on duplicates.
- The same test checks that fewer than 10% of all recipe steps fall back to `prep`. If your new
  recipes trip it, add the missing verb to the right scene.
- Ingredient emoji come from `src/ui/ingredientEmoji.ts`. Add a pattern there when a new
  ingredient shows as the generic 🥄.
