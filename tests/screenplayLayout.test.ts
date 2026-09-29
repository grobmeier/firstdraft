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
  layoutScreenplay,
  wrapScreenplayText,
} from "../src/export/screenplayLayout";
import { parseFountain } from "../src/screenplay/parser";

describe("screenplay page layout", () => {
  it("uses the configured page dimensions and screenplay element positions", () => {
    const document = parseFountain(`INT. OFFICE - NIGHT

MILLER
(quietly)
We should leave before anyone notices.

>CUT TO:`);
    const letter = layoutScreenplay(document, "us-letter");
    const a4 = layoutScreenplay(document, "a4");

    expect(letter.dimensions).toEqual({ width: 612, height: 792 });
    expect(a4.dimensions.height).toBeGreaterThan(letter.dimensions.height);
    expect(letter.pages).toHaveLength(1);
    expect(letter.pages[0]?.blocks.map((block) => block.type)).toEqual([
      "scene-heading",
      "character",
      "parenthetical",
      "dialogue",
      "transition",
    ]);
    expect(
      letter.pages[0]?.blocks.find((block) => block.type === "transition")
        ?.align,
    ).toBe("right");
  });

  it("wraps long prose and paginates without clipping the bottom margin", () => {
    const action = Array.from(
      { length: 190 },
      (_, index) => `This is action sentence ${index + 1}.`,
    ).join(" ");
    const layout = layoutScreenplay(
      parseFountain(`INT. WAREHOUSE - DAY\n\n${action}`),
      "us-letter",
    );

    expect(layout.pages.length).toBeGreaterThan(1);
    for (const page of layout.pages) {
      for (const block of page.blocks) {
        expect(
          block.top + block.lines.length * layout.lineHeight,
        ).toBeLessThanOrEqual(layout.dimensions.height - 60);
      }
    }
  });

  it("breaks words that exceed the available screenplay column", () => {
    expect(wrapScreenplayText("ABCDEFGHIJK", 5)).toEqual([
      "ABCDE",
      "FGHIJ",
      "K",
    ]);
  });
});
