import { resolveAction, type StepAction } from "./registry";

const modules = import.meta.glob<{ default: StepAction }>("./scenes/*.action.tsx", { eager: true });

export const stepActions: StepAction[] = Object.keys(modules)
  .sort()
  .map((p) => modules[p].default);

export function actionFor(step: { text: string; action?: string }): StepAction {
  return resolveAction(stepActions, step);
}

export { defineAction, type SceneProps, type StepAction } from "./registry";
