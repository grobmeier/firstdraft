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
  fountainExportPath,
  stripObsidianFrontmatter,
} from "../src/export/fountain";

describe("Fountain export", () => {
  it("strips leading Obsidian frontmatter without changing screenplay text", () => {
    expect(
      stripObsidianFrontmatter(`---
screenplay: true
title: Test
---

INT. ROOM - DAY

JANE
Hello.
`),
    ).toBe(`INT. ROOM - DAY

JANE
Hello.
`);
  });

  it("leaves source without frontmatter byte-for-byte unchanged", () => {
    const source = "INT. ROOM - DAY\r\n\r\nAction.\r\n";
    expect(stripObsidianFrontmatter(source)).toBe(source);
  });

  it("chooses a collision-safe path beside a Markdown note", () => {
    expect(
      fountainExportPath(
        "Scripts/Draft.md",
        new Set(["Scripts/Draft.fountain", "Scripts/Draft-2.fountain"]),
      ),
    ).toBe("Scripts/Draft-3.fountain");
  });

  it("does not overwrite an existing Fountain source", () => {
    expect(
      fountainExportPath("Draft.fountain", new Set(["Draft-export.fountain"])),
    ).toBe("Draft-export-2.fountain");
  });
});
