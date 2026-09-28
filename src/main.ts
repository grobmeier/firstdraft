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

import { MarkdownView, Plugin } from "obsidian";
import type { TFile } from "obsidian";
import { openCharacterPicker } from "./commands/character";
import { exportFdx } from "./commands/exportFdx";
import { exportFountain } from "./commands/exportFountain";
import {
  isLikelyCharacterCue,
  openCharacterExtension,
} from "./commands/characterExtension";
import { openCharacterDossier } from "./commands/characterPage";
import { openCharacterGraph } from "./commands/characterGraph";
import { checkCharacters } from "./commands/checkCharacters";
import { createExampleScreenplay } from "./commands/createExample";
import { openNewScene } from "./commands/newScene";
import { openParenthetical } from "./commands/parenthetical";
import { openTransition } from "./commands/transition";
import { createScreenplayCompletionExtension } from "./editor/completion";
import { isCharacterFrontmatter } from "./characters/catalogue";
import {
  loadScreenplayContext,
  openAdjacentProjectPart,
  projectForFile,
  projectForPart,
} from "./projects/vault";
import { isScreenplayProjectFrontmatter } from "./projects/model";
import { isScreenplayMode } from "./screenplay/mode";
import { calculateStatistics } from "./screenplay/statistics";
import { formatScreenplayStatus } from "./screenplay/status";
import {
  DEFAULT_SETTINGS,
  FirstDraftSettingTab,
  type FirstDraftSettings,
} from "./settings/settings";
import {
  FIRST_DRAFT_PALETTE_VIEW_TYPE,
  FirstDraftPaletteView,
} from "./ui/firstDraftPaletteView";
import { CheatSheetModal } from "./ui/cheatSheetModal";
import { StatisticsModal } from "./ui/statisticsModal";

export default class FirstDraftPlugin extends Plugin {
  settings: FirstDraftSettings = { ...DEFAULT_SETTINGS };
  private statusBarItem: HTMLElement | null = null;
  private refreshTimer: number | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerExtensions(["fountain"], "markdown");
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.addClass("firstdraft-status");
    this.statusBarItem.hide();
    this.addSettingTab(new FirstDraftSettingTab(this.app, this));
    this.registerEditorExtension(createScreenplayCompletionExtension(this));
    this.registerView(
      FIRST_DRAFT_PALETTE_VIEW_TYPE,
      (leaf) => new FirstDraftPaletteView(leaf, this),
    );
    this.addRibbonIcon("clapperboard", "Open First Draft palette", () => {
      void this.openPalette();
    });

    this.addCommand({
      id: "open-first-draft-palette",
      name: "Open palette",
      callback: () => void this.openPalette(),
    });

    this.addCommand({
      id: "create-example-screenplay",
      name: "Create example screenplay",
      callback: () => void createExampleScreenplay(this),
    });

    this.addCommand({
      id: "open-screenplay-cheat-sheet",
      name: "Open screenplay cheat sheet",
      callback: () => new CheatSheetModal(this.app).open(),
    });

    this.addCommand({
      id: "screenplay-new-scene",
      name: "Screenplay: New scene",
      editorCheckCallback: (checking, editor, context) => {
        if (!this.isScreenplayFile(context.file)) return false;
        if (!checking) openNewScene(this, editor);
        return true;
      },
    });
    this.addCommand({
      id: "screenplay-character",
      name: "Screenplay: Character",
      editorCheckCallback: (checking, editor, context) => {
        if (!this.isScreenplayFile(context.file)) return false;
        if (!checking) openCharacterPicker(this, editor);
        return true;
      },
    });
    this.addCommand({
      id: "character-open-local-graph",
      name: "Character: Open local graph",
      checkCallback: (checking) => {
        const file = this.activeFile();
        if (!this.isCharacterFile(file) || file === null) return false;
        if (!checking) void openCharacterGraph(this, file);
        return true;
      },
    });
    this.addCommand({
      id: "screenplay-check-characters",
      name: "Screenplay: Check characters",
      checkCallback: (checking) => {
        const view = this.activeMarkdownView();
        if (
          view?.file === null ||
          view === null ||
          (!this.isScreenplayFile(view.file) && !this.isProjectFile(view.file))
        )
          return false;
        if (!checking) checkCharacters(this, view.editor, view.file);
        return true;
      },
    });
    this.addCommand({
      id: "screenplay-character-page",
      name: "Screenplay: Open or create character page",
      editorCheckCallback: (checking, editor, context) => {
        if (!this.isScreenplayFile(context.file) || context.file === null) {
          return false;
        }
        if (!checking) openCharacterDossier(this, editor, context.file);
        return true;
      },
    });
    this.addCommand({
      id: "screenplay-character-extension",
      name: "Screenplay: Character extension",
      editorCheckCallback: (checking, editor, context) => {
        if (
          !this.isScreenplayFile(context.file) ||
          !isLikelyCharacterCue(editor.getLine(editor.getCursor().line))
        ) {
          return false;
        }
        if (!checking) openCharacterExtension(this, editor);
        return true;
      },
    });
    this.addCommand({
      id: "screenplay-parenthetical",
      name: "Screenplay: Parenthetical",
      editorCheckCallback: (checking, editor, context) => {
        if (!this.isScreenplayFile(context.file)) return false;
        if (!checking) openParenthetical(this, editor);
        return true;
      },
    });
    this.addCommand({
      id: "screenplay-transition",
      name: "Screenplay: Transition",
      editorCheckCallback: (checking, editor, context) => {
        if (!this.isScreenplayFile(context.file)) return false;
        if (!checking) openTransition(this, editor);
        return true;
      },
    });
    this.addCommand({
      id: "screenplay-show-statistics",
      name: "Screenplay: Show statistics",
      checkCallback: (checking) => {
        const view = this.activeMarkdownView();
        if (
          view === null ||
          (!this.isScreenplayFile(view.file) && !this.isProjectFile(view.file))
        )
          return false;
        if (!checking) void this.showStatistics(view);
        return true;
      },
    });
    this.addCommand({
      id: "screenplay-export-fountain",
      name: "Screenplay: Export to Fountain",
      checkCallback: (checking) => {
        const view = this.activeMarkdownView();
        if (
          view === null ||
          (!this.isScreenplayFile(view.file) && !this.isProjectFile(view.file))
        )
          return false;
        if (!checking) void exportFountain(this, view);
        return true;
      },
    });
    this.addCommand({
      id: "screenplay-export-final-draft-fdx",
      name: "Screenplay: Export to Final Draft FDX",
      checkCallback: (checking) => {
        const view = this.activeMarkdownView();
        if (
          view === null ||
          (!this.isScreenplayFile(view.file) && !this.isProjectFile(view.file))
        )
          return false;
        if (!checking) void exportFdx(this, view);
        return true;
      },
    });

    this.addCommand({
      id: "screenplay-project-previous-part",
      name: "Screenplay project: Previous part",
      checkCallback: (checking) => {
        const file = this.activeFile();
        if (file === null || projectForPart(this.app, file) === null)
          return false;
        if (!checking) void openAdjacentProjectPart(this.app, file, -1);
        return true;
      },
    });
    this.addCommand({
      id: "screenplay-project-next-part",
      name: "Screenplay project: Next part",
      checkCallback: (checking) => {
        const file = this.activeFile();
        if (file === null || projectForPart(this.app, file) === null)
          return false;
        if (!checking) void openAdjacentProjectPart(this.app, file, 1);
        return true;
      },
    });
    this.addCommand({
      id: "screenplay-project-open-project-note",
      name: "Screenplay project: Open project note",
      checkCallback: (checking) => {
        const file = this.activeFile();
        const project = file ? projectForPart(this.app, file) : null;
        if (project === null) return false;
        if (!checking)
          void this.app.workspace.getLeaf(false).openFile(project.file);
        return true;
      },
    });

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.scheduleRefresh()),
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => this.scheduleRefresh()),
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.scheduleRefresh()),
    );
    this.registerEvent(
      this.app.workspace.on("editor-change", () => this.scheduleRefresh()),
    );
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (file === this.activeFile()) this.scheduleRefresh();
      }),
    );
    this.registerDomEvent(document, "selectionchange", () => {
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement &&
        activeElement.closest(".cm-editor")
      ) {
        this.scheduleRefresh();
      }
    });

    this.app.workspace.onLayoutReady(() => this.scheduleRefresh());
  }

  onunload(): void {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.clearProjectViewClasses();
  }

  async loadSettings(): Promise<void> {
    const stored =
      (await this.loadData()) as Partial<FirstDraftSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  isScreenplayFile(file: TFile | null): boolean {
    const frontmatter = file
      ? this.app.metadataCache.getFileCache(file)?.frontmatter
      : undefined;
    return isScreenplayMode(file, frontmatter, this.settings);
  }

  isCharacterFile(file: TFile | null): boolean {
    if (file === null || file.extension !== "md") return false;
    const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
    return isCharacterFrontmatter(frontmatter);
  }

  isProjectFile(file: TFile | null): boolean {
    if (file === null || file.extension !== "md") return false;
    const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
    return isScreenplayProjectFrontmatter(frontmatter);
  }

  refreshStatus(): void {
    this.refreshProjectViewClasses();
    this.refreshPalettes();
    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (!this.settings.statusBarEnabled) {
      this.statusBarItem?.hide();
      return;
    }

    const view = this.activeMarkdownView();
    const file = view?.file ?? null;
    if (
      view === null ||
      (!this.isScreenplayFile(file) && !this.isProjectFile(file))
    ) {
      this.statusBarItem?.hide();
      return;
    }

    void this.refreshStatusFor(view);
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(
      () => this.refreshStatus(),
      this.settings.updateDelayMs,
    );
  }

  private async statisticsFor(view: MarkdownView) {
    const file = view.file;
    if (file === null) return null;
    const context = await loadScreenplayContext(
      this.app,
      file,
      this.settings.characterFolder,
      this.isScreenplayFile(file) ? view.editor.getValue() : undefined,
    );
    return calculateStatistics(context.document, {
      pageSize: this.settings.pageSize,
      minutesPerPage: this.settings.minutesPerPage,
    });
  }

  private async showStatistics(view: MarkdownView): Promise<void> {
    const statistics = await this.statisticsFor(view);
    if (statistics) new StatisticsModal(this.app, statistics).open();
  }

  private async refreshStatusFor(view: MarkdownView): Promise<void> {
    const file = view.file;
    const statistics = await this.statisticsFor(view);
    if (
      statistics === null ||
      file === null ||
      file !== this.activeFile() ||
      (projectForFile(this.app, file) === null && !this.isScreenplayFile(file))
    )
      return;
    const status = formatScreenplayStatus(statistics, {
      estimatedPages: this.settings.showEstimatedPages,
      estimatedRuntime: this.settings.showEstimatedRuntime,
      words: this.settings.showWordCount,
      scenes: this.settings.showSceneCount,
    });
    this.statusBarItem?.setText(status);
    this.statusBarItem?.setAttribute(
      "aria-label",
      `First Draft screenplay statistics: ${status}`,
    );
    this.statusBarItem?.show();
  }

  async openPalette(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(
      FIRST_DRAFT_PALETTE_VIEW_TYPE,
    )[0];
    if (existing) {
      await this.app.workspace.revealLeaf(existing);
      return;
    }

    const leaf = this.app.workspace.getRightLeaf(true);
    if (leaf === null) return;
    await leaf.setViewState({
      type: FIRST_DRAFT_PALETTE_VIEW_TYPE,
      active: true,
    });
    await this.app.workspace.revealLeaf(leaf);
  }

  activeMarkdownView(): MarkdownView | null {
    const direct = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (direct !== null) return direct;

    const activeFile = this.activeFile();
    if (activeFile === null) return null;

    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      if (leaf.view instanceof MarkdownView && leaf.view.file === activeFile) {
        return leaf.view;
      }
    }

    return null;
  }

  private activeFile(): TFile | null {
    return this.app.workspace.getActiveFile();
  }

  private refreshPalettes(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(
      FIRST_DRAFT_PALETTE_VIEW_TYPE,
    )) {
      if (leaf.view instanceof FirstDraftPaletteView) leaf.view.refresh();
    }
  }

  private refreshProjectViewClasses(): void {
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      if (leaf.view instanceof MarkdownView) {
        leaf.view.containerEl.classList.toggle(
          "firstdraft-project-note",
          this.isProjectFile(leaf.view.file),
        );
      }
    }
  }

  private clearProjectViewClasses(): void {
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      if (leaf.view instanceof MarkdownView) {
        leaf.view.containerEl.classList.remove("firstdraft-project-note");
      }
    }
  }
}
