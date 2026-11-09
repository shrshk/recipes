import { motion } from "motion/react";
import { defineAction } from "../registry";
import { Emoji, Stage, loop } from "./_parts";

export default defineAction({
  id: "shape",
  label: "Shape",
  verbs: ["shape", "form", "flatten", "press", "wrap", "twist", "pinch", "knead", "roll", "make"],
  Scene: ({ emojis }) => (
    <Stage>
      {emojis[0] ? (
        <Emoji e={emojis[0]} y={52} size={64} animate={{ scale: [0.8, 1.05, 0.8] }} transition={loop(1.2)} />
      ) : (
        <motion.span className="scene-dough" animate={{ scaleX: [1, 1.25, 1], scaleY: [1, 0.7, 1] }} transition={loop(1.2)} />
      )}
      <Emoji e="🫲" x={26} y={52} size={64} animate={{ x: [0, 12, 0] }} transition={loop(1.2)} />
      <Emoji e="🫱" x={74} y={52} size={64} animate={{ x: [0, -12, 0] }} transition={loop(1.2)} />
    </Stage>
  ),
});
