import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { activeSkills, type SkillToggles } from "../../engine/recommend";
import type { Answers, Question } from "../../engine/types";
import { questionsFor, skills } from "../../skills";
import { mealForHour } from "../../skills/builtin/20-meal.skill";
import { go } from "../../state/router";
import { Chip } from "../components/Chip";
import { Page } from "../components/Page";
import { TopBar } from "../components/TopBar";

const FLOATERS: [string, number, number][] = [
  ["🥕", 0, 0], ["🍌", 22, 6], ["🧀", 44, 0], ["🫐", 66, 6], ["🥚", 88, 0],
];

/** The values a question currently has, falling back to its default. */
function selectedOf(q: Question, answers: Answers): string[] {
  const v = answers[q.id] ?? q.defaultValue;
  return Array.isArray(v) ? v : v ? [v] : [];
}

/**
 * One screen: pick the meal, check the preferences, see recipes. The meal question is the
 * hero; every other skill question renders below it, so a new skill's question shows up here.
 */
export function Home({ answers, setAnswers, toggles }: {
  answers: Answers; setAnswers: (fn: (a: Answers) => Answers) => void; toggles: SkillToggles;
}) {
  const questions = useMemo(() => questionsFor(activeSkills(skills, toggles)), [toggles]);
  const mealQ = questions.find((q) => q.id === "meal");
  const rest = questions.filter((q) => q !== mealQ);
  // The meal changes every visit, so start from the clock, not from last time's answer.
  const [meal, setMeal] = useState<string>(() => mealForHour(new Date().getHours()));
  const returning = rest.some((q) => answers[q.id] !== undefined);
  const [editing, setEditing] = useState(!returning);
  const mealLabel = mealQ?.choices.find((c) => c.value === meal)?.label.toLowerCase();

  const pick = (q: Question, v: string) =>
    setAnswers((a) => {
      if (q.kind === "single") return { ...a, [q.id]: v };
      const cur = new Set(selectedOf(q, a));
      if (cur.has(v)) cur.delete(v);
      else cur.add(v);
      return { ...a, [q.id]: [...cur] };
    });

  const show = () => {
    setAnswers((a) => ({ ...a, ...(mealQ ? { meal } : {}) }));
    go({ name: "picks" });
  };

  return (
    <Page>
      <TopBar>
        <button className="icon-btn" aria-label="Settings" onClick={() => go({ name: "settings" })}>⚙️</button>
      </TopBar>

      <section className="home-head">
        {FLOATERS.map(([e, x, y], n) => (
          <motion.span
            key={e}
            className="hero-food"
            style={{ left: `${x}%`, top: y }}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0, y: [0, -8, 0] }}
            transition={{
              scale: { type: "spring", delay: 0.1 + n * 0.07 },
              rotate: { type: "spring", delay: 0.1 + n * 0.07 },
              y: { duration: 3 + (n % 3), repeat: Infinity, ease: "easeInOut", delay: n * 0.3 },
            }}
            aria-hidden
          >
            {e}
          </motion.span>
        ))}
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          What's cooking for your <em>little one</em>?
        </motion.h1>
      </section>

      {mealQ && (
        <motion.div
          className="meal-grid"
          role="radiogroup"
          aria-label={mealQ.title}
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } } }}
        >
          {mealQ.choices.map((c) => (
            <motion.button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={meal === c.value}
              className={`meal-tile${meal === c.value ? " on" : ""}`}
              variants={{ hidden: { opacity: 0, y: 16, scale: 0.94 }, show: { opacity: 1, y: 0, scale: 1 } }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setMeal(c.value)}
            >
              <motion.span
                className="meal-emoji"
                animate={meal === c.value ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] } : { scale: 1 }}
                transition={{ duration: 0.45 }}
              >
                {c.emoji}
              </motion.span>
              {c.label}
            </motion.button>
          ))}
        </motion.div>
      )}

      {rest.length > 0 && (
        <section className="prefs">
          <div className="prefs-head">
            <h2>About your little one</h2>
            {returning && (
              <button className="btn ghost" onClick={() => setEditing((e) => !e)}>{editing ? "Done" : "Edit"}</button>
            )}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {editing ? (
              <motion.div
                key="edit"
                className="stack"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden" }}
              >
                {rest.map((q) => {
                  const selected = selectedOf(q, answers);
                  return (
                    <div key={q.id} className="pref">
                      <h3>{q.title}</h3>
                      {q.subtitle && <p className="muted">{q.subtitle}</p>}
                      <div className="chips">
                        {q.choices.map((c) => (
                          <Chip key={c.value} small on={selected.includes(c.value)} emoji={c.emoji} onClick={() => pick(q, c.value)}>
                            {c.label}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.button
                key="summary"
                type="button"
                className="prefs-summary"
                onClick={() => setEditing(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {rest.flatMap((q) =>
                  q.choices
                    .filter((c) => selectedOf(q, answers).includes(c.value))
                    .map((c) => <span key={`${q.id}/${c.value}`} className="reason">{c.emoji} {c.label}</span>),
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </section>
      )}

      <div className="bottom-bar">
        <div>
          <motion.button className="btn block" whileTap={{ scale: 0.97 }} onClick={show}>
            {mealLabel ? `Show ${mealLabel} ideas` : "Show me recipes"} →
          </motion.button>
        </div>
      </div>
    </Page>
  );
}
