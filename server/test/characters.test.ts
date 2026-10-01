import assert from "node:assert/strict";
import { test } from "node:test";

import { PAGE_SIZE } from "../src/domain/character.ts";
import { character, makeWorld, rejects, registerUser } from "./harness.ts";

test("the first view of a page fetches it, and every later view is served from the mirror", async () => {
  const { services, catalog } = await makeWorld([[character()]]);

  const first = await services.characters.list(1, null);
  assert.equal(first.meta.cached, false);
  assert.equal(first.meta.size, PAGE_SIZE);
  assert.equal(first.meta.records, 1);
  assert.equal(first.meta.pages, 1);
  assert.deepEqual(first.data.map((entry) => entry.slug), ["harry-potter"]);

  const second = await services.characters.list(1, null);
  assert.equal(second.meta.cached, true);
  assert.deepEqual(second.data, first.data);
  assert.equal(catalog.fetches, 1, "the corpus was asked once");
});

test("each page keeps its own rows, in the order PotterDB gave them", async () => {
  const { services } = await makeWorld([
    [character(), character({ potterdbId: "2", slug: "ron-weasley", name: "Ron Weasley" })],
    [character({ potterdbId: "3", slug: "hermione-grange", name: "Hermione Granger" })],
  ]);

  const first = await services.characters.list(1, null);
  const second = await services.characters.list(2, null);

  assert.deepEqual(first.data.map((entry) => entry.name), ["Harry Potter", "Ron Weasley"]);
  assert.deepEqual(second.data.map((entry) => entry.name), ["Hermione Granger"]);
  assert.equal(second.meta.page, 2);
  assert.equal(second.meta.records, 3);
  assert.equal(second.meta.pages, 2);
});

test("a page past the end of the corpus is refused, naming its size", async () => {
  const { services } = await makeWorld([[character()]]);
  await services.characters.list(1, null);

  await assert.rejects(
    () => services.characters.list(9, null),
    rejects("not-found", "The corpus has 1 pages."),
  );
});

test("a slug fetch caches a character without filing him onto a page", async () => {
  const { services, catalog } = await makeWorld([
    [character(), character({ potterdbId: "2", slug: "ron-weasley", name: "Ron Weasley" })],
    [character({ potterdbId: "3", slug: "draco-malfoy", name: "Draco Malfoy" })],
  ]);

  const page = await services.characters.list(1, null);
  assert.equal(catalog.fetches, 1);

  const draco = await services.characters.bySlug("draco-malfoy", null);
  assert.equal(draco.name, "Draco Malfoy");
  assert.equal(catalog.fetches, 2, "a slug the mirror has not seen is fetched once");

  await services.characters.bySlug("draco-malfoy", null);
  assert.equal(catalog.fetches, 2, "the second read was served from the mirror");

  const list = await services.characters.list(1, null);
  assert.equal(list.meta.cached, true);
  assert.deepEqual(list.data.map((entry) => entry.slug), page.data.map((entry) => entry.slug));
  assert.ok(!list.data.some((entry) => entry.slug === "draco-malfoy"), "he was not filed onto a page");
});

test("a page re-fetched files a character the mirror already held", async () => {
  const { services, catalog } = await makeWorld([
    [character()],
    [character({ potterdbId: "3", slug: "draco-malfoy", name: "Draco Malfoy" })],
  ]);

  await services.characters.bySlug("draco-malfoy", null);

  const page = await services.characters.list(2, null);
  assert.equal(catalog.fetches, 2);
  assert.deepEqual(page.data.map((entry) => entry.slug), ["draco-malfoy"]);
});

test("re-saving a cached character keeps the page it was cached under", async () => {
  const { services, stores } = await makeWorld([[character()]]);
  const page = await services.characters.list(1, null);

  await stores.characters.saveOne(character({ image: "https://example.test/harry.jpg" }));

  const list = await services.characters.list(1, null);
  assert.equal(list.meta.cached, true, "the row kept its place despite the save carrying no position");
  assert.equal(list.data.length, 1);
  assert.equal(list.data[0].id, page.data[0].id);
  assert.equal(list.data[0].image, "https://example.test/harry.jpg");
});

test("a slug nobody has is refused", async () => {
  const { services } = await makeWorld();
  await assert.rejects(
    () => services.characters.bySlug("draco-malfoy", null),
    rejects("not-found", "No such character."),
  );
});

test("a viewer sees their own flags; anyone else is not told they exist", async () => {
  const world = await makeWorld([[character()]]);
  const { services } = world;
  const page = await services.characters.list(1, null);
  const id = page.data[0].id;
  const user = await registerUser(world);

  await services.personal.toggleFavorite(user.id, id);
  await services.personal.saveNote(user.id, id, "chosen one");

  const mine = await services.characters.list(1, user.id);
  assert.deepEqual(mine.data[0].viewer, { favorited: true, hasNote: true });
  assert.deepEqual((await services.characters.bySlug("harry-potter", user.id)).viewer, {
    favorited: true,
    hasNote: true,
  });

  const stranger = await services.characters.list(1, null);
  assert.equal(stranger.data[0].viewer, undefined);
});
