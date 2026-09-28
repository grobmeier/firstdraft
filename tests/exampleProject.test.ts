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
  availableExampleFolderName,
  exampleProjectFiles,
} from "../src/onboarding/exampleProject";

describe("example screenplay project", () => {
  it("chooses a conflict-safe numbered folder", () => {
    const existing = new Set(["First Draft Example", "First Draft Example 2"]);
    expect(availableExampleFolderName((name) => existing.has(name))).toBe(
      "First Draft Example 3",
    );
  });

  it("provides a complete portable project", () => {
    const files = exampleProjectFiles("First Draft Example 2");
    expect(files.map((file) => file.path)).toEqual([
      "Start Here.md",
      "Screenplay Project.md",
      "Parts/01 - Arrival.md",
      "Parts/02 - Choice.md",
      "Characters/Mara.md",
      "Characters/Elias.md",
    ]);
    expect(
      files.find((file) => file.path === "Screenplay Project.md")?.content,
    ).toContain('  - "[[Parts/01 - Arrival]]"');
    expect(
      files.find((file) => file.path === "Characters/Mara.md")?.content,
    ).toContain('"[[First Draft Example 2/Screenplay Project]]"');
    expect(
      files.find((file) => file.path === "Parts/01 - Arrival.md")?.content,
    ).toContain("MARA (V.O.)\n(steadying herself)");
  });
});
