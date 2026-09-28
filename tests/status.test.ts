/*
 * Copyright 2026 Christian Grobmeier
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
