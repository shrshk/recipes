import { defineAction } from "../registry";
import { Emoji, Stage, loop } from "./_parts";

export default defineAction({
  id: "grate",
  label: "Grate",
  verbs: ["grate", "zest"],
  Scene: ({ emojis }) => {
    const food = emojis[0] ?? "🥕";
    return (
      <Stage>
        <span className="scene-grater" />
        <Emoji e={food} x={50} y={38} size={64} animate={{ y: [-14, 14, -14] }} transition={loop(0.6)} />
        {[0, 1, 2, 3].map((n) => (
          <Emoji key={n} e="▪" x={42 + n * 5} y={78} size={12} style={{ color: "var(--accent)" }}
            animate={{ y: [-20, 10], opacity: [1, 0] }} transition={loop(0.8, n * 0.2)} />
        ))}
      </Stage>
    );
  },
});
