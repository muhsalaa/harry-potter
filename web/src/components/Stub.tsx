import type { ReactNode } from "react";

/**
 * Marks a route that renders on purpose but does not carry its feature yet.
 * The marker is honest about which slice fills it in — a stub that pretends to
 * be finished is worse than no stub.
 */
export function Stub({ ticket, children }: { ticket: string; children: ReactNode }) {
  return (
    <div className="page-gutter pb-16">
      <div className="frame max-w-[var(--hp-measure)] p-4">
        <p className="label text-muted">stub · ticket {ticket}</p>
        <p className="mt-2 text-muted">{children}</p>
      </div>
    </div>
  );
}
