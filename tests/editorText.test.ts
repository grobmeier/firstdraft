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
import { buildBlockInsertion } from "../src/commands/editorText";

describe("buildBlockInsertion", () => {
  it("surrounds a new scene with Fountain blank lines", () => {
    expect(
      buildBlockInsertion("Action.", "Following action.", "INT. ROOM - DAY", 2),
    ).toEqual({
      insertion: "\n\nINT. ROOM - DAY\n\n",
      caretAdvance: 19,
    });
  });

  it("reuses existing whitespace instead of multiplying it", () => {
    expect(
      buildBlockInsertion(
        "Action.\n\n",
        "\n\nFollowing",
        "EXT. ROAD - NIGHT",
        2,
      ),
    ).toEqual({
      insertion: "EXT. ROAD - NIGHT",
      caretAdvance: 19,
    });
  });

  it("places a character ready for immediate dialogue", () => {
    expect(buildBlockInsertion("Action.", "", "JANE", 1)).toEqual({
      insertion: "\n\nJANE\n",
      caretAdvance: 7,
    });
  });
});
