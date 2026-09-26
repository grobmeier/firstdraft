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
import { checkCharacters } from "./commands/checkCharacters";
import { openNewScene } from "./commands/newScene";
import { openParenthetical } from "./commands/parenthetical";
import { openTransition } from "./commands/transition";
import { createScreenplayCompletionExtension } from "./editor/completion";
import { isScreenplayMode } from "./screenplay/mode";
import { parseFountain } from "./screenplay/parser";
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
import { StatisticsModal } from "./ui/statisticsModal";

export default class FirstDraftPlugin extends Plugin {
  settings: FirstDraftSettings = { ...DEFAULT_SETTINGS };
  private statusBarItem: HTMLElement | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

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
    this.addRibbonIcon("clapperboard", "Open First Draft Palette", () => {
      void this.openPalette();
    });

    this.addCommand({
      id: "open-first-draft-palette",
      name: "Screenplay: Open First Draft Palette",
      callback: () => void this.openPalette(),
    });

    this.addCommand({
      id: "screenplay-new-scene",
      name: "Screenplay: New Scene",
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
      id: "screenplay-check-characters",
      name: "Screenplay: Check Characters",
      editorCheckCallback: (checking, editor, context) => {
        if (!this.isScreenplayFile(context.file) || context.file === null) {
          return false;
        }
        if (!checking) checkCharacters(this, editor, context.file);
        return true;
      },
    });
    this.addCommand({
      id: "screenplay-character-page",
      name: "Screenplay: Open or Create Character Page",
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
      name: "Screenplay: Character Extension",
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
      name: "Screenplay: Show Statistics",
      checkCallback: (checking) => {
        const view = this.activeMarkdownView();
        if (view === null || !this.isScreenplayFile(view.file)) return false;
        if (!checking) {
          new StatisticsModal(this.app, this.statisticsFor(view)).open();
        }
        return true;
      },
    });
    this.addCommand({
      id: "screenplay-export-fountain",
      name: "Screenplay: Export to Fountain",
      checkCallback: (checking) => {
        const view = this.activeMarkdownView();
        if (view === null || !this.isScreenplayFile(view.file)) return false;
        if (!checking) void exportFountain(this, view);
        return true;
      },
    });
    this.addCommand({
      id: "screenplay-export-final-draft-fdx",
      name: "Screenplay: Export to Final Draft FDX",
      checkCallback: (checking) => {
        const view = this.activeMarkdownView();
        if (view === null || !this.isScreenplayFile(view.file)) return false;
        if (!checking) void exportFdx(this, view);
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
    if (this.refreshTimer !== null) clearTimeout(this.refreshTimer);
    this.app.workspace.detachLeavesOfType(FIRST_DRAFT_PALETTE_VIEW_TYPE);
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

  refreshStatus(): void {
    this.refreshPalettes();
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (!this.settings.statusBarEnabled) {
      this.statusBarItem?.hide();
      return;
    }

    const view = this.activeMarkdownView();
    const file = view?.file ?? null;
    if (view === null || !this.isScreenplayFile(file)) {
      this.statusBarItem?.hide();
      return;
    }

    const statistics = this.statisticsFor(view);
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

  private scheduleRefresh(): void {
    if (this.refreshTimer !== null) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(
      () => this.refreshStatus(),
      this.settings.updateDelayMs,
    );
  }

  private statisticsFor(view: MarkdownView) {
    return calculateStatistics(parseFountain(view.editor.getValue()), {
      pageSize: this.settings.pageSize,
      minutesPerPage: this.settings.minutesPerPage,
    });
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
}
