import { describe, expect, it } from "vitest";
import { parseFountain } from "../src/screenplay/parser";

describe("parseFountain", () => {
  it("recognises scenes, characters, dialogue, and parentheticals", () => {
    const document = parseFountain(`INT. MILITARY BASE - THERAPY ROOM - DAY

DR. JANE MORROW, 42, enters.

JANE (O.S.)
(quietly)
How long have you been having these dreams?

MILLER
Since I died.

EXT. PARADE GROUND - NIGHT
`);

    expect(document.elements.map((element) => element.type)).toEqual([
      "scene-heading",
      "action",
      "character",
      "parenthetical",
      "dialogue",
      "character",
      "dialogue",
      "scene-heading",
    ]);
    expect(
      document.elements.filter((element) => element.type === "character"),
    ).toMatchObject([{ text: "JANE" }, { text: "MILLER" }]);
  });

  it("does not treat standalone uppercase action as a character", () => {
    const document = parseFountain(`INT. CASINO - NIGHT

!SCANNING THE AISLES…

NO ONE MOVES

The dealer watches.
`);

    expect(
      document.elements.filter((element) => element.type === "character"),
    ).toEqual([]);
  });

  it("supports forced mixed-case character cues", () => {
    const document = parseFountain(`@McCLANE
Welcome to the party.
`);

    expect(document.elements[0]).toMatchObject({
      type: "character",
      text: "McCLANE",
    });
  });

  it("ignores Obsidian frontmatter", () => {
    const document = parseFountain(`---
screenplay: true
title: Test
---

INT. ROOM - DAY
`);

    expect(document.elements).toEqual([
      { type: "scene-heading", text: "INT. ROOM - DAY", line: 2 },
    ]);
  });
});
