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
import { orderPaletteActions } from "../src/ui/paletteModel";

describe("First Draft palette action order", () => {
  it("prioritises character extensions on a character cue", () => {
    const source = "INT. ROOM - DAY\n\nJANE\nDialogue.";
    expect(orderPaletteActions(source, source.indexOf("JANE") + 2)[0]).toBe(
      "character-extension",
    );
    expect(orderPaletteActions(source, source.indexOf("JANE") + 2)[1]).toBe(
      "character-page",
    );
  });

  it("prioritises parentheticals inside a dialogue block", () => {
    const source = "INT. ROOM - DAY\n\nJANE\nDialogue continues.";
    expect(orderPaletteActions(source, source.indexOf("continues"))[0]).toBe(
      "parenthetical",
    );
  });

  it("prioritises new scenes on a blank line", () => {
    const source = "INT. ROOM - DAY\n\nAction.\n\n";
    expect(orderPaletteActions(source, source.length)[0]).toBe("new-scene");
  });

  it("does not offer character extension away from a cue", () => {
    const actions = orderPaletteActions("Action line.", 4);
    expect(actions).not.toContain("character-extension");
  });
});
