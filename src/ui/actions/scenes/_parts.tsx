import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

// Shared building blocks for step scenes. Files starting with "_" are not scenes.

export function Stage({ children }: { children: ReactNode }) {
  return <div className="scene" aria-hidden="true">{children}</div>;
}

/** An emoji placed by its centre, at x/y percent of the stage. */
export function Emoji({ e, x = 50, y = 50, size = 96, style, ...motionProps }: {
  e: string; x?: number; y?: number; size?: number; style?: CSSProperties;
} & React.ComponentProps<typeof motion.span>) {
  return (
    <motion.span
      className="scene-emoji"
      style={{ left: `${x}%`, top: `${y}%`, fontSize: size, ...style }}
      {...motionProps}
    >
      {e}
    </motion.span>
  );
}

const loop = (duration: number, delay = 0) =>
  ({ duration, delay, repeat: Infinity, ease: "easeInOut" }) as const;
export { loop };

/** Ingredients drop from above into a target point, one after another, forever. */
export function Drop({ emojis, x = 50, y = 58, size = 40 }: { emojis: string[]; x?: number; y?: number; size?: number }) {
  const list = emojis.length ? emojis : ["🥄"];
  const cycle = 0.7 * list.length + 0.8;
  return (
    <>
      {list.map((e, n) => (
        <Emoji
          key={n}
          e={e}
          x={x + (n - (list.length - 1) / 2) * 12}
          y={y}
          size={size}
          initial={{ y: -150, opacity: 0, rotate: -20 }}
          animate={{ y: [-150, 0, 0], opacity: [0, 1, 0], rotate: [-20, 10, 0], scale: [1, 1, 0.6] }}
          transition={{ duration: cycle, delay: n * 0.7, repeat: Infinity, repeatDelay: 0.4, times: [0, 0.45, 1] }}
        />
      ))}
    </>
  );
}

/** Little rising circles: bubbles in a pot, sizzle in a pan. */
export function Bubbles({ count = 6, x = 50, y = 52, spread = 30, color = "var(--bubble)" }: {
  count?: number; x?: number; y?: number; spread?: number; color?: string;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, n) => (
        <motion.span
          key={n}
          className="scene-dot"
          style={{ left: `${x + ((n / (count - 1 || 1)) - 0.5) * spread}%`, top: `${y}%`, background: color }}
          animate={{ y: [0, -40 - (n % 3) * 12], opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
          transition={loop(1.2 + (n % 3) * 0.3, n * 0.18)}
        />
      ))}
    </>
  );
}

/** Wavy steam wisps rising off something hot. */
export function Steam({ x = 50, y = 30 }: { x?: number; y?: number }) {
  return (
    <>
      {[-14, 0, 14].map((dx, n) => (
        <motion.span
          key={n}
          className="scene-steam"
          style={{ left: `${x + dx}%`, top: `${y}%` }}
          animate={{ y: [10, -36], opacity: [0, 0.8, 0], scaleY: [0.6, 1.2], x: [0, n % 2 ? 6 : -6, 0] }}
          transition={loop(2.2, n * 0.5)}
        />
      ))}
    </>
  );
}
