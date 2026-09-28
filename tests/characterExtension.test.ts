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
  characterNameFromCue,
  isLikelyCharacterCue,
  withCharacterExtension,
} from "../src/screenplay/characterExtension";

describe("character extensions", () => {
  it("adds and replaces an extension", () => {
    expect(withCharacterExtension("JANE", "(O.S.)")).toBe("JANE (O.S.)");
    expect(withCharacterExtension("JANE (O.S.)", "(V.O.)")).toBe("JANE (V.O.)");
  });

  it("preserves dual-dialogue markers", () => {
    expect(withCharacterExtension("JANE ^", "(O.S.)")).toBe("JANE (O.S.) ^");
  });

  it("extracts canonical names from valid cues", () => {
    expect(characterNameFromCue("@Dr. Jane Morrow (O.S.) ^")).toBe(
      "DR. JANE MORROW",
    );
    expect(characterNameFromCue("CUT TO:")).toBeNull();
  });

  it("rejects scene headings and ordinary mixed-case text", () => {
    expect(isLikelyCharacterCue("JANE")).toBe(true);
    expect(isLikelyCharacterCue("INT. ROOM - DAY")).toBe(false);
    expect(isLikelyCharacterCue("CUT TO:")).toBe(false);
    expect(isLikelyCharacterCue(">MEMORY CUT TO:")).toBe(false);
    expect(isLikelyCharacterCue("Jane walks in.")).toBe(false);
  });
});
