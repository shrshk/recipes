# Recipe schema

Every recipe is one JSON file in `kb/recipes/<id>.json`. The app validates each file at build
time (`src/kb/schema.ts`), so a bad file fails `pnpm test`, not the app.

```jsonc
{
  "id": "palak-paneer-bites",            // kebab-case, same as the file name
  "title": "Palak Paneer Bites",
  "summary": "Soft spinach and paneer patties that toddlers can hold.",  // one line, <= 110 chars
  "cuisine": "indian",                    // see Cuisines below
  "meals": ["lunch", "dinner"],           // breakfast | lunch | dinner | snack
  "minAgeMonths": 12,                     // youngest age it suits
  "prepMinutes": 10,
  "cookMinutes": 15,
  "yield": 4,                             // toddler-sized portions
  "difficulty": "easy",                   // easy | medium
  "tags": ["finger-food", "hidden-veg"],  // see Tags below
  "allergens": ["dairy"],                 // see Allergens below; list every one present
  "ingredients": [
    {
      "id": "spinach",                    // kebab-case, unique inside the recipe
      "name": "baby spinach",
      "qty": 2,                           // number or null ("to taste")
      "unit": "cups",                     // "" for countable items
      "note": "washed",                   // optional
      "optional": false,                  // true = recipe still works without it
      "substitutes": [                    // optional; what to use instead
        { "name": "kale", "qty": 1.5, "unit": "cups", "note": "stems removed" },
        { "name": "chard" }               // no qty/unit = same amount as the original
      ]
    }
  ],
  "steps": [
    {
      "text": "Wilt {spinach} in a pan with a splash of water, then chop finely.",
      "action": "fry",                    // optional; animation to play. Inferred from the verb if left out
      "minutes": 3,                       // optional; shows a timer button
      "requires": ["spinach"],            // optional; drop the step when ALL of these are removed
      "tip": "Squeeze out the water so the bites hold together."   // optional
    },
    { "text": "Mix {list:paneer,spinach,flour} into a soft dough." }
  ],
  "addIns": [                             // optional extras a parent can add
    { "name": "grated carrot", "qty": 0.25, "unit": "cup", "afterStep": 1 }
  ],
  "toddlerTips": [                        // safety and serving notes for 1-3 year olds
    "Serve warm, not hot. Shape into flat fingers, not balls."
  ],
  "sources": [                            // where the idea came from; we paraphrase, we do not copy
    { "platform": "reddit", "url": "https://www.reddit.com/r/toddlerfood/...", "title": "...", "author": "u/..." }
  ],
  "popularity": 0.7,                      // 0..1, our estimate from upvotes/views/saves
  "photo": {                              // optional; a freely licensed photo in public/dishes/
    "file": "palak-paneer-bites.webp",    // 800x600 webp
    "author": "Jane Doe", "license": "CC BY-SA 4.0",
    "url": "https://commons.wikimedia.org/wiki/File:..."   // source page, shown as the credit link
  }
}
```

## Step text tokens

- `{spinach}` shows the ingredient's name, or the chosen substitute's name. If the ingredient is
  removed with no substitute, the token disappears. So write steps that still read well without
  optional ingredients, or put those in their own step with `requires`.
- `{list:a,b,c}` shows the remaining items as a natural list: "a, b and c".
- A plain run like `{a}, {b} and {c}` is treated as a list automatically.
- A step with no `requires` is dropped when every ingredient it names was removed.

## Step animations

Each step plays a short animation in cook mode. The app picks it from the step text:
"Simmer…" plays `boil`, "…bake until golden" plays `bake`. Set `action` only to override the
guess. Ids: add, bake, blend, boil, chop, fry, grate, mash, mix, prep, rinse, serve, shape, steam.
See [STEP_ANIMATIONS.md](STEP_ANIMATIONS.md) to add a new one.

## Enumerations

- **Cuisines:** american, british, chinese, french, greek, indian, italian, japanese, korean,
  mediterranean, mexican, middle-eastern, spanish, thai, vietnamese, caribbean, african, global
- **Tags:** finger-food, hidden-veg, freezer-friendly, one-pot, no-cook, batch-cook, picky-eater,
  iron-rich, protein-packed, sheet-pan, family-meal, quick, lunchbox, sweet, savory
- **Allergens:** dairy, egg, gluten, wheat, peanut, tree-nut, soy, fish, shellfish, sesame
- **Platforms:** reddit, youtube, tiktok, instagram, blog, family

## Rules for toddler recipes

- No added salt or very little; no whole nuts, whole grapes, popcorn, or hard raw veg.
- Spice is fine (toddlers like flavour); chili heat is optional and labelled.
- Write the steps in your own words. Credit the source in `sources`.
