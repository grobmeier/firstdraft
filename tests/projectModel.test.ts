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
  combineScreenplayDocuments,
  resolveCharacterFolder,
  screenplayProjectFromFrontmatter,
} from "../src/projects/model";
import { parseFountain } from "../src/screenplay/parser";
import { buildScreenplayIndex } from "../src/screenplay/indexer";

describe("screenplay projects", () => {
  it("parses ordered wiki links and the character folder override", () => {
    expect(
      screenplayProjectFromFrontmatter("Films/Night/Project.md", {
        firstdraft: "screenplay-project",
        title: "The Long Night",
        parts: ["[[Parts/01 - Opening]]", "[[Elsewhere/02 - Ward|Ward]]"],
        "character-folder": "People",
      }),
    ).toEqual({
      path: "Films/Night/Project.md",
      title: "The Long Night",
      parts: ["Parts/01 - Opening", "Elsewhere/02 - Ward"],
      characterFolder: "People",
    });
  });

  it("resolves relative folders beside their owner and absolute folders at vault root", () => {
    expect(resolveCharacterFolder("Films/Night/Project.md", "Characters")).toBe(
      "Films/Night/Characters",
    );
    expect(resolveCharacterFolder("Films/Night/Project.md", "/People")).toBe(
      "People",
    );
    expect(resolveCharacterFolder("Standalone.md", "Characters")).toBe(
      "Characters",
    );
  });

  it("combines documents in order while preserving recency", () => {
    const combined = combineScreenplayDocuments([
      parseFountain("INT. HOME - DAY\n\nJANE\nHello."),
      parseFountain("EXT. ROAD - NIGHT\n\nMILLER\nWait.\n\nJANE\nGo."),
    ]);
    const index = buildScreenplayIndex(combined);
    expect(
      index.characters.find((item) => item.value === "JANE"),
    ).toMatchObject({
      count: 2,
    });
    expect(
      index.characters.find((item) => item.value === "JANE")?.lastUsedPosition,
    ).toBeGreaterThan(
      index.characters.find((item) => item.value === "MILLER")
        ?.lastUsedPosition ?? 0,
    );
  });
});
