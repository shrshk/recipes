import { useCallback, useEffect, useState } from "react";
import { RecipeSchema, type Recipe } from "../kb/schema";

/**
 * Custom recipes from the server's /api. When the app is served without the server (plain
 * static hosting), `available` stays false and the app works with the built-in recipes only.
 */
export function useCustomRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [available, setAvailable] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/custom-recipes");
      if (!res.ok || !res.headers.get("content-type")?.includes("json")) return;
      const data: unknown[] = await res.json();
      setRecipes(data.flatMap((d) => {
        const r = RecipeSchema.safeParse(d);
        return r.success ? [r.data] : [];
      }));
      setAvailable(true);
    } catch {
      setAvailable(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(async (recipe: Recipe): Promise<string[] | undefined> => {
    const res = await fetch(`/api/custom-recipes/${recipe.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipe),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { problems?: string[]; error?: string };
      return body.problems ?? [body.error ?? `save failed (${res.status})`];
    }
    await refresh();
    return undefined;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await fetch(`/api/custom-recipes/${id}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  return { recipes, available, save, remove };
}
