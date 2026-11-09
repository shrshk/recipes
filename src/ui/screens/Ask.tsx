import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import type { Answers } from "../../engine/types";
import { activeSkills, type SkillToggles } from "../../engine/recommend";
import { questionsFor, skills } from "../../skills";
import { go } from "../../state/router";
import { Chip } from "../components/Chip";
import { Page } from "../components/Page";
import { TopBar } from "../components/TopBar";

export function Ask({ step, answers, setAnswers, toggles }: {
  step: number; answers: Answers; setAnswers: (fn: (a: Answers) => Answers) => void; toggles: SkillToggles;
}) {
  // Questions come from the active skills, so a new skill can add its own.
  const questions = useMemo(() => questionsFor(activeSkills(skills, toggles)), [toggles]);
  const q = questions[Math.min(step, questions.length - 1)];
  const value = answers[q.id] ?? q.defaultValue;
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const last = step >= questions.length - 1;

  const next = () => (last ? go({ name: "picks" }) : go({ name: "ask", step: step + 1 }));
  const pick = (v: string) => {
    if (q.kind === "single") {
      setAnswers((a) => ({ ...a, [q.id]: v }));
      setTimeout(next, 260); // let the chip's pop finish before moving on
    } else {
      setAnswers((a) => {
        const cur = new Set(Array.isArray(a[q.id]) ? (a[q.id] as string[]) : []);
        if (cur.has(v)) cur.delete(v);
        else cur.add(v);
        return { ...a, [q.id]: [...cur] };
      });
    }
  };

  return (
    <Page>
      <TopBar back={step > 0 ? { name: "ask", step: step - 1 } : { name: "home" }}>
        <button className="btn ghost" onClick={() => go({ name: "picks" })}>Skip all</button>
      </TopBar>
      <div className="progress-dots" aria-label={`Question ${step + 1} of ${questions.length}`}>
        {questions.map((_, n) => (
          <motion.span key={n} className={n <= step ? "on" : ""} layout />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.section
          key={q.id}
          className="stack"
          style={{ marginTop: 34 }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <h2>{q.title}</h2>
          {q.subtitle && <p className="muted">{q.subtitle}</p>}
          <motion.div
            className="chips"
            style={{ marginTop: 10 }}
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.03 } } }}
          >
            {q.choices.map((c) => (
              <motion.div key={c.value} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                <Chip on={selected.includes(c.value)} emoji={c.emoji} onClick={() => pick(c.value)}>
                  {c.label}
                </Chip>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      </AnimatePresence>
      <div className="bottom-bar">
        <div>
          <button className="btn block" onClick={next}>
            {last ? "Show me recipes" : selected.length ? "Next" : "Skip"} →
          </button>
        </div>
      </div>
    </Page>
  );
}
