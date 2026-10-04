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

import { MarkdownView, TFile } from "obsidian";
import type FirstDraftPlugin from "../main";
import {
  loadScreenplayContext,
  projectMembershipIssue,
} from "../projects/vault";
import {
  sceneFile,
  type Scene,
  type SceneFile,
  type SceneChange,
} from "./model";
import {
  applySceneMove,
  restoreSceneMove,
  isSceneRecovery,
  type SceneRecovery,
  type SceneWritePort,
} from "./transactions";

export interface SceneWorkspace {
  files: SceneFile[];
  issues: string[];
  activePath: string;
  activeLine: number;
}
const busy = new WeakSet<FirstDraftPlugin>();

function editors(plugin: FirstDraftPlugin, path: string): MarkdownView[] {
  return plugin.app.workspace
    .getLeavesOfType("markdown")
    .flatMap((leaf) =>
      leaf.view instanceof MarkdownView && leaf.view.file?.path === path
        ? [leaf.view]
        : [],
    );
}
function fileFor(plugin: FirstDraftPlugin, path: string): TFile {
  const file = plugin.app.vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile))
    throw new Error(`The file is no longer available: ${path}`);
  return file;
}
async function sourceFor(
  plugin: FirstDraftPlugin,
  path: string,
): Promise<string> {
  const open = editors(plugin, path);
  const values = open.map((view) => view.editor.getValue());
  if (values.some((value) => value !== values[0]))
    throw new Error(
      "Open editors disagree about this file. Save/reopen them before changing scenes.",
    );
  return values[0] ?? plugin.app.vault.read(fileFor(plugin, path));
}
export async function loadSceneWorkspace(
  plugin: FirstDraftPlugin,
): Promise<SceneWorkspace> {
  const view = plugin.activeMarkdownView();
  if (
    !view?.file ||
    (!plugin.isScreenplayFile(view.file) && !plugin.isProjectFile(view.file))
  )
    throw new Error("Open a screenplay or screenplay project first.");
  const context = await loadScreenplayContext(
    plugin.app,
    view.file,
    plugin.settings.characterFolder,
    view.editor.getValue(),
  );
  const issues = [...(context.project?.issues ?? [])];
  for (const file of context.parts) {
    const issue = projectMembershipIssue(plugin.app, file);
    if (issue) issues.push(`${file.path}: ${issue}`);
  }
  let pageOffset = 0;
  const files: SceneFile[] = [];
  for (const file of context.parts) {
    const result = sceneFile(
      file.path,
      await sourceFor(plugin, file.path),
      plugin.settings.pageSize,
      pageOffset,
    );
    files.push(result);
    pageOffset += result.pages;
  }
  return {
    files,
    issues,
    activePath: view.file.path,
    activeLine: view.editor.getCursor().line,
  };
}
export async function jumpToScene(
  plugin: FirstDraftPlugin,
  file: SceneFile,
  scene: Scene,
): Promise<void> {
  if ((await sourceFor(plugin, file.path)) !== file.source)
    throw new Error("This scene list is stale. Refresh before jumping.");
  const leaf = plugin.app.workspace.getLeaf(false);
  await leaf.openFile(fileFor(plugin, file.path));
  if (leaf.view instanceof MarkdownView) {
    const editor = leaf.view.editor;
    editor.setSelection(
      { line: scene.line, ch: 0 },
      { line: scene.line, ch: scene.heading.length },
    );
    editor.scrollIntoView(
      { from: { line: scene.line, ch: 0 }, to: { line: scene.line, ch: 0 } },
      true,
    );
    editor.focus();
  }
}

function recoveryPath(plugin: FirstDraftPlugin): string {
  return `${plugin.manifest.dir ?? `${plugin.app.vault.configDir}/plugins/${plugin.manifest.id}`}/scene-recovery.json`;
}
function diskPort(plugin: FirstDraftPlugin): SceneWritePort {
  return {
    read: async (path) => {
      const source = await plugin.app.vault.read(fileFor(plugin, path));
      if (
        editors(plugin, path).some((view) => view.editor.getValue() !== source)
      )
        throw new Error(
          "Save the affected notes before a cross-file move or restore.",
        );
      return source;
    },
    write: async (change) => {
      if (
        editors(plugin, change.path).some(
          (view) =>
            view.editor.getValue() !== change.before &&
            view.editor.getValue() !== change.after,
        )
      )
        throw new Error("An open editor changed during this operation.");
      await plugin.app.vault.process(fileFor(plugin, change.path), (source) => {
        if (source !== change.before)
          throw new Error("A file changed during this operation.");
        return change.after;
      });
    },
    saveRecovery: async (record) => {
      if (!isSceneRecovery(record))
        throw new Error(
          "Recovery paths must be ordinary screenplay files outside hidden folders.",
        );
      await plugin.app.vault.adapter.write(
        recoveryPath(plugin),
        JSON.stringify(record),
      );
    },
  };
}

export async function readSceneRecovery(
  plugin: FirstDraftPlugin,
): Promise<SceneRecovery | null> {
  const path = recoveryPath(plugin);
  if (!(await plugin.app.vault.adapter.exists(path))) return null;
  let value: unknown;
  try {
    value = JSON.parse(await plugin.app.vault.adapter.read(path));
  } catch {
    throw new Error(
      "The scene recovery copy could not be read. It has been preserved without changing any files.",
    );
  }
  if (!isSceneRecovery(value))
    throw new Error(
      "The scene recovery copy is invalid. It has been preserved without changing any files.",
    );
  return value;
}

async function exclusive(
  plugin: FirstDraftPlugin,
  task: () => Promise<void>,
): Promise<void> {
  if (busy.has(plugin))
    throw new Error("A scene operation is already in progress.");
  busy.add(plugin);
  try {
    await task();
  } finally {
    busy.delete(plugin);
  }
}
export async function applySceneChanges(
  plugin: FirstDraftPlugin,
  changes: SceneChange[],
): Promise<void> {
  await exclusive(plugin, async () => {
    // Re-check project membership immediately before writing, not just when the dialogue opened.
    const workspace = await loadSceneWorkspace(plugin);
    if (workspace.issues.length) throw new Error(workspace.issues.join("\n"));
    const scope = new Set(workspace.files.map((file) => file.path));
    if (changes.some((change) => !scope.has(change.path)))
      throw new Error(
        "The project changed. Choose a destination in the current project.",
      );
    for (const change of changes)
      if ((await sourceFor(plugin, change.path)) !== change.before)
        throw new Error("A screenplay changed. Refresh and try again.");
    if (changes.length > 1) {
      if (scope.size < 2)
        throw new Error(
          "Cross-file moves require a resolved multi-file project.",
        );
      await applySceneMove(diskPort(plugin), changes);
    } else {
      const change = changes[0];
      if (!change) return;
      let open = editors(plugin, change.path);
      if (!open.length) {
        await plugin.app.workspace
          .getLeaf(false)
          .openFile(fileFor(plugin, change.path));
        open = editors(plugin, change.path);
      }
      if (open.length) {
        for (const view of open) {
          if (view.editor.getValue() === change.after) continue;
          if (view.editor.getValue() !== change.before)
            throw new Error(
              "An open editor changed before the scene transaction.",
            );
          // Leave unchanged properties and text outside the move untouched.
          let start = 0;
          while (
            start < change.before.length &&
            start < change.after.length &&
            change.before[start] === change.after[start]
          )
            start++;
          let endBefore = change.before.length;
          let endAfter = change.after.length;
          while (
            endBefore > start &&
            endAfter > start &&
            change.before[endBefore - 1] === change.after[endAfter - 1]
          ) {
            endBefore--;
            endAfter--;
          }
          view.editor.transaction(
            {
              changes: [
                {
                  from: view.editor.offsetToPos(start),
                  to: view.editor.offsetToPos(endBefore),
                  text: change.after.slice(start, endAfter),
                },
              ],
            },
            "input",
          );
        }
      } else
        throw new Error(
          "Open this note in the editor before changing its scenes.",
        );
    }
  });
}
export async function restoreLastSceneMove(
  plugin: FirstDraftPlugin,
  record: SceneRecovery,
): Promise<void> {
  await exclusive(plugin, async () => {
    const latest = await readSceneRecovery(plugin);
    if (JSON.stringify(latest) !== JSON.stringify(record))
      throw new Error(
        "A newer recovery copy exists. Reopen Restore Last Move.",
      );
    await restoreSceneMove(diskPort(plugin), record);
  });
}
