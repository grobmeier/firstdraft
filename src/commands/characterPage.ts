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
import type { Editor, TFile } from "obsidian";
import type FirstDraftPlugin from "../main";
import {
  characterPagesForScope,
  ensureCharacterPage,
  openCharacterPage,
} from "../characters/vault";
import { loadScreenplayContext } from "../projects/vault";
import { characterNameFromCue } from "../screenplay/characterExtension";
import { buildScreenplayIndex, rankUsages } from "../screenplay/indexer";
import { PickerModal } from "../ui/pickers";

export function openCharacterDossier(
  plugin: FirstDraftPlugin,
  editor: Editor,
  screenplay: TFile,
  preferredCue?: string,
): void {
  const lineCue = characterNameFromCue(editor.getLine(editor.getCursor().line));
  const cue = preferredCue ?? lineCue;
  if (cue) {
    void ensureAndOpen(plugin, screenplay, editor.getValue(), cue);
    return;
  }

  void openDossierPicker(plugin, editor, screenplay);
}

async function openDossierPicker(
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
  const characters = rankUsages(
    index.characters,
    "",
    plugin.settings.recentItemsWeighting,
    plugin.settings.maximumSuggestions,
  ).map((usage) => usage.value);
  if (characters.length === 0) {
    new Notice("No screenplay characters were found in this note.");
    return;
  }
  new PickerModal(plugin.app, {
    title: "Character Page",
    placeholder: "Choose a screenplay character",
    items: characters,
    itemText: (item) => item,
    onChoose: (item) =>
      void ensureAndOpen(plugin, screenplay, editor.getValue(), item),
  }).open();
}

async function ensureAndOpen(
  plugin: FirstDraftPlugin,
  screenplay: TFile,
  currentSource: string,
  cue: string,
): Promise<void> {
  const context = await loadScreenplayContext(
    plugin.app,
    screenplay,
    plugin.settings.characterFolder,
    currentSource,
  );
  const matches = characterPagesForScope(
    plugin.app,
    context.characterFolder,
    context.scopeFiles,
  ).filter(
    (page) =>
      page.character === cue.toLocaleUpperCase() ||
      page.aliases.includes(cue.toLocaleUpperCase()),
  );
  if (matches.length > 1) {
    new Notice(
      `More than one character page matches ${cue}. Run Check Characters.`,
    );
    return;
  }
  const file = await ensureCharacterPage(
    plugin.app,
    context.characterFolder,
    context.owner,
    context.scopeFiles,
    cue,
  );
  if (file === null) {
    new Notice(`Could not create or resolve the character page for ${cue}.`);
    return;
  }
  await openCharacterPage(plugin.app, file);
}
