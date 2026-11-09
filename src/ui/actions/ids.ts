// Scene ids without importing the scenes (and React): the id is the file name. The actions
// test checks that every scene's `id` matches its file name, so this stays true.
const files = import.meta.glob("./scenes/*.action.tsx");

export const ACTION_IDS: ReadonlySet<string> = new Set(
  Object.keys(files).map((p) => p.split("/").pop()!.replace(/\.action\.tsx$/, "")),
);
