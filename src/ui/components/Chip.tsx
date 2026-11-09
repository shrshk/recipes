import { motion } from "motion/react";
import type { ReactNode } from "react";

export function Chip({ on, onClick, emoji, children, small }: {
  on?: boolean; onClick?: () => void; emoji?: string; children: ReactNode; small?: boolean;
}) {
  return (
    <motion.button
      type="button"
      layout
      className={`chip${on ? " on" : ""}${small ? " small" : ""}`}
      aria-pressed={on}
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      animate={on ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
    >
      {emoji && <span className="emoji">{emoji}</span>}
      {children}
      {on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} aria-hidden>✓</motion.span>}
    </motion.button>
  );
}
