import { apiGet } from "./client";

export type Health = {
  ok: boolean;
  database: {
    migrations: number;
    applied: string[];
  };
  time: string;
};

export const fetchHealth = () => apiGet<Health>("/api/health");
