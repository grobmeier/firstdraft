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
