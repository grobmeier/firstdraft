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

import { describe, expect, it, vi } from "vitest";
import type { App, TFile } from "obsidian";

vi.mock("obsidian", () => {
  class TFile {
    constructor(
      public path: string,
      public extension = "md",
      public parent = null,
    ) {}
  }
  return {
    TFile,
    getFrontMatterInfo: (source: string) => ({
      exists: source.startsWith("---\n"),
      frontmatter: source.split("---")[1] ?? "",
    }),
    parseYaml: (yaml: string) =>
      Object.fromEntries(
        yaml
          .trim()
          .split("\n")
          .map((line) => {
            const colon = line.indexOf(":");
            return [line.slice(0, colon), line.slice(colon + 1).trim()];
          }),
      ),
  };
});
import { TFile as File } from "obsidian";
import { loadScreenplayContext } from "../src/projects/vault";

function fixture(project = false) {
  const owner = new File();
  owner.path = "Project.md";
  const part = new File();
  part.path = "Part.md";
  const sources = new Map([
    [owner.path, "---\ntitle: Project Title\nauthor: Project Writer\n---\n"],
    [part.path, "Title: Part Title\n\nINT. ROOM - DAY"],
  ]);
  const app = {
    metadataCache: {
      getFileCache: (file: TFile) => ({
        frontmatter:
          project && file.path === owner.path
            ? {
                firstdraft: "screenplay-project",
                title: "Project Title",
                parts: ["Part"],
              }
            : {},
      }),
      getFirstLinkpathDest: (link: string) => (link === "Part" ? part : null),
    },
    vault: { cachedRead: async (file: TFile) => sources.get(file.path) ?? "" },
  } as unknown as App;
  return { owner, part, app };
}

describe("title metadata in screenplay context", () => {
  it("uses unsaved Markdown metadata for standalone exports", async () => {
    const { owner, app } = fixture();
    const context = await loadScreenplayContext(
      app,
      owner,
      "Characters",
      "---\ntitle: Unsaved Title\nauthor: Alex\n---\nINT. ROOM - DAY",
    );
    expect(context.document.titlePage).toEqual({
      title: "Unsaved Title",
      author: "Alex",
    });
  });
  it("uses only the project owner's metadata for a combined screenplay", async () => {
    const { owner, app } = fixture(true);
    const context = await loadScreenplayContext(app, owner, "Characters");
    expect(context.document.titlePage).toEqual({
      title: "Project Title",
      author: "Project Writer",
    });
    expect(context.document.elements).toHaveLength(1);
  });
  it("uses unsaved project metadata when exporting from the project note", async () => {
    const { owner, app } = fixture(true);
    const context = await loadScreenplayContext(
      app,
      owner,
      "Characters",
      "---\ntitle: Unsaved Project\n---\n",
    );
    expect(context.document.titlePage?.title).toBe("Unsaved Project");
  });
});
