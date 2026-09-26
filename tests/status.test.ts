import { describe, expect, it } from "vitest";
import type { ScreenplayStatistics } from "../src/screenplay/model";
import {
  formatEstimatedRuntime,
  formatScreenplayStatus,
} from "../src/screenplay/status";

const statistics: ScreenplayStatistics = {
  scenes: 28,
  words: 6420,
  characters: [],
  locations: [],
  dialogueBlocks: 0,
  actionBlocks: 0,
  estimatedPages: 37.2,
  estimatedRuntimeMinutes: 37.2,
};

describe("formatScreenplayStatus", () => {
  it("keeps useful precision for short screenplay runtimes", () => {
    expect(formatEstimatedRuntime(0.5)).toBe("0.5");
    expect(formatEstimatedRuntime(0.75)).toBe("0.8");
    expect(formatEstimatedRuntime(37.2)).toBe("37");
  });

  it("formats all screenplay measurements", () => {
    const formattedWords = statistics.words.toLocaleString();
    expect(
      formatScreenplayStatus(statistics, {
        estimatedPages: true,
        estimatedRuntime: true,
        words: true,
        scenes: true,
      }),
    ).toBe(
      `Screenplay · ~37.2 pages · ~37 min · ${formattedWords} words · 28 scenes`,
    );
  });

  it("respects independently disabled fields", () => {
    const formattedWords = statistics.words.toLocaleString();
    expect(
      formatScreenplayStatus(statistics, {
        estimatedPages: false,
        estimatedRuntime: false,
        words: true,
        scenes: false,
      }),
    ).toBe(`Screenplay · ${formattedWords} words`);
  });
});
