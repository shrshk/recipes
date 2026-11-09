import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { bakeRecipe } from "../../engine/bake";
import { prepareRecipe, emptyEdits, formatAmount } from "../../engine/prepare";
import { adaptRecipe, type SkillToggles } from "../../engine/recommend";
import type { RecipeEdits, SkillContext } from "../../engine/types";
import type { Recipe } from "../../kb/schema";
import { skills } from "../../skills";
import { go } from "../../state/router";
import { ingredientEmoji } from "../ingredientEmoji";
import { cuisineLabel, dishEmoji, dishGradient, totalMinutes } from "../look";
import { Page } from "../components/Page";
import { TopBar } from "../components/TopBar";

export interface CustomActions {
  isCustom: boolean;
  /** False when the app runs without the server: saving is hidden. */
  canSave: boolean;
  save: (r: Recipe) => Promise<string[] | undefined>;
  remove: (id: string) => Promise<void>;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export function RecipeScreen({ recipe, edits, setEdits, ctx, toggles, custom }: {
  recipe: Recipe; edits: RecipeEdits; setEdits: (e: RecipeEdits) => void; ctx: SkillContext; toggles: SkillToggles;
  custom: CustomActions;
}) {
  const [extra, setExtra] = useState("");
  const [saving, setSaving] = useState<{ name: string; problems?: string[] } | undefined>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const prepared = adaptRecipe(prepareRecipe(recipe, edits), skills, ctx, toggles);
  const scale = edits.portions / recipe.yield;
  const changed = JSON.stringify(edits) !== JSON.stringify(emptyEdits(recipe));

  const toggleRemove = (id: string) => {
    const removed = edits.removed.includes(id) ? edits.removed.filter((x) => x !== id) : [...edits.removed, id];
    const { [id]: _, ...swaps } = edits.swaps;
    setEdits({ ...edits, removed, swaps });
  };
  const cycleSwap = (id: string, count: number) => {
    const cur = edits.swaps[id];
    const swaps = { ...edits.swaps };
    if (cur === undefined) swaps[id] = 0;
    else if (cur + 1 < count) swaps[id] = cur + 1;
    else delete swaps[id];
    setEdits({ ...edits, swaps, removed: edits.removed.filter((x) => x !== id) });
  };
  const toggleAddIn = (n: number) =>
    setEdits({ ...edits, addIns: edits.addIns.includes(n) ? edits.addIns.filter((x) => x !== n) : [...edits.addIns, n] });
  const addExtra = () => {
    const name = extra.trim();
    if (name) setEdits({ ...edits, extras: [...edits.extras, name] });
    setExtra("");
  };

  return (
    <Page>
      <TopBar back={{ name: "picks" }}>
        {changed && <button className="btn ghost" onClick={() => setEdits(emptyEdits(recipe))}>Reset</button>}
      </TopBar>

      <motion.div className="recipe-art" style={{ background: dishGradient(recipe) }} initial={{ scale: 0.94 }} animate={{ scale: 1 }}>
        <motion.span initial={{ y: 30, rotate: -12 }} animate={{ y: 0, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}>
          {dishEmoji(recipe)}
        </motion.span>
      </motion.div>

      <div className="stack" style={{ marginTop: 20 }}>
        <h1 style={{ fontSize: "clamp(30px, 7vw, 44px)" }}>{recipe.title}</h1>
        <p className="muted">{recipe.summary}</p>
        <div className="meta">
          <span>⏱ {totalMinutes(recipe)} min</span>
          <span>{cuisineLabel(recipe.cuisine)}</span>
          <span>{recipe.prepMinutes} min prep</span>
          {recipe.allergens.map((a) => <span key={a} className="badge">{a}</span>)}
        </div>

        <div className="panel row" style={{ justifyContent: "space-between" }}>
          <div>
            <strong>Portions</strong>
            <p className="muted" style={{ fontSize: 14 }}>Toddler-sized</p>
          </div>
          <div className="stepper">
            <button aria-label="Fewer" onClick={() => setEdits({ ...edits, portions: Math.max(1, edits.portions - 1) })}>−</button>
            <motion.span key={edits.portions} initial={{ scale: 1.3 }} animate={{ scale: 1 }}>{edits.portions}</motion.span>
            <button aria-label="More" onClick={() => setEdits({ ...edits, portions: Math.min(24, edits.portions + 1) })}>+</button>
          </div>
        </div>

        <section className="panel">
          <div className="section-title">
            <h3>Make it yours</h3>
            <span className="muted" style={{ fontSize: 14 }}>Swap or remove anything</span>
          </div>
          {recipe.ingredients.map((ing) => {
            const removed = edits.removed.includes(ing.id);
            const swapIdx = edits.swaps[ing.id];
            const swap = swapIdx !== undefined ? ing.substitutes[swapIdx] : undefined;
            const name = swap?.name ?? ing.name;
            const amount = swap?.qty !== undefined && swap ? formatAmount(swap.qty, swap.unit ?? ing.unit, scale) : formatAmount(ing.qty, ing.unit, scale);
            return (
              <motion.div key={ing.id} layout className={`ing${removed ? " removed" : ""}`}>
                <span className="ing-emoji">{ingredientEmoji(name)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div key={name} className="ing-name" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      {name}{ing.optional && !swap && <span className="muted" style={{ fontWeight: 600 }}> · optional</span>}
                    </motion.div>
                  </AnimatePresence>
                  <div className="ing-amount">{amount}{(swap?.note ?? ing.note) ? ` · ${swap?.note ?? ing.note}` : ""}</div>
                </div>
                <div className="ing-actions">
                  {ing.substitutes.length > 0 && !removed && (
                    <motion.button whileTap={{ scale: 0.9 }} className={`mini-btn${swap ? " on" : ""}`} onClick={() => cycleSwap(ing.id, ing.substitutes.length)}>
                      ⇄ {swap ? "Swapped" : "Swap"}
                    </motion.button>
                  )}
                  <motion.button whileTap={{ scale: 0.9 }} className="mini-btn" aria-label={removed ? `Add ${ing.name} back` : `Remove ${ing.name}`} onClick={() => toggleRemove(ing.id)}>
                    {removed ? "＋" : "－"}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}

          <AnimatePresence>
            {edits.extras.map((e, n) => (
              <motion.div key={e + n} className="ing" layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <span className="ing-emoji">{ingredientEmoji(e)}</span>
                <div style={{ flex: 1 }}><div className="ing-name">{e}</div><div className="ing-amount">your extra</div></div>
                <button className="mini-btn" aria-label={`Remove ${e}`} onClick={() => setEdits({ ...edits, extras: edits.extras.filter((_, i) => i !== n) })}>－</button>
              </motion.div>
            ))}
          </AnimatePresence>

          {recipe.addIns.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p className="muted" style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>ADD A LITTLE EXTRA</p>
              <div className="chips">
                {recipe.addIns.map((a, n) => (
                  <button key={a.name} className={`chip small${edits.addIns.includes(n) ? " on" : ""}`} onClick={() => toggleAddIn(n)}>
                    {ingredientEmoji(a.name)} {a.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="row" style={{ marginTop: 14 }} onSubmit={(e) => { e.preventDefault(); addExtra(); }}>
            <input className="text-input" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Add your own: frozen peas, corn…" aria-label="Add an ingredient" />
            <button className="mini-btn" type="submit" style={{ minHeight: 46 }}>Add</button>
          </form>
        </section>

        {prepared.notes.length > 0 && (
          <div className="stack" style={{ gap: 8 }}>
            {prepared.notes.map((n) => <div key={n} className="tip"><span>📝</span><span>{n}</span></div>)}
          </div>
        )}

        <section className="panel stack" style={{ gap: 10 }}>
          <h3>Little-one tips</h3>
          {prepared.toddlerTips.map((t) => <div key={t} className="tip"><span>👶</span><span>{t}</span></div>)}
        </section>

        <section className="panel">
          <div className="section-title"><h3>{prepared.steps.length} steps</h3></div>
          <ol style={{ margin: 0, paddingLeft: 22, display: "grid", gap: 8 }}>
            {prepared.steps.map((s, n) => <li key={n}>{s.text}</li>)}
          </ol>
        </section>

        {custom.canSave && (
          <section className="panel save-panel">
            {!saving ? (
              <div className="row" style={{ flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <strong>{custom.isCustom ? "Your recipe" : "Keep this version?"}</strong>
                  <p className="muted" style={{ fontSize: 14 }}>
                    {custom.isCustom ? "Saved on your kitchen server." : "Save your swaps and portions as your own recipe."}
                  </p>
                </div>
                <button className="mini-btn" onClick={() => setSaving({ name: custom.isCustom ? recipe.title : `${recipe.title} (my version)` })}>
                  {custom.isCustom ? "Save changes" : "⭐ Save as my recipe"}
                </button>
                {custom.isCustom && (
                  <button
                    className={`mini-btn${confirmDelete ? " on" : ""}`}
                    onClick={async () => {
                      if (!confirmDelete) return setConfirmDelete(true);
                      await custom.remove(recipe.id);
                      go({ name: "picks" }, true);
                    }}
                  >
                    {confirmDelete ? "Tap again to delete" : "Delete"}
                  </button>
                )}
              </div>
            ) : (
              <form
                className="save-panel"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const name = saving.name.trim() || recipe.title;
                  const id = custom.isCustom ? recipe.id : slug(name) || `my-${recipe.id}`;
                  const baked = bakeRecipe(recipe, edits, id, name);
                  const problems = await custom.save(baked);
                  if (problems) return setSaving({ name, problems });
                  setSaving(undefined);
                  if (id !== recipe.id) go({ name: "recipe", id });
                  else setEdits(emptyEdits(baked));
                }}
              >
                <strong>Name your recipe</strong>
                <div className="row">
                  <input className="text-input" value={saving.name} autoFocus aria-label="Recipe name"
                    onChange={(e) => setSaving({ name: e.target.value })} />
                  <button className="mini-btn on" type="submit" style={{ minHeight: 46 }}>Save</button>
                  <button className="mini-btn" type="button" style={{ minHeight: 46 }} onClick={() => setSaving(undefined)}>Cancel</button>
                </div>
                {saving.problems && <ul className="problems">{saving.problems.map((p) => <li key={p}>{p}</li>)}</ul>}
              </form>
            )}
          </section>
        )}

        <section className="sources muted" style={{ fontSize: 14 }}>
          Inspired by{" "}
          {recipe.sources.map((s, n) => (
            <span key={n}>
              {n > 0 && ", "}
              {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title} ({s.platform})
            </span>
          ))}
          . Steps written in our own words.
        </section>
      </div>

      <div className="bottom-bar">
        <div>
          <motion.button className="btn block" whileTap={{ scale: 0.97 }} onClick={() => go({ name: "cook", id: recipe.id })}>
            Start cooking 👩‍🍳
          </motion.button>
        </div>
      </div>
    </Page>
  );
}
