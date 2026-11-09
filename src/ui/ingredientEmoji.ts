// Ingredient name -> emoji, used by step scenes. First match wins; put specific words first.
const MAP: [RegExp, string][] = [
  [/starch|cornflour/i, "🌾"],
  [/sweet potato|yam/i, "🍠"], [/potato/i, "🥔"], [/carrot/i, "🥕"], [/peanut/i, "🥜"],
  [/egg/i, "🥚"], [/banana|plantain/i, "🍌"], [/milk|cream(?! cheese)|yogurt|yoghurt/i, "🥛"],
  [/cheese|paneer|feta|mozzarella|parmesan|cheddar/i, "🧀"], [/butter|ghee/i, "🧈"],
  [/rice|dal|lentil|quinoa/i, "🍚"], [/noodle|pasta|spaghetti|macaroni/i, "🍝"],
  [/tomato/i, "🍅"], [/spinach|kale|bok choy|cabbage|lettuce|basil|parsley|herb|cilantro|coriander leaves|scallion|spring onion/i, "🥬"],
  [/onion|shallot/i, "🧅"], [/garlic/i, "🧄"], [/ginger/i, "🫚"], [/chicken|turkey/i, "🍗"],
  [/beef|lamb|pork|mince|meat/i, "🥩"], [/salmon|fish|cod|tuna/i, "🐟"], [/shrimp|prawn/i, "🦐"],
  [/avocado/i, "🥑"], [/broccoli|cauliflower/i, "🥦"], [/corn/i, "🌽"], [/bell pepper|red pepper|capsicum/i, "🫑"],
  [/mushroom/i, "🍄"], [/lemon|lime/i, "🍋"], [/apple/i, "🍎"], [/blueberr/i, "🫐"], [/strawberr|berr/i, "🍓"],
  [/pea\b|peas|bean|chickpea|edamame/i, "🫛"], [/zucchini|courgette|cucumber/i, "🥒"],
  [/aubergine|eggplant/i, "🍆"], [/coconut/i, "🥥"], [/oat|flour|atta|besan|semolina|breadcrumb/i, "🌾"],
  [/bread|tortilla|pita|wrap/i, "🫓"], [/oil/i, "🫒"], [/honey|maple|syrup|sugar/i, "🍯"],
  [/water|stock|broth/i, "💧"], [/tofu/i, "🧊"], [/nori|seaweed/i, "🟩"], [/sesame|seed/i, "🌰"],
  [/cinnamon|cumin|turmeric|paprika|spice|oregano|thyme|pepper|salt|garam|nutmeg|vanilla/i, "✨"],
];

export function ingredientEmoji(name: string): string {
  return MAP.find(([re]) => re.test(name))?.[1] ?? "🥄";
}

// Oil, water and spices are in most steps; showing them in every scene is noise.
const BACKGROUND = new Set(["🫒", "💧", "✨"]);

/** Up to `max` distinct emojis for the step's main ingredients. Scenes have their own defaults. */
export function stepEmojis(names: string[], max = 4): string[] {
  return [...new Set(names.map(ingredientEmoji))].filter((e) => !BACKGROUND.has(e)).slice(0, max);
}
