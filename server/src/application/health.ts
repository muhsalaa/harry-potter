import type { Dependencies } from "./ports.ts";

export type Health = {
  ok: true;
  database: { migrations: number; applied: string[] };
  time: string;
};

export function createHealth({ migrations }: Dependencies) {
  return {
    status(): Health {
      const applied = migrations.applied();

      return {
        ok: true,
        database: { migrations: applied.length, applied: applied.map((row) => row.name) },
        time: new Date().toISOString(),
      };
    },
  };
}
