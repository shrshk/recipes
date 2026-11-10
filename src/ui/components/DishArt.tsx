import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import type { Recipe } from "../../kb/schema";
import { dishEmoji, dishGradient } from "../look";

/** The dish photo when the recipe has one, else its emoji on the cuisine gradient. */
export function DishArt({ recipe, className, children, emojiMotion }: {
  recipe: Recipe; className: string; children?: ReactNode; emojiMotion?: object;
}) {
  const [broken, setBroken] = useState(false);
  const photo = recipe.photo && !broken ? recipe.photo : undefined;
  return (
    <div className={`${className}${photo ? " has-photo" : ""}`} style={{ background: dishGradient(recipe) }}>
      {photo ? (
        <img src={`${import.meta.env.BASE_URL}dishes/${photo.file}`} alt={recipe.title} loading="lazy" onError={() => setBroken(true)} />
      ) : (
        <motion.span {...emojiMotion}>{dishEmoji(recipe)}</motion.span>
      )}
      {children}
    </div>
  );
}

/** "Photo: Jane Doe, CC BY-SA 4.0", linked to the source page, as the licence requires. */
export function PhotoCredit({ recipe }: { recipe: Recipe }) {
  if (!recipe.photo) return null;
  const { author, license, url } = recipe.photo;
  return (
    <a className="photo-credit" href={url} target="_blank" rel="noreferrer">
      Photo of the classic dish: {author}, {license}
    </a>
  );
}
