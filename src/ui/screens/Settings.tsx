import { motion } from "motion/react";
import { isSkillOn, type SkillToggles } from "../../engine/recommend";
import { skills } from "../../skills";
import { Page } from "../components/Page";
import { TopBar } from "../components/TopBar";

export function Settings({ toggles, setToggles, reset }: {
  toggles: SkillToggles; setToggles: (fn: (t: SkillToggles) => SkillToggles) => void; reset: () => void;
}) {
  return (
    <Page>
      <TopBar back={{ name: "home" }} />
      <h2>Recommendation skills</h2>
      <p className="muted" style={{ margin: "6px 0 18px" }}>
        Each skill nudges which recipes we suggest. Switch them on or off. Developers can add their own: see docs/SKILLS.md.
      </p>
      <div className="stack">
        {skills.map((s) => {
          const on = isSkillOn(s, toggles);
          return (
            <button key={s.id} className="panel row" style={{ textAlign: "left" }} onClick={() => setToggles((t) => ({ ...t, [s.id]: !on }))} role="switch" aria-checked={on}>
              <div style={{ flex: 1 }}>
                <strong>{s.name}</strong>
                <p className="muted" style={{ fontSize: 15 }}>{s.description}</p>
              </div>
              <span className={`switch${on ? " on" : ""}`}>
                <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 32 }} style={{ left: on ? 25 : 3 }} />
              </span>
            </button>
          );
        })}
      </div>
      <button className="btn secondary" style={{ marginTop: 24 }} onClick={reset}>Clear my answers</button>
    </Page>
  );
}
