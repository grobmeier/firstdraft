import { describe, expect, it } from "vitest";
import {
  buildScreenplayIndex,
  parseSceneHeadingParts,
  rankUsages,
} from "../src/screenplay/indexer";
import { parseFountain } from "../src/screenplay/parser";

describe("screenplay index", () => {
  it("extracts screenplay element usage", () => {
    const index = buildScreenplayIndex(
      parseFountain(`INT. MILITARY BASE - THERAPY ROOM - DAY

JANE
(quietly)
Hello.

CUT TO:

EXT. PARADE GROUND - NIGHT

MILLER
Report.

INT. MILITARY BASE - THERAPY ROOM - NIGHT

JANE
Ready.
`),
    );

    expect(index.characters).toMatchObject([
      { value: "JANE", count: 2 },
      { value: "MILLER", count: 1 },
    ]);
    expect(index.locations).toMatchObject([
      { value: "MILITARY BASE - THERAPY ROOM", count: 2 },
      { value: "PARADE GROUND", count: 1 },
    ]);
    expect(index.timesOfDay).toMatchObject([
      { value: "DAY", count: 1 },
      { value: "NIGHT", count: 2 },
    ]);
    expect(index.parentheticals).toMatchObject([
      { value: "(quietly)", count: 1 },
    ]);
    expect(index.transitions).toMatchObject([{ value: "CUT TO:", count: 1 }]);
  });

  it("splits the final scene-heading segment as time", () => {
    expect(
      parseSceneHeadingParts("INT. MILITARY BASE - THERAPY ROOM - EVENING"),
    ).toEqual({
      type: "INT.",
      location: "MILITARY BASE - THERAPY ROOM",
      timeOfDay: "EVENING",
    });
  });

  it("combines frequency and recency deterministically", () => {
    const usages = [
      { value: "JANE", count: 4, lastUsedPosition: 10 },
      { value: "JACKSON", count: 1, lastUsedPosition: 100 },
    ];

    expect(rankUsages(usages, "JA", 0, 8)[0]?.value).toBe("JANE");
    expect(rankUsages(usages, "JA", 1, 8)[0]?.value).toBe("JACKSON");
  });
});
