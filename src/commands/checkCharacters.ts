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

import type { Editor, TFile } from "obsidian";
import { verifiableCharacterPages } from "../characters/vault";
import { verifyCharacterPages } from "../characters/verification";
import type FirstDraftPlugin from "../main";
import { loadScreenplayContext } from "../projects/vault";
import { buildScreenplayIndex } from "../screenplay/indexer";
import { CharacterCheckModal } from "../ui/characterCheckModal";

export function checkCharacters(
  plugin: FirstDraftPlugin,
  editor: Editor,
  screenplay: TFile,
): void {
  void checkCharacterContext(plugin, editor, screenplay);
}

async function checkCharacterContext(
  plugin: FirstDraftPlugin,
  editor: Editor,
  screenplay: TFile,
): Promise<void> {
  const context = await loadScreenplayContext(
    plugin.app,
    screenplay,
    plugin.settings.characterFolder,
    editor.getValue(),
  );
  const index = buildScreenplayIndex(context.document);
  const pages = verifiableCharacterPages(plugin.app, context.scopeFiles);
  const issues = verifyCharacterPages(
    index.characters.map((usage) => usage.value),
    pages,
  );
  new CharacterCheckModal(plugin.app, issues).open();
}
