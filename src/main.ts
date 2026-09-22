import { MarkdownView, Plugin } from "obsidian";
import type { TFile } from "obsidian";
import { isScreenplayMode } from "./screenplay/mode";
import { parseFountain } from "./screenplay/parser";
import { calculateStatistics } from "./screenplay/statistics";
import {
  DEFAULT_SETTINGS,
  FirstDraftSettingTab,
  type FirstDraftSettings,
} from "./settings/settings";

export default class FirstDraftPlugin extends Plugin {
  settings: FirstDraftSettings = { ...DEFAULT_SETTINGS };
  private statusBarItem: HTMLElement | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerExtensions(["fountain"], "markdown");
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.addClass("firstdraft-status");
    this.addSettingTab(new FirstDraftSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.scheduleRefresh()),
    );
    this.registerEvent(
      this.app.workspace.on("editor-change", () => this.scheduleRefresh()),
    );
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (file === this.activeFile()) this.scheduleRefresh();
      }),
    );

    this.app.workspace.onLayoutReady(() => this.refreshStatus());
  }

  onunload(): void {
    if (this.refreshTimer !== null) clearTimeout(this.refreshTimer);
  }

  async loadSettings(): Promise<void> {
    const stored =
      (await this.loadData()) as Partial<FirstDraftSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  refreshStatus(): void {
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const file = view?.file ?? null;
    const frontmatter = file
      ? this.app.metadataCache.getFileCache(file)?.frontmatter
      : undefined;

    if (view === null || !isScreenplayMode(file, frontmatter, this.settings)) {
      this.statusBarItem?.hide();
      return;
    }

    const statistics = calculateStatistics(
      parseFountain(view.editor.getValue()),
    );
    this.statusBarItem?.setText(
      `Screenplay · ${statistics.words.toLocaleString()} words · ${statistics.scenes} scenes`,
    );
    this.statusBarItem?.setAttribute(
      "aria-label",
      `First Draft screenplay statistics: ${statistics.words} words, ${statistics.scenes} scenes`,
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

  private activeFile(): TFile | null {
    return this.app.workspace.getActiveFile();
  }
}
