import { createCharacters } from "./characters.ts";
import { createHealth } from "./health.ts";
import { createPersonal } from "./personal.ts";
import type { Dependencies } from "./ports.ts";

/** Every use case, built from the adapters that back them. */
export function createServices(dependencies: Dependencies) {
  return {
    health: createHealth(dependencies),
    characters: createCharacters(dependencies),
    personal: createPersonal(dependencies),
  };
}

export type Services = ReturnType<typeof createServices>;
