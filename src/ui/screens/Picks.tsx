import { motion } from "motion/react";
import { useMemo } from "react";
import { recommend, type SkillToggles } from "../../engine/recommend";
import type { Answers, Recommendation, SkillContext } from "../../engine/types";
import type { Recipe } from "../../kb/schema";
import { skills } from "../../skills";
import { go } from "../../state/router";
import { cuisineLabel, cuisineNames, totalMinutes } from "../look";
import { DishArt } from "../components/DishArt";
import { Page } from "../components/Page";
import { TopBar } from "../components/TopBar";

export function Picks({ recipes, customIds, ctx, toggles, setAnswers }: {
  recipes: Recipe[]; customIds: ReadonlySet<string>; ctx: SkillContext; toggles: SkillToggles; setAnswers: (fn: (a: Answers) => Answers) => void;
}) {
  const picks = useMemo(() => recommend(recipes, skills, ctx, { toggles, limit: 18 }), [recipes, ctx, toggles]);
  const onTarget = picks.filter((p) => !p.offTarget);
  const offTarget = picks.filter((p) => p.offTarget);
  const liked = cuisineNames(ctx.answers.cuisines);
  const greeting = { breakfast: "breakfast", lunch: "lunch", snack: "snack time", dinner: "dinner" }[
    String(ctx.answers.meal ?? "")
  ];

  return (
    <Page>
      <TopBar back={{ name: "home" }}>
        <button className="btn ghost" onClick={() => go({ name: "home" })}>Change</button>
      </TopBar>
      <h2>{greeting ? `Ideas for ${greeting}` : "Picked for your little one"}</h2>
      <p className="muted" style={{ margin: "6px 0 20px" }}>
        {!picks.length
          ? "Nothing fits all your answers yet."
          : offTarget.length && onTarget.length
            ? `${onTarget.length} ${liked} ${onTarget.length === 1 ? "recipe" : "recipes"}, then a few others.`
            : `${picks.length} recipes, best match first.`}
      </p>

      {picks.length === 0 && (
        <div className="panel stack" style={{ textAlign: "center", justifyItems: "center" }}>
          <div style={{ fontSize: 64 }}>🤷</div>
          <p>Try loosening the time limit or meal. Your allergy choices stay as they are.</p>
          <button className="btn" onClick={() => setAnswers((a) => ({ ...a, time: "any", meal: undefined, cuisines: [] }))}>
            Loosen my filters
          </button>
        </div>
      )}

      {onTarget.length > 0 && <Cards picks={onTarget} customIds={customIds} />}
      {offTarget.length > 0 && (
        <>
          <h3 className="section-title">
            {onTarget.length ? "Something different" : `No ${liked} ${greeting ?? "recipes"} yet. Try these instead`}
          </h3>
          <Cards picks={offTarget} customIds={customIds} />
        </>
      )}
    </Page>
  );
}

function Cards({ picks, customIds }: { picks: Recommendation[]; customIds: ReadonlySet<string> }) {
  return (
    <motion.div className="cards" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
      {picks.map(({ recipe, reasons }) => (
        <motion.button
          key={recipe.id}
          className="card"
          variants={{ hidden: { opacity: 0, y: 24, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1 } }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => go({ name: "recipe", id: recipe.id })}
        >
          <DishArt recipe={recipe} className="card-art" emojiMotion={{ whileHover: { rotate: [0, -8, 8, 0] } }}>
            {customIds.has(recipe.id) && <span className="badge custom-badge">⭐ Your recipe</span>}
          </DishArt>
          <div className="card-body">
            <h3>{recipe.title}</h3>
            <p className="muted" style={{ fontSize: 15 }}>{recipe.summary}</p>
            <div className="meta">
              <span>⏱ {totalMinutes(recipe)} min</span>
              <span>{cuisineLabel(recipe.cuisine)}</span>
              <span>{recipe.difficulty === "easy" ? "Easy" : "Medium"}</span>
            </div>
            {reasons.length > 0 && (
              <div className="reasons">{reasons.map((r) => <span key={r} className="reason">{r}</span>)}</div>
            )}
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}
