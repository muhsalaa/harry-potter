import { useEffect, useState } from "react";

/**
 * A skeleton is drawn only after the wait it covers has lasted a moment. The
 * mirror answers a warm page in single-digit milliseconds, and a grid of blocks
 * that appears for 30ms reads as a glitch rather than as patience. A slow first
 * paint — PotterDB in the path — gets its skeleton, a beat later.
 *
 * Known ceiling: once a wait has been slow enough to draw a skeleton, later
 * waits draw theirs at once. The flag is never cleared, because clearing it
 * costs an extra render to buy back about ten milliseconds. Revisit if a fast
 * page change ever visibly flickers.
 */
export function useSkeletonVisible(loading: boolean, delay = 200) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!loading) return;

    const timer = setTimeout(() => setSettled(true), delay);
    return () => clearTimeout(timer);
  }, [loading, delay]);

  return loading && settled;
}
