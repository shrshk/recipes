import { defineAction } from "../registry";
import { Bubbles, Emoji, Stage, loop } from "./_parts";

export default defineAction({
  id: "fry",
  label: "Cook",
  verbs: ["fry", "saute", "sauté", "brown", "toast", "scramble", "sear", "soften", "heat", "cook", "warm", "wilt", "flip", "stir-fry", "melt", "pan"],
  Scene: ({ emojis }) => (
    <Stage>
      <Bubbles count={8} x={50} y={46} spread={36} color="var(--sizzle)" />
      <Emoji e="🍳" y={62} size={120} animate={{ rotate: [-4, 4, -4], x: [-6, 6, -6] }} transition={loop(0.8)} />
      {emojis.slice(0, 3).map((e, n) => (
        <Emoji key={n} e={e} x={42 + n * 9} y={56} size={30}
          animate={{ y: [0, -28, 0], rotate: [0, 180, 360] }} transition={loop(1.1, n * 0.35)} />
      ))}
    </Stage>
  ),
});
