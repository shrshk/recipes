import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Recipe } from "../src/kb/schema";
import { validateRecipe, type Validation } from "../src/kb/validate";
import { ACTION_IDS } from "../src/ui/actions/ids";

/**
 * Custom recipes, one JSON file each, in the same format as kb/recipes. Files make backups
 * trivial and let a good custom recipe graduate into the knowledge base by moving the file.
 */
export class CustomStore {
  constructor(
    readonly dir: string,
    private readonly reservedIds: ReadonlySet<string>,
  ) {
    mkdirSync(dir, { recursive: true });
  }

  list(): Recipe[] {
    const out: Recipe[] = [];
    for (const f of readdirSync(this.dir).filter((f) => f.endsWith(".json")).sort()) {
      const result = validateRecipe(this.read(f), ACTION_IDS);
      if (result.ok) out.push(result.recipe);
      else console.warn(`custom recipe skipped: ${f}: ${result.problems.join("; ")}`);
    }
    return out;
  }

  get(id: string): Recipe | undefined {
    return this.list().find((r) => r.id === id);
  }

  /** Validate and save. A custom recipe may replace another custom one, never a built-in. */
  save(data: unknown): Validation {
    const withDefaults = withCustomDefaults(data);
    const result = validateRecipe(withDefaults, ACTION_IDS);
    if (!result.ok) return result;
    if (this.reservedIds.has(result.recipe.id)) {
      return { ok: false, problems: [`id: "${result.recipe.id}" is a built-in recipe; choose a new id`] };
    }
    const file = join(this.dir, `${result.recipe.id}.json`);
    writeFileSync(`${file}.tmp`, JSON.stringify(result.recipe, null, 2) + "\n");
    renameSync(`${file}.tmp`, file);
    return result;
  }

  delete(id: string): boolean {
    if (!/^[a-z0-9-]+$/.test(id)) return false;
    try {
      rmSync(join(this.dir, `${id}.json`));
      return true;
    } catch {
      return false;
    }
  }

  private read(file: string): unknown {
    try {
      return JSON.parse(readFileSync(join(this.dir, file), "utf8"));
    } catch {
      return undefined;
    }
  }
}

/** Fill what an LLM or the browser may leave out of a custom recipe. */
function withCustomDefaults(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const r = data as Record<string, unknown>;
  return {
    ...r,
    sources: Array.isArray(r.sources) && r.sources.length ? r.sources : [{ platform: "custom", url: "", title: "Custom recipe" }],
  };
}

export function defaultDataDir(): string {
  return process.env.RECIPES_DATA_DIR ?? join(homedir(), ".local", "share", "recipes", "custom");
}
