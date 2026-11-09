import { defineAction } from "../registry";
import { Drop, Emoji, Stage } from "./_parts";

export default defineAction({
  id: "add",
  label: "Add",
  verbs: ["add", "fold", "put", "place", "top", "sprinkle", "scatter", "divide", "fill", "spread", "return", "toss", "pour", "spoon", "layer", "arrange"],
  Scene: ({ emojis }) => (
    <Stage>
      <Drop emojis={emojis} y={52} />
      <Emoji e="🥣" y={68} size={110} animate={{ y: [0, 4, 0] }} transition={{ duration: 0.7, repeat: Infinity }} />
    </Stage>
  ),
});
