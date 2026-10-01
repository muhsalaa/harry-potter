import { useEffect, useState } from "react";
import { Link } from "react-router";

import { NOTE_LIMIT, getNote, saveNote } from "../../api/notes";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../Button";

type NotePanelProps = {
  characterId: number;
  slug: string;
};

type State =
  | { kind: "loading" }
  | { kind: "ready"; body: string; savedAt: string | null }
  | { kind: "failed"; message: string };

/**
 * One Note per User and Character. Saving again overwrites the same row in
 * place: no second note, no history, no delete — the note has a current value.
 */
export function NotePanel({ characterId, slug }: NotePanelProps) {
  const { status } = useAuth();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    let live = true;
    setState({ kind: "loading" });

    getNote(characterId)
      .then((note) => {
        if (!live) return;
        setBody(note?.body ?? "");
        setState({ kind: "ready", body: note?.body ?? "", savedAt: note?.updatedAt ?? null });
      })
      .catch((problem: unknown) => {
        if (live) {
          setState({
            kind: "failed",
            message: problem instanceof Error ? problem.message : "The note did not load.",
          });
        }
      });

    return () => {
      live = false;
    };
  }, [characterId, status]);

  if (status === "checking") return null;

  if (status === "anonymous") {
    return (
      <p className="numeric text-sm text-muted">
        <Link to={`/login?next=/characters/${slug}`} className="text-accent-deep">
          Sign in
        </Link>{" "}
        to keep a private note on this character.
      </p>
    );
  }

  if (state.kind === "loading") return <p className="text-muted">Loading your note…</p>;

  if (state.kind === "failed") {
    return (
      <p role="alert" className="max-w-[var(--hp-measure)] text-error">
        {state.message} Reload the page to try again.
      </p>
    );
  }

  const dirty = body !== state.body;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const note = await saveNote(characterId, body);
      setBody(note.body);
      setState({ kind: "ready", body: note.body, savedAt: note.updatedAt });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "That did not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-[var(--hp-measure)]">
      <label
        htmlFor="note"
        className="numeric block text-xs tracking-[0.12em] text-muted uppercase"
      >
        Your note
      </label>

      <textarea
        id="note"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={NOTE_LIMIT}
        rows={6}
        placeholder="What did you notice about this character?"
        aria-describedby="note-count"
        className="mt-1 block w-full resize-y border border-rule bg-transparent p-3 hover:border-rule-strong focus:border-ink"
      />

      <div className="mt-2 flex flex-wrap items-center gap-4">
        <Button type="submit" loading={busy} disabled={!dirty || body.trim().length === 0}>
          Save note
        </Button>

        {/* Silent success: the saved line is the feedback, not a toast. */}
        {!dirty && state.savedAt ? (
          <p className="numeric text-xs tracking-[0.1em] text-muted uppercase">
            saved · {new Date(`${state.savedAt.replace(" ", "T")}Z`).toLocaleString()}
          </p>
        ) : null}

        <p id="note-count" className="numeric ml-auto text-xs text-muted">
          {body.length} / {NOTE_LIMIT}
        </p>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-error">
          {error} Your text is still here — save again when the server is back.
        </p>
      ) : null}
    </form>
  );
}
