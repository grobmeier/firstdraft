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

const context = vi.hoisted(() => ({
  issues: [] as string[],
  ambiguous: false,
}));
vi.mock("obsidian", () => ({
  TFile: class {
    constructor(
      public path = "",
      public extension = "md",
    ) {}
  },
  MarkdownView: class {},
}));
vi.mock("../src/projects/vault", () => ({
  loadScreenplayContext: async (app: { testParts: unknown[] }) => ({
    parts: app.testParts,
    project: { issues: context.issues },
  }),
  projectMembershipIssue: () =>
    context.ambiguous ? "Ambiguous project" : null,
}));
import { TFile, MarkdownView, type WorkspaceLeaf } from "obsidian";
import {
  loadSceneWorkspace,
  applySceneChanges,
  readSceneRecovery,
  restoreLastSceneMove,
  jumpToScene,
} from "../src/scenes/vault";
import { sceneFile, createScene, moveScene } from "../src/scenes/model";

function fixture() {
  const one = new TFile();
  one.path = "One.md";
  const two = new TFile();
  two.path = "Two.md";
  const sources = new Map([
    [
      one.path,
      "---\nscreenplay: true\n---\n\nINT. ROOM - DAY\n= One.\n\n!First.\n\nEXT. ROAD - NIGHT\n\n!Second.",
    ],
    [two.path, "INT. HOUSE - DAY\n\n!Third."],
  ]);
  const configuration = new Map<string, string>();
  const undo: string[] = [];
  const selections: unknown[] = [];
  const views = new Map<string, MarkdownView>();
  let active: MarkdownView;
  function open(file: TFile) {
    let view = views.get(file.path);
    if (!view) {
      view = new MarkdownView({} as WorkspaceLeaf);
      let buffer = sources.get(file.path) ?? "";
      Object.assign(view, {
        file,
        editor: {
          getValue: () => buffer,
          getCursor: () => ({ line: 4, ch: 0 }),
          offsetToPos: (offset: number) => ({ line: 0, ch: offset }),
          transaction: ({ changes }: { changes: { text: string }[] }) => {
            undo.push(buffer);
            buffer = changes[0]?.text ?? buffer;
            sources.set(file.path, buffer);
          },
          setSelection: (...args: unknown[]) => selections.push(args),
          scrollIntoView: () => {},
          focus: () => {},
          testSet: (value: string) => {
            buffer = value;
          },
        },
      });
      views.set(file.path, view);
    }
    active = view;
    return view;
  }
  open(one);
  const plugin = {
    settings: { pageSize: "us-letter", characterFolder: "Characters" },
    manifest: { id: "firstdraft", dir: ".obsidian/plugins/firstdraft" },
    activeMarkdownView: () => active,
    isScreenplayFile: () => true,
    isProjectFile: () => false,
    app: {
      testParts: [one, two],
      workspace: {
        getLeavesOfType: () => [...views.values()].map((view) => ({ view })),
        getLeaf: () => {
          const leaf = {
            view: active,
            openFile: async (file: TFile) => {
              leaf.view = open(file);
            },
          };
          return leaf;
        },
      },
      vault: {
        configDir: ".obsidian",
        getAbstractFileByPath: (path: string) =>
          [one, two].find((file) => file.path === path) ?? null,
        read: async (file: TFile) => sources.get(file.path),
        process: async (file: TFile, transform: (text: string) => string) => {
          const updated = transform(sources.get(file.path) ?? "");
          sources.set(file.path, updated);
          const view = views.get(file.path);
          if (view)
            (
              view.editor as unknown as { testSet: (text: string) => void }
            ).testSet(updated);
        },
        adapter: {
          exists: async (path: string) => configuration.has(path),
          read: async (path: string) => configuration.get(path),
          write: async (path: string, text: string) => {
            configuration.set(path, text);
          },
        },
      },
    },
  } as unknown as FirstDraftPlugin;
  return {
    plugin,
    one,
    two,
    sources,
    configuration,
    views,
    undo,
    selections,
    open,
  };
}
beforeEach(() => {
  context.issues = [];
  context.ambiguous = false;
});
describe("Obsidian scene safety integration", () => {
  it("reads only the explicitly resolved parts and preserves project order", async () => {
    const f = fixture();
    const workspace = await loadSceneWorkspace(f.plugin);
    expect(workspace.files.map((file) => file.path)).toEqual([
      "One.md",
      "Two.md",
    ]);
    expect(workspace.files[0]?.scenes[0]?.line).toBe(4);
  });
  it("uses a single editor transaction for creation with an undo snapshot", async () => {
    const f = fixture();
    const file = sceneFile(f.one.path, f.sources.get(f.one.path) ?? "");
    await applySceneChanges(f.plugin, [
      createScene(file, "INT. STUDIO - DAY", "New.", null, "after"),
    ]);
    expect(f.undo).toEqual([file.source]);
    expect(f.sources.get(f.one.path)).toContain("INT. STUDIO - DAY");
  });
  it("opens an unopened part for a same-file editor transaction", async () => {
    const f = fixture();
    const file = sceneFile(f.two.path, f.sources.get(f.two.path) ?? "");
    await applySceneChanges(f.plugin, [
      createScene(file, "EXT. PARK - DAY", "", null, "after"),
    ]);
    expect(f.views.has(f.two.path)).toBe(true);
    expect(f.undo).toHaveLength(1);
  });
  it("rejects incomplete and ambiguous projects without writing", async () => {
    const f = fixture();
    const file = sceneFile(f.one.path, f.sources.get(f.one.path) ?? "");
    const change = createScene(file, "INT. STUDIO - DAY", "", null, "after");
    context.issues = ["Duplicate part"];
    await expect(applySceneChanges(f.plugin, [change])).rejects.toThrow(
      "Duplicate part",
    );
    context.issues = [];
    context.ambiguous = true;
    await expect(applySceneChanges(f.plugin, [change])).rejects.toThrow(
      "Ambiguous",
    );
    expect(f.undo).toEqual([]);
  });
  it("rejects stale source and out-of-project destinations", async () => {
    const f = fixture();
    await expect(
      applySceneChanges(f.plugin, [
        { path: "Outside.md", before: "", after: "INT. ROOM - DAY" },
      ]),
    ).rejects.toThrow("project changed");
    await expect(
      applySceneChanges(f.plugin, [
        { path: f.one.path, before: "Stale", after: "Changed" },
      ]),
    ).rejects.toThrow("screenplay changed");
  });
  it("moves between parts, stores local recovery and restores after reopening", async () => {
    const f = fixture();
    const before = new Map(f.sources);
    const one = sceneFile(f.one.path, f.sources.get(f.one.path) ?? "");
    const two = sceneFile(f.two.path, f.sources.get(f.two.path) ?? "");
    const scene = one.scenes[0];
    if (!scene) throw new Error("Fixture missing scene");
    await applySceneChanges(f.plugin, moveScene(one, scene, two, null));
    expect([...f.configuration.keys()]).toEqual([
      ".obsidian/plugins/firstdraft/scene-recovery.json",
    ]);
    const record = await readSceneRecovery(f.plugin);
    if (!record) throw new Error("Recovery missing");
    await restoreLastSceneMove(f.plugin, record);
    expect(f.sources).toEqual(before);
  });
  it("refuses cross-file writes when an editor has unsaved changes", async () => {
    const f = fixture();
    const one = sceneFile(f.one.path, f.sources.get(f.one.path) ?? "");
    const two = sceneFile(f.two.path, f.sources.get(f.two.path) ?? "");
    const scene = one.scenes[0];
    if (!scene) throw new Error("Fixture missing scene");
    const view = f.views.get(f.one.path);
    if (!view) throw new Error("View missing");
    (view.editor as unknown as { testSet: (text: string) => void }).testSet(
      one.source + "Unsaved",
    );
    await expect(
      applySceneChanges(f.plugin, moveScene(one, scene, two, null)),
    ).rejects.toThrow("screenplay changed");
    expect(f.configuration.size).toBe(0);
  });
  it("jumps to the exact source heading and rejects stale navigation", async () => {
    const f = fixture();
    const file = sceneFile(f.one.path, f.sources.get(f.one.path) ?? "");
    const scene = file.scenes[0];
    if (!scene) throw new Error("Fixture missing scene");
    await jumpToScene(f.plugin, file, scene);
    expect(f.selections[0]).toEqual([
      { line: 4, ch: 0 },
      { line: 4, ch: scene.heading.length },
    ]);
    await expect(
      jumpToScene(f.plugin, { ...file, source: "Stale" }, scene),
    ).rejects.toThrow("stale");
  });
  it("preserves invalid recovery data without any writes", async () => {
    const f = fixture();
    f.configuration.set(
      ".obsidian/plugins/firstdraft/scene-recovery.json",
      '{"version":999}',
    );
    await expect(readSceneRecovery(f.plugin)).rejects.toThrow("invalid");
    expect(f.undo).toEqual([]);
  });
});
