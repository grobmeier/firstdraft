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

import { Notice } from "obsidian";
import type { MarkdownView } from "obsidian";
import type FirstDraftPlugin from "../main";
import { fountainExportPath } from "../export/fountain";
import { loadScreenplayContext } from "../projects/vault";

export async function exportFountain(
  plugin: FirstDraftPlugin,
  view: MarkdownView,
): Promise<void> {
  const file = view.file;
  if (file === null) return;

  const existingPaths = new Set(
    plugin.app.vault.getFiles().map((candidate) => candidate.path),
  );
  const context = await loadScreenplayContext(
    plugin.app,
    file,
    plugin.settings.characterFolder,
    plugin.isScreenplayFile(file) ? view.editor.getValue() : undefined,
  );
  const path = fountainExportPath(context.owner.path, existingPaths);
  const content = context.source;

  try {
    const exported = await plugin.app.vault.create(path, content);
    new Notice(`Exported screenplay to ${path}`);
    await plugin.app.workspace.getLeaf(false).openFile(exported);
  } catch (error) {
    console.error("First Draft could not export Fountain", error);
    new Notice("First Draft could not export the screenplay.");
  }
}
