import { useState } from "react";
import { Link } from "react-router";

import { NOTE_LIMIT } from "../../api/notes";
import { signInHref } from "../../auth/next";
import { useNote, useSaveNote } from "../../hooks/notes";
import { useViewer } from "../../hooks/viewer";
import { Button } from "../button";
import { Bar, ProseSkeleton } from "../skeleton";


type NotePanelProps = {
  characterId: number;
  slug: string;
};

/**
 * One Note per User and Character. Saving again overwrites the same row in
 * place: no second note, no history, no delete — the note has a current value.
 *
 * The draft is the only state this panel owns: `null` means "nothing typed yet,
 * show what is saved", so the saved Note in the cache stays the baseline and
 * `dirty` is a comparison rather than a flag someone has to remember to clear.
 */
export function NotePanel({ characterId, slug }: NotePanelProps) {
  const viewer = useViewer();
  const note = useNote(characterId);
  const save = useSaveNote(characterId);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!viewer.settled) return null;

  if (!viewer.signedIn) {
    return (
      <p className="prose max-w-[var(--hp-measure)] text-muted">
        <Link to={signInHref(`/characters/${slug}`)}>Sign in</Link> to keep a private note on this
        character.
      </p>
    );
  }

  if (note.isPending) {
    return (
      <div className="max-w-[var(--hp-measure)]">
        <p role="status" className="sr-only">
          Opening your note…
        </p>
        <Bar className="h-3 w-20" />
        <ProseSkeleton className="mt-2" lines={3} />
      </div>
    );
  }

  if (note.isError) {
    return (
      <p role="alert" className="max-w-[var(--hp-measure)] text-error">
        {note.error instanceof Error ? note.error.message : "The note did not load."} Try
        reloading the page.
      </p>
    );
  }

  const saved = note.data?.body ?? "";
  const body = draft ?? saved;
  const dirty = draft !== null && draft !== saved;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await save.mutateAsync(body);
      // The cache now holds what was written, so the draft is no longer needed.
      setDraft(null);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "That did not save.");
    }
  }

  return (
    <form onSubmit={submit} className="max-w-[var(--hp-measure)]">
      <label htmlFor="note" className="label block text-muted">
        Your note
      </label>

      <textarea
        id="note"
        value={body}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={NOTE_LIMIT}
        rows={6}
        placeholder="What did you notice about this character?"
        aria-describedby="note-count"
        className="mt-1 block w-full resize-y edge border-rule-strong bg-paper p-3 text-ink hover:border-ink focus:border-accent"
      />

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <Button type="submit" loading={save.isPending} disabled={!dirty || body.trim().length === 0}>
          Save note
        </Button>

        {/* Silent success: the saved line is the feedback, not a toast. */}
        {!dirty && note.data?.updatedAt ? (
          <p className="label numeric text-magic">
            saved · {new Date(`${note.data.updatedAt.replace(" ", "T")}Z`).toLocaleString()}
          </p>
        ) : null}

        <p id="note-count" className="label numeric ms-auto text-muted">
          {body.length} / {NOTE_LIMIT}
        </p>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-error">
          {error} Your text is still here — try saving again.
        </p>
      ) : null}
    </form>
  );
}
