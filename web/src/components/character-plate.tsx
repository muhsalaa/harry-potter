import { Link } from "react-router";

import type { Character } from "../api/characters";
import { Portrait } from "./portrait";

type CharacterPlateProps = {
  character: Pick<Character, "slug" | "name" | "image" | "house" | "viewer">;
  /** Pass true for the first row: lazy-loading the LCP image makes the page slower. */
  priority?: boolean;
};

/**
 * A sprite tile: framed portrait, hard offset shadow, name in the pixel display
 * face, and one meta line — the house as a chip, plus any state you own.
 * The shadow is the only depth in the design and it is never blurred: a blurred
 * shadow would break the illusion the art depends on. Hover answers with one
 * signal, the name turning bronze.
 *
 * The caption is measured, not fitted: the name may run to two lines and the
 * meta line is always drawn, so every tile in a row ends on the same baseline.
 * A page of 16 then reads as one shelf rather than sixteen loose pieces of paper.
 */
export function CharacterPlate({ character, priority = false }: CharacterPlateProps) {
  const kept = Boolean(character.viewer?.favorited);

  return (
    <Link
      to={`/characters/${character.slug}`}
      title={character.name}
      className="group block no-underline"
    >
      <figure className="m-0">
        <div className="edge border-rule-strong bg-paper-2 p-1 shadow-[var(--hp-shadow-sprite)]">
          <Portrait image={character.image} name={character.name} priority={priority} />
        </div>

        <figcaption className="mt-2">
          <span className="font-display line-clamp-2 block min-h-[2.5em] break-words text-md leading-tight text-ink group-hover:text-accent">
            {character.name}
          </span>

          <span className="label mt-1 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-muted">
            {kept ? (
              <span className="flex items-center gap-x-2 text-magic">
                <span aria-hidden="true" className="inline-block size-2 bg-magic" />
                in your list
              </span>
            ) : null}
            {character.house ? (
              <span className="bg-paper-3 px-1.5 py-px">{character.house}</span>
            ) : null}
            {character.viewer?.hasNote ? <span className="text-magic">note</span> : null}
          </span>
        </figcaption>
      </figure>
    </Link>
  );
}
