import { defineAction } from "../registry";
import { Emoji, Stage, loop } from "./_parts";

export default defineAction({
  id: "serve",
  label: "Serve",
  verbs: ["serve", "cool", "rest", "chill", "enjoy", "plate", "taste", "let", "loosen", "freeze"],
  Scene: ({ emojis }) => (
    <Stage>
      <Emoji e="🍽️" y={64} size={120} />
      <Emoji e={emojis[0] ?? "😋"} y={56} size={52} initial={{ scale: 0 }} animate={{ scale: [0, 1.1, 1] }} transition={{ duration: 0.6 }} />
      {[[24, 30], [76, 34], [50, 18]].map(([x, y], n) => (
        <Emoji key={n} e="✨" x={x} y={y} size={26} animate={{ scale: [0, 1, 0], rotate: [0, 90] }} transition={loop(1.6, n * 0.5)} />
      ))}
    </Stage>
  ),
});
