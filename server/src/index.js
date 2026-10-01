import { deleteExpiredSessions } from "./auth.js";
import { createApp } from "./app.js";
import { DB_PATH, migrateDatabase, openDatabase } from "./db.js";

const db = openDatabase();
const applied = migrateDatabase(db);
const expired = deleteExpiredSessions(db);
const port = Number(process.env.PORT ?? 3000);

createApp({ db }).listen(port, () => {
  const suffix = applied.length ? ` — applied ${applied.join(", ")}` : "";
  const swept = expired ? ` — swept ${expired} expired session(s)` : "";
  console.log(`api listening on http://localhost:${port}\ndatabase: ${DB_PATH}${suffix}${swept}`);
});
