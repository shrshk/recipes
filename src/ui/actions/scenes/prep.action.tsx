import { motion } from "motion/react";
import { defineAction } from "../registry";
import { Emoji, Stage, loop } from "./_parts";

/** The fallback scene, used when no other action matches a step. */
export default defineAction({
  id: "prep",
  label: "Get ready",
  verbs: ["prepare", "line", "grease", "set", "get", "preheat", "gather"],
  Scene: ({ emojis }) => (
    <Stage>
      <Emoji e="🧑‍🍳" y={56} size={96} animate={{ y: [0, -6, 0] }} transition={loop(1.2)} />
      <motion.div className="scene-orbit" style={{ top: "56%" }} animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
        {(emojis.length ? emojis : ["🥄", "🥣", "🧂"]).map((e, n, all) => (
          <span key={n} className="scene-orbit-item" style={{ transform: `rotate(${(360 / all.length) * n}deg) translateX(84px)` }}>{e}</span>
        ))}
      </motion.div>
    </Stage>
  ),
});
