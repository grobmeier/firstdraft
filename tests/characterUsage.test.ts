import { describe, expect, it } from "vitest";
import { characterDocumentUsage } from "../src/characters/usage";
import { parseFountain } from "../src/screenplay/parser";

describe("character dossier usage", () => {
  it("derives cue, dialogue, and scene counts without writing the dossier", () => {
    const document = parseFountain(`INT. ROOM - DAY

JANE
Hello.

DR. JANE MORROW
Again.

EXT. ROAD - NIGHT

JANE
Goodbye.
`);
    expect(
      characterDocumentUsage(
        {
          path: "Characters/Jane.md",
          character: "JANE",
          aliases: ["DR. JANE MORROW"],
          screenplays: ["[[Script]]"],
          related: [],
        },
        document,
      ),
    ).toEqual({ cueAppearances: 3, dialogueBlocks: 3, scenes: 2 });
  });
});
