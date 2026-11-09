import { motion } from "motion/react";
import { go } from "../../state/router";
import { Page } from "../components/Page";
import { TopBar } from "../components/TopBar";

const FLOATERS: [string, number, number][] = [
  ["🥕", 8, 14], ["🍌", 82, 10], ["🥚", 90, 52], ["🍅", 4, 62], ["🫐", 70, 82], ["🥦", 20, 88], ["🧀", 56, 4],
];

export function Home({ hasAnswers }: { hasAnswers: boolean }) {
  return (
    <Page>
      <TopBar>
        <button className="icon-btn" aria-label="Settings" onClick={() => go({ name: "settings" })}>⚙️</button>
      </TopBar>
      <section className="hero">
        {FLOATERS.map(([e, x, y], n) => (
          <motion.span
            key={e}
            className="hero-food"
            style={{ left: `${x}%`, top: `${y}%`, opacity: 0.85 }}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0, y: [0, -10, 0] }}
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
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          What's cooking for your <em>little one</em> today?
        </motion.h1>
        <motion.p className="lede" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          Answer a few quick questions. We pick toddler-friendly recipes and walk you through them, one step at a time.
        </motion.p>
        <motion.div className="stack" style={{ maxWidth: 360 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <motion.button className="btn" whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }} onClick={() => go({ name: "ask", step: 0 })}>
            Let's find a recipe →
          </motion.button>
          {hasAnswers && (
            <button className="btn secondary" onClick={() => go({ name: "picks" })}>Same as last time</button>
          )}
        </motion.div>
      </section>
    </Page>
  );
}
