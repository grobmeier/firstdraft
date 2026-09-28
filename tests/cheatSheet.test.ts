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
import { CHEAT_SHEET_SECTIONS } from "../src/onboarding/cheatSheet";

describe("screenplay cheat sheet", () => {
  it("covers screenplay, Fountain, and First Draft terms", () => {
    expect(CHEAT_SHEET_SECTIONS.map((section) => section.title)).toEqual([
      "Screenplay terms",
      "Fountain quick syntax",
      "First Draft terms",
    ]);
    const terms = CHEAT_SHEET_SECTIONS.flatMap((section) =>
      section.entries.map((entry) => entry.term),
    );
    expect(terms).toContain("Scene heading / slugline");
    expect(terms).toContain("V.O.");
    expect(terms).toContain("Project note");
    expect(terms).toContain("Character dossier");
  });

  it("provides examples for every supported FDX element type", () => {
    const fountain = CHEAT_SHEET_SECTIONS.find(
      (section) => section.title === "Fountain quick syntax",
    );
    expect(fountain?.entries.map((entry) => entry.term)).toEqual([
      "Scene heading",
      "Action",
      "Character",
      "Parenthetical",
      "Dialogue",
      "Transition",
    ]);
    expect(fountain?.entries.every((entry) => Boolean(entry.example))).toBe(
      true,
    );
  });
});
