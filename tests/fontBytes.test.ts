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

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import regular from "../assets/fonts/liberation-mono/LiberationMono-Regular.ttf?bytes";
import bold from "../assets/fonts/liberation-mono/LiberationMono-Bold.ttf?bytes";

describe("build-time font bytes", () => {
  it.each([
    ["Regular", regular],
    ["Bold", bold],
  ] as const)("preserves every byte of the %s font", (weight, bytes) => {
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes).toEqual(
      new Uint8Array(
        readFileSync(
          `assets/fonts/liberation-mono/LiberationMono-${weight}.ttf`,
        ),
      ),
    );
  });

  it("does not decode font data URLs at runtime", () => {
    const source = readFileSync("src/export/pdfFonts.ts", "utf8");
    expect(source).not.toMatch(/\b(?:atob|btoa)\s*\(/);
    expect(source).not.toContain("?inline");
  });
});
