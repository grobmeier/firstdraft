import { describe, expect, it } from "vitest";
import { buildBlockInsertion } from "../src/commands/editorText";

describe("buildBlockInsertion", () => {
  it("surrounds a new scene with Fountain blank lines", () => {
    expect(
      buildBlockInsertion("Action.", "Following action.", "INT. ROOM - DAY", 2),
    ).toEqual({
      insertion: "\n\nINT. ROOM - DAY\n\n",
      caretAdvance: 19,
    });
  });

  it("reuses existing whitespace instead of multiplying it", () => {
    expect(
      buildBlockInsertion(
        "Action.\n\n",
        "\n\nFollowing",
        "EXT. ROAD - NIGHT",
        2,
      ),
    ).toEqual({
      insertion: "EXT. ROAD - NIGHT",
      caretAdvance: 19,
    });
  });

  it("places a character ready for immediate dialogue", () => {
    expect(buildBlockInsertion("Action.", "", "JANE", 1)).toEqual({
      insertion: "\n\nJANE\n",
      caretAdvance: 7,
    });
  });
});
