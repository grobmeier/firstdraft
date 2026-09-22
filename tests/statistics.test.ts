import { describe, expect, it } from "vitest";
import { parseFountain } from "../src/screenplay/parser";
import { calculateStatistics } from "../src/screenplay/statistics";

describe("calculateStatistics", () => {
  it("counts scenes, words, and character dialogue blocks", () => {
    const statistics = calculateStatistics(
      parseFountain(`INT. ROOM - DAY

JANE
Hello, Miller.

MILLER
Hello.

EXT. ROAD - NIGHT

JANE
Let's go.
`),
    );

    expect(statistics.scenes).toBe(2);
    expect(statistics.words).toBe(14);
    expect(statistics.characters).toEqual([
      { name: "JANE", dialogueBlocks: 2 },
      { name: "MILLER", dialogueBlocks: 1 },
    ]);
  });
});
