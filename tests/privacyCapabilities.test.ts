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

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.isFile() && path.endsWith(".ts") ? [path] : [];
  });
}

describe("privacy-sensitive capabilities", () => {
  const sourceRoot = fileURLToPath(new URL("../src", import.meta.url));
  const source = sourceFiles(sourceRoot)
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  it("does not enumerate the entire vault", () => {
    expect(source).not.toMatch(/\.get(?:Markdown)?Files\s*\(/u);
    expect(source).not.toMatch(/\.getAllLoadedFiles\s*\(/u);
  });

  it("does not access the system clipboard", () => {
    expect(source).not.toMatch(/navigator\.clipboard/u);
  });
});
