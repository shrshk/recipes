import { motion } from "motion/react";
import { defineAction } from "../registry";
import { Emoji, Stage, loop } from "./_parts";

export default defineAction({
  id: "mix",
  label: "Mix",
  verbs: ["mix", "stir", "whisk", "beat", "combine", "coat", "marinate", "season", "dip"],
  Scene: ({ emojis }) => (
    <Stage>
      <Emoji e="🥣" y={66} size={120} />
      <motion.div className="scene-orbit" animate={{ rotate: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}>
        {(emojis.length ? emojis : ["✨"]).map((e, n, all) => (
          <span key={n} className="scene-orbit-item" style={{ transform: `rotate(${(360 / all.length) * n}deg) translateX(34px)` }}>{e}</span>
        ))}
      </motion.div>
      <Emoji e="🥄" x={60} y={40} size={64} animate={{ rotate: [-25, 25, -25], x: [-14, 14, -14] }} transition={loop(1)} />
    </Stage>
  ),
});
