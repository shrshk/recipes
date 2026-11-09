import type { ComponentType } from "react";

/** What every scene receives. Scenes must work with any ingredients, including none. */
export interface SceneProps {
  /** One emoji per ingredient this step uses (max 4), e.g. ["🥕", "🥚"]. */
  emojis: string[];
  /** The step's wait, if any, so a scene can pace itself. */
  minutes?: number;
}

/**
 * A step animation. Add one by creating `scenes/<id>.action.tsx` that default-exports
 * `defineAction({...})`. No other code changes: the registry finds it at build time.
 */
export interface StepAction {
  id: string;
  /** Short label shown under the scene ("Boil"). */
  label: string;
  /** First-verb matches: the earliest verb in the step text picks the action. */
  verbs: string[];
  /** Strong words that win wherever they appear ("oven" -> bake). */
  keywords?: string[];
  Scene: ComponentType<SceneProps>;
}

export function defineAction(action: StepAction): StepAction {
  return action;
}

export const FALLBACK_ACTION = "prep";

/** Pick the action for a step: declared id, then a keyword anywhere, then the first known verb. */
export function resolveAction<T extends Pick<StepAction, "id" | "verbs" | "keywords">>(
  actions: T[],
  step: { text: string; action?: string },
): T {
  const byId = new Map(actions.map((a) => [a.id, a]));
  if (step.action && byId.has(step.action)) return byId.get(step.action)!;
  const text = step.text.toLowerCase();
  const words = text.replace(/\{[^}]*\}/g, " ").match(/[a-z]+/g) ?? [];
  for (const a of actions) if (a.keywords?.some((k) => new RegExp(`\\b${k}\\b`).test(text))) return a;
  for (const w of words) {
    const hit = actions.find((a) => a.verbs.includes(w));
    if (hit) return hit;
  }
  return byId.get(FALLBACK_ACTION) ?? actions[0];
}
