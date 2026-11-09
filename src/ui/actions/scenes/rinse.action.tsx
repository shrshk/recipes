import { defineAction } from "../registry";
import { Emoji, Stage, loop } from "./_parts";

export default defineAction({
  id: "rinse",
  label: "Rinse",
  verbs: ["rinse", "wash", "soak", "drain", "strain", "squeeze", "reserve", "remove"],
  Scene: ({ emojis }) => (
    <Stage>
      {[0, 1, 2, 3, 4].map((n) => (
        <Emoji key={n} e="💧" x={36 + n * 7} y={20} size={20} animate={{ y: [0, 90], opacity: [1, 0] }} transition={loop(0.9, n * 0.17)} />
      ))}
      <Emoji e={emojis[0] ?? "🍚"} y={66} size={64} animate={{ rotate: [-6, 6, -6] }} transition={loop(0.9)} />
    </Stage>
  ),
});
