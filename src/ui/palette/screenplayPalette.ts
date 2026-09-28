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
import { characterPagesForScope } from "../../characters/vault";
import { openCharacterPicker } from "../../commands/character";
import { openCharacterExtension } from "../../commands/characterExtension";
import { openCharacterDossier } from "../../commands/characterPage";
import { checkCharacters } from "../../commands/checkCharacters";
import { openNewScene } from "../../commands/newScene";
import { openParenthetical } from "../../commands/parenthetical";
import { openTransition } from "../../commands/transition";
import type FirstDraftPlugin from "../../main";
import {
  loadScreenplayContext,
  openAdjacentProjectPart,
  projectForPart,
} from "../../projects/vault";
import { orderPaletteActions, type PaletteAction } from "../paletteModel";
import { renderRecentPalette, type PaletteRenderState } from "./recentPalette";

const ACTION_LABELS: Record<PaletteAction, string> = {
  character: "Character",
  "character-extension": "Character Extension",
  "character-page": "Character Page",
  parenthetical: "Parenthetical",
  "new-scene": "New Scene",
  transition: "Transition",
};

export function renderScreenplayPalette(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
  editor: Editor,
  file: TFile,
  state: PaletteRenderState,
): void {
  const source = editor.getValue();
  const cursorOffset = editor.posToOffset(editor.getCursor());
  renderActions(plugin, container, editor, file, source, cursorOffset);
  renderProjectNavigation(plugin, container, file);
  const loading = container.createEl("p", {
    cls: "firstdraft-palette-muted",
    text: "Loading screenplay project…",
  });
  void renderRecentContext(
    plugin,
    container,
    loading,
    editor,
    file,
    source,
    state,
  );
}

async function renderRecentContext(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
  loading: HTMLElement,
  editor: Editor,
  file: TFile,
  source: string,
  state: PaletteRenderState,
): Promise<void> {
  const context = await loadScreenplayContext(
    plugin.app,
    file,
    plugin.settings.characterFolder,
    source,
  );
  if (!state.isCurrent()) return;
  loading.remove();
  renderRecentPalette(
    plugin,
    container,
    editor,
    file,
    context.document,
    characterPagesForScope(plugin.app, context.scopeFiles),
    state,
  );
}

function renderActions(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
  editor: Editor,
  screenplay: TFile,
  source: string,
  cursorOffset: number,
): void {
  container.createEl("h3", { text: "Actions" });
  const actions = container.createDiv({ cls: "firstdraft-palette-actions" });

  for (const action of orderPaletteActions(source, cursorOffset)) {
    const button = actions.createEl("button", {
      cls: "firstdraft-palette-action",
      text: ACTION_LABELS[action],
    });
    button.addEventListener("click", () =>
      runAction(plugin, action, editor, screenplay),
    );
  }
  const check = actions.createEl("button", {
    cls: "firstdraft-palette-action firstdraft-palette-check",
    text: "Check characters",
  });
  check.addEventListener("click", () =>
    checkCharacters(plugin, editor, screenplay),
  );
}

function renderProjectNavigation(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
  file: TFile,
): void {
  const project = projectForPart(plugin.app, file);
  if (project === null) return;
  const navigation = container.createDiv({
    cls: "firstdraft-palette-actions",
  });
  for (const [label, offset] of [
    ["Previous Part", -1],
    ["Next Part", 1],
  ] as const) {
    const button = navigation.createEl("button", {
      cls: "firstdraft-palette-action",
      text: label,
    });
    button.addEventListener(
      "click",
      () => void openAdjacentProjectPart(plugin.app, file, offset),
    );
  }
  const projectButton = navigation.createEl("button", {
    cls: "firstdraft-palette-action",
    text: "Project note",
  });
  projectButton.addEventListener(
    "click",
    () => void plugin.app.workspace.getLeaf(false).openFile(project.file),
  );
}

function runAction(
  plugin: FirstDraftPlugin,
  action: PaletteAction,
  editor: Editor,
  screenplay: TFile,
): void {
  switch (action) {
    case "character":
      openCharacterPicker(plugin, editor);
      break;
    case "character-extension":
      openCharacterExtension(plugin, editor);
      break;
    case "character-page":
      openCharacterDossier(plugin, editor, screenplay);
      break;
    case "parenthetical":
      openParenthetical(plugin, editor);
      break;
    case "new-scene":
      openNewScene(plugin, editor);
      break;
    case "transition":
      openTransition(plugin, editor);
      break;
  }
}
