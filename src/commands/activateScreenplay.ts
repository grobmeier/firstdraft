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
import type { TFile } from "obsidian";
import type FirstDraftPlugin from "../main";
import { activateScreenplay } from "../onboarding/activateScreenplay";

export async function activateScreenplayNote(
  plugin: FirstDraftPlugin,
  file: TFile,
): Promise<void> {
  try {
    const result = await activateScreenplay(
      {
        activeFile: () => plugin.activeMarkdownView()?.file ?? null,
        activationEnabled: () => plugin.settings.activateFrontmatter,
        isProtected: (target) =>
          plugin.isCharacterFile(target) || plugin.isProjectFile(target),
        processFrontMatter: (target, update) =>
          plugin.app.fileManager.processFrontMatter(target, update),
      },
      file,
    );
    if (result === "activated") {
      new Notice(`Screenplay mode enabled for ${file.basename}.`);
      plugin.refreshStatus();
    } else if (result === "already-active") {
      new Notice(`Screenplay mode is already enabled for ${file.basename}.`);
      plugin.refreshStatus();
    } else if (result === "disabled") {
      new Notice(
        'In First Draft settings, enable "use screenplay frontmatter" first.',
      );
    } else if (result === "unavailable") {
      new Notice("The note changed. Open an ordinary note and try again.");
    }
  } catch {
    new Notice(
      "Could not enable screenplay mode. Check that the note is writable and try again.",
    );
  }
}
