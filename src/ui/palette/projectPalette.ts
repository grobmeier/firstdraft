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
import { checkCharacters } from "../../commands/checkCharacters";
import { exportFdx } from "../../commands/exportFdx";
import { exportFountain } from "../../commands/exportFountain";
import type FirstDraftPlugin from "../../main";
import {
  loadScreenplayContext,
  projectMembershipIssue,
} from "../../projects/vault";
import { calculateStatistics } from "../../screenplay/statistics";
import { StatisticsModal } from "../statisticsModal";
import { renderRecentPalette, type PaletteRenderState } from "./recentPalette";

export function renderProjectPalette(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
  editor: Editor,
  file: TFile,
  state: PaletteRenderState,
): void {
  const loading = container.createEl("p", {
    cls: "firstdraft-palette-muted",
    text: "Loading screenplay project…",
  });
  void renderProjectContext(plugin, container, loading, editor, file, state);
}

async function renderProjectContext(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
  loading: HTMLElement,
  editor: Editor,
  file: TFile,
  state: PaletteRenderState,
): Promise<void> {
  const context = await loadScreenplayContext(
    plugin.app,
    file,
    plugin.settings.characterFolder,
  );
  if (!state.isCurrent() || context.project === null) return;
  loading.remove();
  container.createEl("h3", { text: context.project.project.title });
  const issues = [...context.project.issues];
  for (const part of context.parts) {
    const issue = projectMembershipIssue(plugin.app, part);
    if (issue) issues.push(`${part.basename}: ${issue}`);
  }
  if (issues.length > 0) {
    const warning = container.createEl("ul", {
      cls: "firstdraft-palette-empty",
    });
    for (const issue of issues) warning.createEl("li", { text: issue });
  }
  container.createEl("h3", { text: "Parts" });
  const parts = container.createDiv({
    cls: "firstdraft-palette-items firstdraft-project-parts",
  });
  for (const [index, part] of context.project.parts.entries()) {
    const button = parts.createEl("button", {
      cls: "firstdraft-palette-item",
      text: `${index + 1}. ${part.file?.basename ?? part.link}`,
    });
    button.disabled = part.file === null;
    if (part.file) {
      const partFile = part.file;
      button.addEventListener(
        "click",
        () => void plugin.app.workspace.getLeaf(false).openFile(partFile),
      );
    }
  }
  renderProjectActions(plugin, container, editor, file, context.document);
  container.createEl("p", {
    cls: "firstdraft-palette-muted",
    text: `Character pages: ${context.characterFolder}`,
  });
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

function renderProjectActions(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
  editor: Editor,
  file: TFile,
  document: Parameters<typeof calculateStatistics>[0],
): void {
  const actions = container.createDiv({ cls: "firstdraft-palette-actions" });
  const addAction = (label: string, action: () => void): void => {
    const button = actions.createEl("button", {
      cls: "firstdraft-palette-action",
      text: label,
    });
    button.addEventListener("click", action);
  };
  addAction("Statistics", () => {
    new StatisticsModal(
      plugin.app,
      calculateStatistics(document, {
        pageSize: plugin.settings.pageSize,
        minutesPerPage: plugin.settings.minutesPerPage,
      }),
    ).open();
  });
  addAction("Check Characters", () => checkCharacters(plugin, editor, file));
  addAction("Export Fountain", () => {
    const view = plugin.activeMarkdownView();
    if (view) void exportFountain(plugin, view);
  });
  addAction("Export FDX", () => {
    const view = plugin.activeMarkdownView();
    if (view) void exportFdx(plugin, view);
  });
}
