import { defineAction } from "../registry";
import { Bubbles, Drop, Emoji, Stage, Steam } from "./_parts";

export default defineAction({
  id: "boil",
  label: "Simmer",
  verbs: ["boil", "simmer", "poach", "blanch"],
  keywords: ["simmer", "boil"],
  Scene: ({ emojis }) => (
    <Stage>
      <Steam x={50} y={22} />
      <Drop emojis={emojis} y={50} size={32} />
      <Bubbles x={50} y={50} />
      <Emoji e="🍲" y={66} size={120} animate={{ rotate: [-1.5, 1.5, -1.5] }} transition={{ duration: 0.5, repeat: Infinity }} />
    </Stage>
  ),
});
