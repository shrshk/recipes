import { motion } from "motion/react";
import { defineAction } from "../registry";
import { Emoji, Stage, loop } from "./_parts";

export default defineAction({
  id: "bake",
  label: "Bake",
  verbs: ["bake", "roast", "grill", "broil"],
  keywords: ["oven", "bake", "roast"],
  Scene: ({ emojis }) => (
    <Stage>
      <div className="scene-oven">
        <motion.div className="scene-oven-window" animate={{ opacity: [0.65, 1, 0.65] }} transition={loop(1.6)}>
          <Emoji e={emojis[0] ?? "🧁"} y={55} size={44} animate={{ scale: [1, 1.12, 1] }} transition={loop(1.6)} />
        </motion.div>
        <span className="scene-oven-knob" />
        <span className="scene-oven-knob" style={{ left: 54 }} />
      </div>
      {[0, 1, 2].map((n) => (
        <motion.span key={n} className="scene-heat" style={{ left: `${36 + n * 14}%` }}
          animate={{ y: [0, -18], opacity: [0, 0.7, 0] }} transition={loop(1.4, n * 0.4)} />
      ))}
    </Stage>
  ),
});
