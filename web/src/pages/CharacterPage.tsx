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
  | { kind: "failed"; message: string };

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
        if (live) {
          setState({
            kind: "failed",
            message: problem instanceof Error ? problem.message : "That character did not load.",
          });
        }
      });

    return () => {
      live = false;
    };
  }, [slug]);

  if (state.kind === "loading") {
    return (
      <p className="page-gutter numeric pt-10 text-sm tracking-[0.1em] text-muted uppercase">
        loading…
      </p>
    );
  }

  if (state.kind === "failed") {
    return (
      <>
        <PageHead line={`character · ${slug}`} title="That character is not here" />
        <div className="page-gutter pb-16">
          <p role="alert" className="max-w-[var(--hp-measure)] text-error">
            {state.message} <Link to="/">Go back to the index</Link>.
          </p>
        </div>
      </>
    );
  }

  const { character } = state;
  const line = [character.house ?? "no house listed", character.bloodStatus, character.species]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHead line={line} title={character.name} />

      <div className="page-gutter grid gap-8 pb-10 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <div className="max-w-[300px]">
          <Portrait
            image={character.image}
            name={character.name}
            priority
            scale="record"
          />
          <p className="numeric mt-2 text-xs tracking-[0.1em] text-muted uppercase">
            {character.image ? "portrait · PotterDB" : "no portrait in PotterDB"}
          </p>
        </div>

        <div className="min-w-0">
          <dl className="border-t border-rule">
            {recordRows(character).map(([label, value]) => (
              <div
                key={label}
                className="grid gap-x-6 gap-y-1 border-b border-rule py-2 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]"
              >
                <dt className="numeric text-xs tracking-[0.1em] text-muted uppercase">{label}</dt>
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
                className="text-accent-deep"
              >
                Read the wiki entry
              </a>
            </p>
          ) : null}
        </div>
      </div>

      <div className="page-gutter grid gap-10 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section>
          <h2 className="font-display text-md">Your list</h2>
          <div className="mt-3">
            <FavoriteControl
              characterId={character.id}
              slug={character.slug}
              initiallyFavorited={character.viewer?.favorited ?? false}
            />
          </div>
        </section>

        <section>
          <h2 className="font-display text-md">Your note</h2>
          <div className="mt-3">
            <NotePanel characterId={character.id} slug={character.slug} />
          </div>
        </section>
      </div>
    </>
  );
}
