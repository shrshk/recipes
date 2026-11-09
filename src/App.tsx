import { AnimatePresence, MotionConfig } from "motion/react";
import { useMemo } from "react";
import { emptyEdits } from "./engine/prepare";
import type { Answers, RecipeEdits, SkillContext } from "./engine/types";
import type { SkillToggles } from "./engine/recommend";
import { knowledgeBase } from "./kb";
import { useRoute, go } from "./state/router";
import { useHistory, usePersisted } from "./state/store";
import { useCustomRecipes } from "./state/custom";
import { Home } from "./ui/screens/Home";
import { Ask } from "./ui/screens/Ask";
import { Picks } from "./ui/screens/Picks";
import { RecipeScreen } from "./ui/screens/RecipeScreen";
import { Cook } from "./ui/screens/Cook";
import { Done } from "./ui/screens/Done";
import { Settings } from "./ui/screens/Settings";

export function App() {
  const route = useRoute();
  const custom = useCustomRecipes();
  const recipes = useMemo(() => [...knowledgeBase().recipes, ...custom.recipes], [custom.recipes]);
  const customIds = useMemo(() => new Set(custom.recipes.map((r) => r.id)), [custom.recipes]);
  const [answers, setAnswers] = usePersisted<Answers>("answers", {});
  const [toggles, setToggles] = usePersisted<SkillToggles>("toggles", {});
  const [editsById, setEditsById] = usePersisted<Record<string, RecipeEdits>>("edits", {});
  const history = useHistory();

  const ctx: SkillContext = useMemo(
    () => ({ answers, history: history.ids, now: new Date() }),
    [answers, history.ids.join()],
  );
  const recipe = "id" in route ? recipes.find((r) => r.id === route.id) : undefined;
  const edits = recipe ? (editsById[recipe.id] ?? emptyEdits(recipe)) : undefined;
  const setEdits = (next: RecipeEdits) => recipe && setEditsById((all) => ({ ...all, [recipe.id]: next }));

  let screen;
  switch (route.name) {
    case "home":
      screen = <Home hasAnswers={Object.keys(answers).length > 0} />;
      break;
    case "ask":
      screen = <Ask step={route.step} answers={answers} setAnswers={setAnswers} toggles={toggles} />;
      break;
    case "picks":
      screen = <Picks recipes={recipes} customIds={customIds} ctx={ctx} toggles={toggles} setAnswers={setAnswers} />;
      break;
    case "settings":
      screen = <Settings toggles={toggles} setToggles={setToggles} reset={() => { setAnswers({}); go({ name: "home" }); }} />;
      break;
    default:
      if (!recipe || !edits) {
        screen = <Picks recipes={recipes} customIds={customIds} ctx={ctx} toggles={toggles} setAnswers={setAnswers} />;
      } else if (route.name === "recipe") {
        screen = (
          <RecipeScreen
            recipe={recipe} edits={edits} setEdits={setEdits} ctx={ctx} toggles={toggles}
            custom={{ isCustom: customIds.has(recipe.id), canSave: custom.available, save: custom.save, remove: custom.remove }}
          />
        );
      } else if (route.name === "cook") {
        screen = <Cook recipe={recipe} edits={edits} ctx={ctx} toggles={toggles} />;
      } else {
        screen = <Done recipe={recipe} record={history.record} />;
      }
  }

  const key = "id" in route ? `${route.name}/${route.id}` : route.name === "ask" ? `ask/${route.step}` : route.name;
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        <div key={key}>{screen}</div>
      </AnimatePresence>
    </MotionConfig>
  );
}
