/**
 * Line-level diff helpers. Keep small — no external dependency.
 *
 * `markNewLines` is used by Duck's snippet rendering: for every line in
 * `snippet`, mark it as "new" iff that exact line (trimmed) does not occur
 * in `current`. This is intentionally coarse — perfect for highlighting
 * suggested additions in a partial reply, not for full-file diffs.
 *
 * `diffLineRanges` is used after applying a snippet to the editor: it
 * walks both versions with a tiny LCS-table-free heuristic and returns
 * the 1-based line ranges in `next` that differ from `prev`. Good enough
 * for transient highlight purposes.
 */

export function markNewLines(snippet: string, current: string): boolean[] {
  const currentSet = new Set(
    current
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0),
  );
  return snippet.split("\n").map((line) => {
    const t = line.trim();
    if (!t) return false;
    return !currentSet.has(t);
  });
}

/** Returns 1-based [startLine, endLine] ranges in `next` that differ from
 *  `prev`. Adjacent changed lines are merged into a single range. */
export function changedLineRanges(
  prev: string,
  next: string,
): { start: number; end: number }[] {
  const a = prev.split("\n");
  const b = next.split("\n");
  const max = Math.max(a.length, b.length);
  const changed: number[] = [];
  // Simple line-by-line compare. For real merges we'd LCS; for the
  // "you just replaced everything" case this is correct.
  for (let i = 0; i < max; i++) {
    if (a[i] !== b[i]) changed.push(i + 1);
  }
  // Merge consecutive
  const ranges: { start: number; end: number }[] = [];
  for (const ln of changed) {
    const last = ranges[ranges.length - 1];
    if (last && last.end === ln - 1) {
      last.end = ln;
    } else {
      ranges.push({ start: ln, end: ln });
    }
  }
  return ranges;
}
