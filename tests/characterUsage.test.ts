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
import { characterDocumentUsage } from "../src/characters/usage";
import { parseFountain } from "../src/screenplay/parser";

describe("character dossier usage", () => {
  it("derives cue, dialogue, and scene counts without writing the dossier", () => {
    const document = parseFountain(`INT. ROOM - DAY

JANE
Hello.

DR. JANE MORROW
Again.

EXT. ROAD - NIGHT

JANE
Goodbye.
`);
    expect(
      characterDocumentUsage(
        {
          path: "Characters/Jane.md",
          character: "JANE",
          aliases: ["DR. JANE MORROW"],
          screenplays: ["[[Script]]"],
          related: [],
        },
        document,
      ),
    ).toEqual({ cueAppearances: 3, dialogueBlocks: 3, scenes: 2 });
  });
});
