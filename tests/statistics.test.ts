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
    expect(statistics.locations).toEqual(["ROOM", "ROAD"]);
    expect(statistics.dialogueBlocks).toBe(3);
    expect(statistics.actionBlocks).toBe(0);
    expect(statistics.estimatedPages).toBeGreaterThan(0);
    expect(statistics.estimatedRuntimeMinutes).toBe(statistics.estimatedPages);
    expect(statistics.characters).toEqual([
      { name: "JANE", dialogueBlocks: 2 },
      { name: "MILLER", dialogueBlocks: 1 },
    ]);
  });

  it("uses configured page and runtime settings", () => {
    const statistics = calculateStatistics(parseFountain("A quiet room."), {
      pageSize: "a4",
      minutesPerPage: 1.5,
    });

    expect(statistics.estimatedRuntimeMinutes).toBe(
      statistics.estimatedPages * 1.5,
    );
  });

  it("groups adjacent action lines into action blocks", () => {
    const statistics = calculateStatistics(
      parseFountain(`First action line.
Second action line.

A separate action block.
`),
    );

    expect(statistics.actionBlocks).toBe(2);
  });
});
