import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { prepareRecipe } from "../../engine/prepare";
import { adaptRecipe, type SkillToggles } from "../../engine/recommend";
import type { RecipeEdits, SkillContext } from "../../engine/types";
import type { Recipe } from "../../kb/schema";
import { skills } from "../../skills";
import { go } from "../../state/router";
import { actionFor } from "../actions";
import { ingredientEmoji, stepEmojis } from "../ingredientEmoji";
import { Timer } from "../components/Timer";

/** Keep the screen on while cooking. Not every browser supports it; that is fine. */
function useWakeLock() {
  useEffect(() => {
    let lock: { release(): Promise<void> } | undefined;
    const request = () =>
      (navigator as Navigator & { wakeLock?: { request(t: "screen"): Promise<typeof lock> } }).wakeLock
        ?.request("screen")
        .then((l) => (lock = l))
        .catch(() => undefined);
    request();
    const onVisible = () => document.visibilityState === "visible" && request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => undefined);
    };
  }, []);
}

const slide = {
  enter: (dir: number) => ({ x: dir * 320, opacity: 0, rotate: dir * 3 }),
  center: { x: 0, opacity: 1, rotate: 0 },
  exit: (dir: number) => ({ x: dir * -320, opacity: 0, rotate: dir * -3 }),
};

export function Cook({ recipe, edits, ctx, toggles }: {
  recipe: Recipe; edits: RecipeEdits; ctx: SkillContext; toggles: SkillToggles;
}) {
  useWakeLock();
  const prepared = useMemo(() => adaptRecipe(prepareRecipe(recipe, edits), skills, ctx, toggles), [recipe, edits, ctx, toggles]);
  const steps = prepared.steps;
  const [[index, dir], setPage] = useState<[number, number]>([0, 1]);
  const [drawer, setDrawer] = useState(false);
  const step = steps[index];
  const action = actionFor(step);
  const last = index === steps.length - 1;

  const move = useCallback(
    (d: number) => {
      const next = index + d;
      if (next < 0) return;
      if (next >= steps.length) return go({ name: "done", id: recipe.id }, true);
      setPage([next, d]);
    },
    [index, steps.length, recipe.id],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") move(1);
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "Escape") go({ name: "recipe", id: recipe.id });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, recipe.id]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80 || info.velocity.x < -500) move(1);
    else if (info.offset.x > 80 || info.velocity.x > 500) move(-1);
  };

  return (
    <div className="cook">
      <div className="cook-top">
        <button className="icon-btn" aria-label="Leave cooking" onClick={() => go({ name: "recipe", id: recipe.id })}>✕</button>
        <div className="cook-bar" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={steps.length}>
          <motion.div animate={{ scaleX: (index + 1) / steps.length }} initial={false} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
        <button className="icon-btn" aria-label="Ingredients" onClick={() => setDrawer(true)}>🧺</button>
      </div>

      <div className="cook-stage">
        <AnimatePresence initial={false} custom={dir}>
          <motion.section
            key={index}
            className="cook-step"
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={onDragEnd}
            aria-live="polite"
          >
            <div className="cook-step-num">Step {index + 1} of {steps.length}</div>
            <action.Scene emojis={stepEmojis(step.uses)} minutes={step.minutes} />
            <div className="scene-label">{action.label}</div>
            <p className="cook-text">{step.text}</p>
            {step.uses.length > 0 && (
              <div className="cook-uses">
                {step.uses.map((u, n) => (
                  <motion.span key={u} className="chip small" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + n * 0.06 }}>
                    {ingredientEmoji(u)} {u}
                  </motion.span>
                ))}
              </div>
            )}
            {step.minutes && <Timer key={index} minutes={step.minutes} />}
            {step.tip && (
              <motion.div className="tip" style={{ maxWidth: 520, textAlign: "left" }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
                <span>👶</span><span>{step.tip}</span>
              </motion.div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      <div className="cook-bottom">
        <button className="btn secondary" onClick={() => move(-1)} disabled={index === 0} style={{ opacity: index === 0 ? 0.4 : 1 }}>← Back</button>
        <motion.button className="btn" whileTap={{ scale: 0.96 }} onClick={() => move(1)}>
          {last ? "All done! 🎉" : "Next step →"}
        </motion.button>
      </div>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.div
              className="drawer"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.8 }}
              onDragEnd={(_, i) => i.offset.y > 100 && setDrawer(false)}
              role="dialog" aria-label="Ingredients"
            >
              <div className="drawer-handle" />
              <h3 style={{ marginBottom: 8 }}>What you need</h3>
              {prepared.ingredients.map((i) => (
                <div key={i.id} className="ing">
                  <span className="ing-emoji">{ingredientEmoji(i.name)}</span>
                  <div style={{ flex: 1 }}><div className="ing-name">{i.name}</div><div className="ing-amount">{i.amount}{i.note ? ` · ${i.note}` : ""}</div></div>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
