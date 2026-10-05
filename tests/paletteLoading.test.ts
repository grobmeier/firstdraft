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

import { beforeEach, describe, expect, it, vi } from "vitest";
import type FirstDraftPlugin from "../src/main";
import { renderFirstDraftPalette } from "../src/ui/palette/paletteRenderer";
import { renderScreenplayPalette } from "../src/ui/palette/screenplayPalette";
import { renderProjectPalette } from "../src/ui/palette/projectPalette";
import { renderCharacterPalette } from "../src/ui/palette/characterPalette";

vi.mock("../src/commands/createExample", () => ({
  createExampleScreenplay: vi.fn(),
}));
vi.mock("../src/commands/activateScreenplay", () => ({
  activateScreenplayNote: vi.fn(),
}));
vi.mock("../src/ui/cheatSheetModal", () => ({ CheatSheetModal: vi.fn() }));
vi.mock("../src/ui/palette/screenplayPalette", () => ({
  renderScreenplayPalette: vi.fn(),
}));
vi.mock("../src/ui/palette/projectPalette", () => ({
  renderProjectPalette: vi.fn(),
}));
vi.mock("../src/ui/palette/characterPalette", () => ({
  renderCharacterPalette: vi.fn(),
}));

function render(
  kind: "loading" | "screenplay" | "ordinary" | "project" | "character",
) {
  const texts: string[] = [];
  const element = {
    empty: () => {
      texts.length = 0;
    },
    createEl: (_tag: string, options: { text?: string }) => {
      if (options.text) texts.push(options.text);
      return element;
    },
    createDiv: () => element,
    addEventListener: vi.fn(),
  };
  const view = { file: { extension: "md" }, editor: {} };
  const plugin = {
    activeMarkdownView: () => view,
    isScreenplayFile: () => kind === "screenplay",
    isProjectFile: () => kind === "project",
    isCharacterFile: () => kind === "character",
    notePropertiesForFile: () => ({
      state: kind === "loading" ? "loading" : "ready",
    }),
    settings: { activateFrontmatter: true },
  };
  renderFirstDraftPalette(
    plugin as unknown as FirstDraftPlugin,
    element as unknown as HTMLElement,
    {
      getQuery: () => "",
      setQuery: vi.fn(),
      isCurrent: () => true,
    },
  );
  return texts.join("\n");
}

describe("palette property loading", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows waiting feedback, never an activation button, for unknown properties", () => {
    const text = render("loading");
    expect(text).toContain("Waiting for this note’s properties");
    expect(text).not.toContain("Use this note as a screenplay");
    expect(renderScreenplayPalette).not.toHaveBeenCalled();
  });

  it("renders writing actions for an activated note", () => {
    expect(render("screenplay")).not.toContain("Use this note as a screenplay");
    expect(renderScreenplayPalette).toHaveBeenCalledOnce();
  });

  it("offers activation only for an ordinary ready note", () => {
    expect(render("ordinary")).toContain("Use this note as a screenplay");
  });

  it("keeps project and character controls separate from screenplay activation", () => {
    expect(render("project")).not.toContain("Use this note as a screenplay");
    expect(renderProjectPalette).toHaveBeenCalledOnce();
    expect(render("character")).not.toContain("Use this note as a screenplay");
    expect(renderCharacterPalette).toHaveBeenCalledOnce();
  });
});
