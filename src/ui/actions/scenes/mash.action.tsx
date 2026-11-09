import { defineAction } from "../registry";
import { Emoji, Stage, loop } from "./_parts";

export default defineAction({
  id: "mash",
  label: "Mash",
  verbs: ["mash", "squash", "crush", "smash", "flake", "break", "crumble"],
  Scene: ({ emojis }) => (
    <Stage>
      <Emoji e={emojis[0] ?? "🍌"} y={66} size={80} style={{ transformOrigin: "50% 100%" }}
        animate={{ scaleY: [1, 0.55, 1], scaleX: [1, 1.3, 1] }} transition={loop(0.8)} />
      <Emoji e="🍴" x={54} y={30} size={60} animate={{ y: [-10, 22, -10] }} transition={loop(0.8)} />
    </Stage>
  ),
});
