import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Recipe } from "../../kb/schema";
import { go } from "../../state/router";
import type { HistoryEntry } from "../../state/store";
import { dishEmoji } from "../look";
import { Page } from "../components/Page";

const BURST = ["🎉", "✨", "🥄", "💛", "⭐", "🎊", "😋", "✨", "🌟", "💚", "🎉", "⭐"];

export function Done({ recipe, record }: { recipe: Recipe; record: (e: HistoryEntry) => void }) {
  const at = useRef(new Date().toISOString());
  const [rating, setRating] = useState<HistoryEntry["rating"]>();
  // Record once on arrival; a rating updates the same entry.
  useEffect(() => record({ id: recipe.id, at: at.current, rating }), [rating]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page className="page done">
      {BURST.map((e, n) => {
        const angle = (n / BURST.length) * Math.PI * 2;
        return (
          <motion.span key={n} className="burst" aria-hidden
            initial={{ x: "-50%", y: "-50%", scale: 0, opacity: 1 }}
            animate={{ x: `calc(-50% + ${Math.cos(angle) * 160}px)`, y: `calc(-50% + ${Math.sin(angle) * 160}px)`, scale: [0, 1.3, 1], opacity: [1, 1, 0], rotate: 180 }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.15 }}
          >
            {e}
          </motion.span>
        );
      })}
      <motion.div style={{ fontSize: 120 }} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 220, damping: 10 }}>
        {dishEmoji(recipe)}
      </motion.div>
      <h1>Bon appétit!</h1>
      <p className="lede">{recipe.title} is ready. Let it cool a little before your little one digs in.</p>
      <div className="stack" style={{ justifyItems: "center" }}>
        <p style={{ fontWeight: 800 }}>How did it go?</p>
        <div className="chips" style={{ justifyContent: "center" }}>
          {([["loved", "😋", "Loved it"], ["ok", "🙂", "It was ok"], ["nope", "🙅", "Not a hit"]] as const).map(([v, e, l]) => (
            <motion.button key={v} className={`chip${rating === v ? " on" : ""}`} whileTap={{ scale: 0.9 }} onClick={() => setRating(v)}>
              <span className="emoji">{e}</span>{l}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn" onClick={() => go({ name: "picks" })}>More ideas</button>
        <button className="btn secondary" onClick={() => go({ name: "home" })}>Home</button>
      </div>
    </Page>
  );
}
