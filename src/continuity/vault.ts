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
import { loadSceneWorkspace } from "../scenes/vault";
import { loadScreenplayContext } from "../projects/vault";
import { verifiableCharacterPages } from "../characters/vault";
import {
  inspectContinuity,
  type ContinuityReport,
  type Evidence,
} from "./model";

export interface InspectorSnapshot {
  report: ContinuityReport;
  dossiers: Map<string, string>;
  guards: Map<string, string>;
}
async function currentSource(
  plugin: FirstDraftPlugin,
  path: string,
): Promise<string> {
  const file = plugin.app.vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile))
    throw new Error("The source note is unavailable. Refresh the inspector.");
  const buffers = plugin.app.workspace
    .getLeavesOfType("markdown")
    .flatMap((leaf) =>
      leaf.view instanceof MarkdownView && leaf.view.file?.path === path
        ? [leaf.view.editor.getValue()]
        : [],
    );
  if (buffers.some((text) => text !== buffers[0]))
    throw new Error(
      "Open editors disagree. Save/reopen them, then refresh the inspector.",
    );
  return buffers[0] ?? plugin.app.vault.read(file);
}
export async function loadInspector(
  plugin: FirstDraftPlugin,
): Promise<InspectorSnapshot> {
  const view = plugin.activeMarkdownView();
  if (!view?.file) throw new Error("Open a screenplay or project first.");
  const workspace = await loadSceneWorkspace(plugin);
  const context = await loadScreenplayContext(
    plugin.app,
    view.file,
    plugin.settings.characterFolder,
    view.editor.getValue(),
  );
  const pages = verifiableCharacterPages(
    plugin.app,
    context.characterFolder,
    context.scopeFiles,
  );
  const dossiers = new Map<string, string>();
  const issues = [...workspace.issues];
  for (const page of pages) {
    const text = await currentSource(plugin, page.path);
    dossiers.set(page.path, text);
    const file = plugin.app.vault.getAbstractFileByPath(page.path);
    if (file instanceof TFile && text !== (await plugin.app.vault.read(file)))
      issues.push(
        `${page.path}: Unsaved character properties may differ from the metadata cache; save and refresh.`,
      );
  }
  const guards = new Map(
    workspace.files.map((file) => [file.path, file.source]),
  );
  for (const [path, source] of dossiers) guards.set(path, source);
  guards.set(
    context.owner.path,
    await currentSource(plugin, context.owner.path),
  );
  return {
    report: inspectContinuity(workspace.files, pages, issues),
    dossiers,
    guards,
  };
}
export async function openInspectorEvidence(
  plugin: FirstDraftPlugin,
  evidence: Evidence,
  guards: ReadonlyMap<string, string> = new Map(),
): Promise<void> {
  for (const [path, source] of guards)
    if ((await currentSource(plugin, path)) !== source)
      throw new Error(
        "This report is stale. Refresh the inspector before opening evidence.",
      );
  if ((await currentSource(plugin, evidence.path)) !== evidence.source)
    throw new Error(
      "This evidence is stale. Refresh the inspector before opening it.",
    );
  const file = plugin.app.vault.getAbstractFileByPath(evidence.path);
  if (!(file instanceof TFile))
    throw new Error("The source note is unavailable. Refresh the inspector.");
  const leaf = plugin.app.workspace.getLeaf(false);
  await leaf.openFile(file);
  if (leaf.view instanceof MarkdownView) {
    const from = { line: evidence.line, ch: 0 };
    const to = { line: evidence.line, ch: evidence.text.length };
    leaf.view.editor.setSelection(from, to);
    leaf.view.editor.scrollIntoView({ from, to }, true);
    leaf.view.editor.focus();
  }
}
