import type { Character } from "../api/characters";
import { CharacterPlate } from "./CharacterPlate";

/**
 * Ruled rows, no cell borders and no shadows: the hairline is the only
 * containment layer in this design, so a card must not also have a box.
 * Tracks use minmax(0, 1fr) — an image inside a bare 1fr expands the grid.
 */
export function CharacterGrid({ characters }: { characters: Character[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {characters.map((character, index) => (
        <li key={character.id} className="min-w-0 border-t border-rule pt-4 pb-8">
          <CharacterPlate character={character} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
