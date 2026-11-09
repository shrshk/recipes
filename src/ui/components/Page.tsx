import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Page wrapper: every screen slides and fades in the same way. */
export function Page({ children, className = "page" }: { children: ReactNode; className?: string }) {
  return (
    <motion.main
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      {children}
    </motion.main>
  );
}
