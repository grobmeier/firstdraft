import { PluginSettingTab, Setting } from "obsidian";
import type { App } from "obsidian";
import type FirstDraftPlugin from "../main";

export interface FirstDraftSettings {
  activateFountainFiles: boolean;
  activateFrontmatter: boolean;
  updateDelayMs: number;
}

export const DEFAULT_SETTINGS: FirstDraftSettings = {
  activateFountainFiles: true,
  activateFrontmatter: true,
  updateDelayMs: 300,
};

export class FirstDraftSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: FirstDraftPlugin,
  ) {
    super(app, plugin);
  }

  display(): void {
    this.containerEl.empty();

    new Setting(this.containerEl)
      .setName("Open .fountain files in screenplay mode")
      .setDesc("Automatically activate First Draft for Fountain files.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.activateFountainFiles)
          .onChange(async (value) => {
            this.plugin.settings.activateFountainFiles = value;
            await this.plugin.saveSettings();
            this.plugin.refreshStatus();
          }),
      );

    new Setting(this.containerEl)
      .setName("Use screenplay frontmatter")
      .setDesc("Activate First Draft for Markdown notes with screenplay: true.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.activateFrontmatter)
          .onChange(async (value) => {
            this.plugin.settings.activateFrontmatter = value;
            await this.plugin.saveSettings();
            this.plugin.refreshStatus();
          }),
      );
  }
}
