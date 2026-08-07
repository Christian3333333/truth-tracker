const MIN_TRANSCRIPT_LENGTH = 20;

function normalizeCaption(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Selects the most useful candidate from the active reel's accessible text. */
export function selectCaptionCandidate(candidates: readonly string[]): string | null {
  const normalized = candidates.map(normalizeCaption).filter(Boolean);
  const caption = normalized.reduce(
    (longest, candidate) =>
      candidate.length > longest.length ? candidate : longest,
    "",
  );

  return caption.length >= MIN_TRANSCRIPT_LENGTH ? caption : null;
}
