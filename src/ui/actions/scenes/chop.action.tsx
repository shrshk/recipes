import { defineAction } from "../registry";
import { Emoji, Stage, loop } from "./_parts";

export default defineAction({
  id: "chop",
  label: "Chop",
  verbs: ["chop", "cut", "slice", "dice", "quarter", "halve", "mince", "shred", "peel", "trim", "tear"],
  Scene: ({ emojis }) => {
    const food = emojis[0] ?? "🥕";
    return (
      <Stage>
        <span className="scene-board" />
        <Emoji e={food} x={42} y={60} size={84} />
        {[0, 1, 2].map((n) => (
          <Emoji key={n} e={food} x={64 + n * 7} y={66} size={26}
            animate={{ y: [0, -18, 0], opacity: [0, 1, 1], rotate: [0, 40 * (n + 1)] }} transition={loop(0.9, n * 0.3)} />
        ))}
        <Emoji e="🔪" x={60} y={36} size={72} style={{ transformOrigin: "80% 80%" }}
          animate={{ rotate: [-30, 8, -30], y: [-10, 16, -10] }} transition={loop(0.45)} />
      </Stage>
    );
  },
});
