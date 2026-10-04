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

import { createExampleScreenplay } from "../../commands/createExample";
import { activateScreenplayNote } from "../../commands/activateScreenplay";
import type FirstDraftPlugin from "../../main";
import { CheatSheetModal } from "../cheatSheetModal";
import { renderCharacterPalette } from "./characterPalette";
import { renderProjectPalette } from "./projectPalette";
import type { PaletteRenderState } from "./recentPalette";
import { renderScreenplayPalette } from "./screenplayPalette";

export function renderFirstDraftPalette(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
  state: PaletteRenderState,
): void {
  container.empty();
  container.createEl("h2", { text: "First Draft" });
  renderGlobalActions(plugin, container);

  const view = plugin.activeMarkdownView();
  if (view?.file && plugin.isCharacterFile(view.file)) {
    renderCharacterPalette(plugin, container, view.file, state.isCurrent);
    return;
  }
  if (view?.file && plugin.isProjectFile(view.file)) {
    renderProjectPalette(plugin, container, view.editor, view.file, state);
    return;
  }
  if (
    view === null ||
    view.file === null ||
    !plugin.isScreenplayFile(view.file)
  ) {
    renderEmptyPalette(plugin, container);
    return;
  }

  renderScreenplayPalette(plugin, container, view.editor, view.file, state);
}

function renderGlobalActions(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
): void {
  const actions = container.createDiv({
    cls: "firstdraft-palette-global-actions",
  });
  const scenes = actions.createEl("button", {
    cls: "firstdraft-palette-action",
    text: "Scenes",
  });
  scenes.addEventListener("click", () => {
    void plugin.openSceneWorkspace();
  });
  const inspect = actions.createEl("button", {
    cls: "firstdraft-palette-action",
    text: "Inspect continuity",
  });
  inspect.addEventListener("click", () => plugin.openContinuityInspector());
  const cheatSheet = actions.createEl("button", {
    cls: "firstdraft-palette-action",
    text: "Cheat sheet",
  });
  cheatSheet.addEventListener("click", () => {
    new CheatSheetModal(plugin.app).open();
  });
}

function renderEmptyPalette(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
): void {
  const file = plugin.activeMarkdownView()?.file;
  const eligible =
    file?.extension === "md" &&
    !plugin.isCharacterFile(file) &&
    !plugin.isProjectFile(file);
  container.createEl("p", {
    cls: "firstdraft-palette-empty",
    text: eligible
      ? "Use this note as a screenplay to unlock writing actions. This adds screenplay: true to its properties; your text is not converted or reformatted."
      : "Open a Markdown note to enable screenplay mode, or try an example below.",
  });
  const actions = container.createDiv({
    cls: "firstdraft-palette-actions firstdraft-palette-onboarding-actions",
  });
  if (eligible) {
    const activate = actions.createEl("button", {
      cls: "firstdraft-palette-action",
      text: "Use this note as a screenplay",
    });
    activate.disabled = !plugin.settings.activateFrontmatter;
    if (activate.disabled) {
      container.createEl("p", {
        text: 'In First Draft settings, enable "use screenplay frontmatter" to use this action.',
      });
    }
    activate.addEventListener("click", () => {
      void activateScreenplayNote(plugin, file);
    });
  }
  const example = actions.createEl("button", {
    cls: "firstdraft-palette-action",
    text: "Create example screenplay",
  });
  example.addEventListener("click", () => void createExampleScreenplay(plugin));
}
