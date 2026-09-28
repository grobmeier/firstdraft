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

import { normalizePath, Notice } from "obsidian";
import type { TFile } from "obsidian";
import type FirstDraftPlugin from "../main";
import {
  availableExampleFolderName,
  exampleProjectFiles,
} from "../onboarding/exampleProject";

export async function createExampleScreenplay(
  plugin: FirstDraftPlugin,
): Promise<void> {
  const folder = availableExampleFolderName(
    (candidate) => plugin.app.vault.getAbstractFileByPath(candidate) !== null,
  );
  await plugin.app.vault.createFolder(folder);
  await plugin.app.vault.createFolder(normalizePath(`${folder}/Parts`));
  await plugin.app.vault.createFolder(normalizePath(`${folder}/Characters`));

  let startHere: TFile | null = null;
  for (const file of exampleProjectFiles(folder)) {
    const created = await plugin.app.vault.create(
      normalizePath(`${folder}/${file.path}`),
      file.content,
    );
    if (file.path === "Start Here.md") startHere = created;
  }

  if (startHere !== null) {
    await plugin.app.workspace.getLeaf(false).openFile(startHere);
  }
  new Notice(`Created example screenplay in ${folder}.`);
}
