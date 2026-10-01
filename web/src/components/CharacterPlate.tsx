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
 * face, and one meta line. The shadow is the only depth in the design and it is
 * never blurred — a blurred shadow would break the illusion the art depends on.
 */
export function CharacterPlate({ character, priority = false }: CharacterPlateProps) {
  const kept = Boolean(character.viewer?.favorited);

  return (
    <Link
      to={`/characters/${character.slug}`}
      className="group block no-underline"
    >
      <figure className="m-0 transition-transform duration-[var(--hp-dur-micro)] ease-[var(--hp-ease-out)] group-hover:-translate-0.5">
        <div className="border-[var(--hp-pixel)] border-rule-strong bg-paper-2 p-1 shadow-[var(--hp-shadow-sprite)]">
          <Portrait image={character.image} name={character.name} priority={priority} />
        </div>

        <figcaption className="mt-2">
          <span className="font-display block text-md leading-tight text-ink group-hover:text-accent">
            {character.name}
          </span>

          <span className="label mt-1 flex flex-wrap items-center gap-x-2 text-muted">
            {kept ? (
              <>
                <span aria-hidden="true" className="inline-block size-2 bg-magic" />
                <span className="text-magic">in your list</span>
                <span aria-hidden="true">·</span>
              </>
            ) : null}
            <span>{character.house ?? "no house listed"}</span>
            {character.viewer?.hasNote ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-magic">note</span>
              </>
            ) : null}
          </span>
        </figcaption>
      </figure>
    </Link>
  );
}
