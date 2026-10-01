import type { Character } from "../api/characters";
import { CharacterPlate } from "./CharacterPlate";

/**
 * The sprite bank. Tiles carry their own frames, so the grid adds no rules of
 * its own — cells are separated by air, not by lines.
 * Tracks use minmax(0, 1fr): an image inside a bare 1fr expands the grid.
 */
export function CharacterGrid({ characters }: { characters: Character[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {characters.map((character, index) => (
        <li key={character.id} className="min-w-0">
          <CharacterPlate character={character} priority={index < 5} />
        </li>
      ))}
    </ul>
  );
}
