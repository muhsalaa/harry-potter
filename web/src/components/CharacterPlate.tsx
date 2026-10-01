import { Link } from "react-router";

import type { Character } from "../api/characters";
import { Portrait } from "./Portrait";

type CharacterPlateProps = {
  character: Pick<Character, "slug" | "name" | "image" | "house" | "viewer">;
  /** Pass true for the first row: lazy-loading the LCP image makes the page slower. */
  priority?: boolean;
};

/**
 * A sprite tile: framed portrait, hard offset shadow, name in the pixel display
 * face, and one meta line — only when the meta line has something to say.
 * The shadow is the only depth in the design and it is never blurred: a blurred
 * shadow would break the illusion the art depends on. Hover answers with one
 * signal, the name turning bronze.
 */
export function CharacterPlate({ character, priority = false }: CharacterPlateProps) {
  const kept = Boolean(character.viewer?.favorited);

  return (
    <Link
      to={`/characters/${character.slug}`}
      className="group block no-underline"
    >
      <figure className="m-0">
        <div className="edge border-rule-strong bg-paper-2 p-1 shadow-[var(--hp-shadow-sprite)]">
          <Portrait image={character.image} name={character.name} priority={priority} />
        </div>

        <figcaption className="mt-2">
          <span className="font-display block text-md leading-tight text-ink group-hover:text-accent">
            {character.name}
          </span>

          {/* Only facts that exist. Three quarters of this corpus lists no house,
              and a caption repeating "no house listed" under most tiles is noise
              — the record page already omits empty fields for the same reason. */}
          {character.house || kept || character.viewer?.hasNote ? (
            <span className="label mt-1 flex flex-wrap items-center gap-x-3 text-muted">
              {kept ? (
                <span className="flex items-center gap-x-2 text-magic">
                  <span aria-hidden="true" className="inline-block size-2 bg-magic" />
                  in your list
                </span>
              ) : null}
              {character.house ? <span>{character.house}</span> : null}
              {character.viewer?.hasNote ? <span className="text-magic">note</span> : null}
            </span>
          ) : null}
        </figcaption>
      </figure>
    </Link>
  );
}
