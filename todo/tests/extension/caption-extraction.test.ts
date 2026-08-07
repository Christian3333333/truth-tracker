import { describe, expect, it } from "vitest";
import { selectCaptionCandidate } from "@/extension/lib/caption-extraction";

describe("selectCaptionCandidate", () => {
  it("returns the longest meaningful caption with normalized whitespace", () => {
    const caption = selectCaptionCandidate([
      "  Ver  más  ",
      "El distrito reportó   una reducción de delitos durante el trimestre.",
    ]);

    expect(caption).toBe(
      "El distrito reportó una reducción de delitos durante el trimestre.",
    );
  });

  it("rejects short accessible labels that are not a transcript", () => {
    expect(selectCaptionCandidate(["Audio", "Más", "Ver reel"])).toBeNull();
  });
});
