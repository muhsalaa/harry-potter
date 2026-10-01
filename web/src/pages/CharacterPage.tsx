import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { getCharacter, type Character } from "../api/characters";
import { PageHead } from "../components/PageHead";
import { Portrait } from "../components/Portrait";
import { FavoriteControl } from "../components/slots/FavoriteControl";
import { NotePanel } from "../components/slots/NotePanel";

type State =
  | { kind: "loading" }
  | { kind: "ready"; character: Character }
  | { kind: "failed" };

/** Only rows with something in them are rendered: an empty field is not a fact. */
function recordRows(character: Character): Array<[string, string]> {
  const rows: Array<[string, string | null]> = [
    ["House", character.house],
    ["Blood status", character.bloodStatus],
    ["Species", character.species],
    ["Gender", character.gender],
    ["Born", character.born],
    ["Died", character.died],
    ["Patronus", character.patronus],
    ["Boggart", character.boggart],
    ["Animagus", character.animagus],
    ["Eye colour", character.eyeColor],
    ["Hair colour", character.hairColor],
    ["Skin colour", character.skinColor],
    ["Height", character.height],
    ["Weight", character.weight],
    ["Nationality", character.nationality],
    ["Marital status", character.maritalStatus],
    ["Also known as", character.aliasNames.join(", ")],
    ["Family", character.familyMembers.join(", ")],
    ["Titles", character.titles.join(", ")],
    ["Jobs", character.jobs.join(", ")],
    ["Romances", character.romances.join(", ")],
    ["Wands", character.wands.join(" · ")],
  ];

  return rows
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([label, value]) => [label, value as string]);
}

/**
 * One record: the sprite plate on the left, the spec sheet on the right as a
 * ruled table, then the two things a reader can own — a Favorite and a Note.
 */
export function CharacterPage() {
  const { slug = "" } = useParams();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let live = true;
    setState({ kind: "loading" });

    getCharacter(slug)
      .then((character) => {
        if (live) setState({ kind: "ready", character });
      })
      .catch((problem: unknown) => {
        console.error("[character] the record did not load", problem);
        if (live) setState({ kind: "failed" });
      });

    return () => {
      live = false;
    };
  }, [slug]);

  if (state.kind === "loading") {
    return <p className="page-gutter label pt-10 text-muted">loading…</p>;
  }

  if (state.kind === "failed") {
    return (
      <>
        <PageHead line="not in the index" title="No entry for that name" />
        <div className="page-gutter pb-16">
          <p role="alert" className="prose max-w-[var(--hp-measure)] text-error">
            Nothing in the index matches that name. <Link to="/">Back to the index</Link>.
          </p>
        </div>
      </>
    );
  }

  const { character } = state;
  const line =
    [character.house, character.bloodStatus, character.species]
      .filter((value) => typeof value === "string" && value.trim().length > 0)
      .join(" · ") || undefined;

  return (
    <>
      <PageHead line={line} title={character.name} />

      <div className="page-gutter grid gap-8 pb-12 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div>
          <div className="edge border-rule-strong bg-paper-2 p-1 shadow-[var(--hp-shadow-sprite)]">
            <Portrait image={character.image} name={character.name} priority scale="record" />
          </div>
          <p className="label mt-2 text-muted">
            {character.image ? "portrait · PotterDB" : "no portrait in PotterDB"}
          </p>
        </div>

        <div className="min-w-0">
          <dl className="border-t-[3px] border-rule-strong">
            {recordRows(character).map(([label, value]) => (
              <div
                key={label}
                className="grid gap-x-6 gap-y-1 border-b-[var(--hp-pixel)] border-rule py-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]"
              >
                <dt className="label text-muted">{label}</dt>
                <dd className="m-0 min-w-0">{value}</dd>
              </div>
            ))}
          </dl>

          {character.wiki ? (
            <p className="mt-4">
              <a
                href={character.wiki}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                Read the wiki entry
              </a>
            </p>
          ) : null}
        </div>
      </div>

      <div className="page-gutter grid gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="frame p-5">
          <h2 className="font-display text-lg text-ink">Your list</h2>
          <p className="label mt-1 text-muted">One marker, nobody else sees it</p>
          <div className="mt-4">
            <FavoriteControl
              characterId={character.id}
              slug={character.slug}
              initiallyFavorited={character.viewer?.favorited ?? false}
            />
          </div>
        </section>

        <section className="frame p-5">
          <h2 className="font-display text-lg text-ink">Your note</h2>
          <p className="label mt-1 text-muted">One per character. Save again to change it.</p>
          <div className="mt-4">
            <NotePanel characterId={character.id} slug={character.slug} />
          </div>
        </section>
      </div>
    </>
  );
}
