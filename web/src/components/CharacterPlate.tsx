import { Link } from "react-router";

import type { Character } from "../api/characters";
import { Portrait } from "./Portrait";

type CharacterPlateProps = {
  character: Pick<Character, "slug" | "name" | "image" | "house" | "viewer">;
  /** Pass true for the first row: lazy-loading the LCP image makes the page slower. */
  priority?: boolean;
};

/** Catalogue's "specimen thumbnail per card", with the name and house beneath. */
export function CharacterPlate({ character, priority = false }: CharacterPlateProps) {
  return (
    <Link
      to={`/characters/${character.slug}`}
      className="group block no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
    >
      <figure className="m-0">
        <Portrait image={character.image} name={character.name} priority={priority} />

        <figcaption className="mt-2">
          <span className="font-display block text-md leading-tight group-hover:underline group-hover:underline-offset-2">
            {character.name}
          </span>

          <span className="numeric mt-1 flex flex-wrap items-center gap-x-2 text-xs tracking-[0.1em] text-muted uppercase">
            {character.viewer?.favorited ? (
              <>
                <span aria-hidden="true" className="inline-block size-2 bg-accent" />
                <span className="sr-only">In your favorites.</span>
              </>
            ) : null}
            <span>{character.house ?? "no house listed"}</span>
            {character.viewer?.hasNote ? <span>· note</span> : null}
          </span>
        </figcaption>
      </figure>
    </Link>
  );
}
