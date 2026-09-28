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

import type { TFile } from "obsidian";
import type FirstDraftPlugin from "../main";

export async function openCharacterGraph(
  plugin: FirstDraftPlugin,
  characterFile: TFile,
): Promise<void> {
  const existing = plugin.app.workspace.getLeavesOfType("localgraph")[0];
  const leaf = existing ?? plugin.app.workspace.getRightLeaf(true);
  if (leaf === null) return;
  await leaf.setViewState({
    type: "localgraph",
    active: true,
    state: { file: characterFile.path },
  });
  await plugin.app.workspace.revealLeaf(leaf);
}
