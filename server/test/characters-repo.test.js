import assert from "node:assert/strict";
import { test } from "node:test";

import Database from "better-sqlite3";

import { MIGRATIONS_DIR } from "../src/db.js";
import { migrate } from "../src/migrate.js";
import { readPage, readViewerState, saveCharacter, savePage } from "../src/repo/characters.js";

function database() {
  const db = new Database(":memory:");
  migrate(db, MIGRATIONS_DIR);
  return db;
}

const character = (over = {}) => ({
  potterdbId: "11111111-1111-1111-1111-111111111111",
  slug: "harry-potter",
  name: "Harry Potter",
  image: null,
  house: "Gryffindor",
  aliasNames: ["The Boy Who Lived"],
  familyMembers: [],
  jobs: [],
  romances: [],
  titles: [],
  wands: [],
  ...over,
});

test("caching a page twice leaves one row per character and keeps its position", () => {
  const db = database();

  savePage(db, [character(), character({ potterdbId: "22222222-2222-2222-2222-222222222222", slug: "ron-weasley", name: "Ron Weasley" })], 3);
  savePage(db, [character()], 3);

  const rows = readPage(db, 3);
  assert.equal(rows.length, 2, "the second write updated, it did not duplicate");
  assert.equal(rows[0].list_index, 0);
  assert.equal(rows[1].list_index, 1);
  assert.equal(rows[0].house, "Gryffindor");
});

test("reading one character by slug does not wipe the page it was cached under", () => {
  const db = database();
  savePage(db, [character()], 3);

  const row = saveCharacter(db, character({ image: "https://example.test/harry.jpg" }));

  assert.equal(row.list_page, 3, "list_page survived a slug fetch");
  assert.equal(readPage(db, 3).length, 1);
  assert.equal(readPage(db, 3)[0].image, "https://example.test/harry.jpg");
});

test("viewer state reports favorites and notes per character, and nothing for a stranger", () => {
  const db = database();
  savePage(db, [character()], 1);
  const { id } = db.prepare("SELECT id FROM characters").get();
  db.prepare("INSERT INTO users (email, password_hash) VALUES ('a@example.test', 'x')").run();
  db.prepare("INSERT INTO users (email, password_hash) VALUES ('b@example.test', 'x')").run();
  db.prepare("INSERT INTO favorites (user_id, character_id) VALUES (1, ?)").run(id);
  db.prepare("INSERT INTO notes (user_id, character_id, body) VALUES (1, ?, 'mine')").run(id);

  assert.deepEqual(readViewerState(db, 1, [id]).get(id), { favorited: true, hasNote: true });
  assert.deepEqual(readViewerState(db, 2, [id]).get(id), { favorited: false, hasNote: false });
  assert.equal(readViewerState(db, null, [id]).size, 0);
});
