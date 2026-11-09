import { motion } from "motion/react";
import { defineAction } from "../registry";
import { Emoji, Stage } from "./_parts";

export default defineAction({
  id: "blend",
  label: "Blend",
  verbs: ["blend", "puree", "purée", "process", "pulse"],
  keywords: ["blend", "blender", "puree"],
  Scene: ({ emojis }) => (
    <Stage>
      <motion.div className="scene-jar" animate={{ x: [-3, 3, -3], rotate: [-1, 1, -1] }} transition={{ duration: 0.15, repeat: Infinity }}>
        <motion.div className="scene-swirl" animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}>
          {(emojis.length ? emojis : ["🍌"]).map((e, n, all) => (
            <span key={n} className="scene-orbit-item" style={{ fontSize: 26, transform: `rotate(${(360 / all.length) * n}deg) translateX(20px)` }}>{e}</span>
          ))}
        </motion.div>
      </motion.div>
      <Emoji e="⚡" x={78} y={30} size={30} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
    </Stage>
  ),
});
