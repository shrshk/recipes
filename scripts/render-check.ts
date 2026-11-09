// Print every recipe with its optional ingredients removed, to eyeball step wording.
// Run: pnpm render-check
import { knowledgeBase } from "../src/kb";
import { emptyEdits, prepareRecipe } from "../src/engine/prepare";

for (const r of knowledgeBase().recipes) {
  const removed = r.ingredients.filter((i) => i.optional).map((i) => i.id);
  if (!removed.length) continue;
  const p = prepareRecipe(r, { ...emptyEdits(r), removed });
  console.log(`\n## ${r.id} (removed: ${removed.join(", ")})`);
  p.steps.forEach((s, n) => console.log(`${n + 1}. ${s.text}`));
}
