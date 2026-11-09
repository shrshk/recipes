import { defineAction } from "../registry";
import { Emoji, Stage, Steam, loop } from "./_parts";

export default defineAction({
  id: "steam",
  label: "Steam",
  verbs: ["steam"],
  keywords: ["steam"],
  Scene: ({ emojis }) => (
    <Stage>
      <Steam x={50} y={26} />
      <Emoji e={emojis[0] ?? "🥦"} y={56} size={52} animate={{ y: [0, -4, 0] }} transition={loop(1.4)} />
      <Emoji e="♨️" y={74} size={72} />
    </Stage>
  ),
});
