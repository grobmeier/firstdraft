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
import { estimateScreenplayPages } from "../src/screenplay/estimator";
import type { ScreenplayDocument } from "../src/screenplay/model";
import { parseFountain } from "../src/screenplay/parser";

describe("estimateScreenplayPages", () => {
  it("increases when action or dialogue is added", () => {
    const base = parseFountain("INT. ROOM - DAY\n");
    const withAction = parseFountain(`INT. ROOM - DAY

The room is silent except for rain tapping steadily against the windows.
`);
    const withDialogue = parseFountain(`INT. ROOM - DAY

JANE
The room is silent except for rain tapping steadily against the windows.
`);

    expect(estimateScreenplayPages(base).pages).toBe(0.1);
    expect(estimateScreenplayPages(withAction).formattedLines).toBeGreaterThan(
      estimateScreenplayPages(base).formattedLines,
    );
    expect(
      estimateScreenplayPages(withDialogue).formattedLines,
    ).toBeGreaterThan(estimateScreenplayPages(withAction).formattedLines);
  });

  it("wraps dialogue more narrowly than action", () => {
    const text =
      "A deliberate sentence that occupies more than one dialogue line but still fits comfortably in action width.";
    const action: ScreenplayDocument = {
      blankLines: 0,
      elements: [{ type: "action", text, line: 1 }],
    };
    const dialogue: ScreenplayDocument = {
      blankLines: 0,
      elements: [{ type: "dialogue", text, line: 1 }],
    };

    expect(estimateScreenplayPages(dialogue).formattedLines).toBeGreaterThan(
      estimateScreenplayPages(action).formattedLines,
    );
  });

  it("is deterministic and supports both page sizes", () => {
    const document = parseFountain(`INT. ROOM - DAY

JANE
This is a deterministic test.
`);

    expect(estimateScreenplayPages(document, "us-letter")).toEqual(
      estimateScreenplayPages(document, "us-letter"),
    );
    expect(
      estimateScreenplayPages(document, "a4").pages,
    ).toBeGreaterThanOrEqual(0);
  });
});
