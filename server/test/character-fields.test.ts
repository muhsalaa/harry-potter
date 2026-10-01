import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CHARACTER_COLUMNS,
  CHARACTER_FIELDS,
  PAGE_SIZE,
  fromPotterDb,
  toColumns,
  toPayload,
} from "../src/domain/character.ts";
import type { CharacterRow } from "../src/domain/character.ts";
import { character } from "./harness.ts";

const rowOf = (over: Partial<CharacterRow> = {}): CharacterRow =>
  ({ ...toColumns(character()), id: 7, list_page: 1, list_index: 0, cached_at: "2024-01-01 00:00:00", ...over }) as CharacterRow;

/** Every field the API body carries, in catalogue order. */
const payloadFields = () => CHARACTER_FIELDS.filter((field) => !("internal" in field && field.internal));

test("PotterDB's snake_case arrives in our names, and missing attributes read as empty", () => {
  const harry = fromPotterDb({
    id: "11111111-1111-1111-1111-111111111111",
    attributes: {
      slug: "harry-potter",
      name: "Harry Potter",
      blood_status: "half-blood",
      alias_names: ["The Boy Who Lived"],
    },
  });

  assert.equal(harry.potterdbId, "11111111-1111-1111-1111-111111111111");
  assert.equal(harry.bloodStatus, "half-blood");
  assert.deepEqual(harry.aliasNames, ["The Boy Who Lived"]);
  assert.equal(harry.eyeColor, null, "an absent attribute is not undefined");
  assert.deepEqual(harry.wands, [], "an absent list is empty");
});

test("the catalogue names every column exactly once, and every field is translated", () => {
  assert.equal(CHARACTER_COLUMNS.length, CHARACTER_FIELDS.length);
  assert.equal(new Set(CHARACTER_COLUMNS).size, CHARACTER_COLUMNS.length);

  const columns = toColumns(character());
  for (const column of CHARACTER_COLUMNS) {
    assert.ok(column in columns, `${column} is missing from the INSERT values`);
  }
});

test("a row becomes the API payload: our names, parsed lists, no potterdb_id", () => {
  const payload = toPayload(rowOf(), { favorited: true, hasNote: false });

  assert.equal(payload.id, 7);
  assert.equal(payload.slug, "harry-potter");
  assert.equal(payload.house, "Gryffindor");
  assert.equal(payload.bloodStatus, null);
  assert.deepEqual(payload.aliasNames, ["The Boy Who Lived"]);
  assert.equal(payload.cachedAt, "2024-01-01 00:00:00");
  assert.deepEqual(payload.viewer, { favorited: true, hasNote: false });

  assert.ok(!("potterdbId" in payload), "the provider's id is ours to keep");
  assert.deepEqual(
    Object.keys(payload).sort(),
    [...payloadFields().map((field) => field.key), "cachedAt", "id", "viewer"].sort(),
  );
});

test("an anonymous reader is not told about viewer state", () => {
  assert.ok(!("viewer" in toPayload(rowOf())));
  assert.equal(PAGE_SIZE, 24);
});

test("a corrupt list column reads as empty rather than throwing", () => {
  assert.deepEqual(toPayload(rowOf({ alias_names: "not json" })).aliasNames, []);
  assert.deepEqual(toPayload(rowOf({ alias_names: null })).aliasNames, []);
  assert.deepEqual(toPayload(rowOf({ alias_names: '{"a":1}' })).aliasNames, []);
});
