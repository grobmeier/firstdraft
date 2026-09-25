import { PluginSettingTab, Setting } from "obsidian";
import type { App } from "obsidian";
import type FirstDraftPlugin from "../main";
import {
  DEFAULT_SCENE_TYPES,
  DEFAULT_TIMES_OF_DAY,
} from "../screenplay/fountain";

export interface FirstDraftSettings {
  activateFountainFiles: boolean;
  activateFrontmatter: boolean;
  autocompleteEnabled: boolean;
  recentItemsWeighting: number;
  maximumSuggestions: number;
  preferredSceneTypes: string[];
  preferredTimesOfDay: string[];
  updateDelayMs: number;
}

export const DEFAULT_SETTINGS: FirstDraftSettings = {
  activateFountainFiles: true,
  activateFrontmatter: true,
  autocompleteEnabled: true,
  recentItemsWeighting: 0.65,
  maximumSuggestions: 8,
  preferredSceneTypes: DEFAULT_SCENE_TYPES,
  preferredTimesOfDay: DEFAULT_TIMES_OF_DAY,
  updateDelayMs: 300,
};

function valuesFromText(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

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

    new Setting(this.containerEl)
      .setName("Autocomplete")
      .setDesc("Suggest screenplay elements while typing in Screenplay Mode.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autocompleteEnabled)
          .onChange(async (value) => {
            this.plugin.settings.autocompleteEnabled = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(this.containerEl)
      .setName("Recent-item weighting")
      .setDesc("Balance frequency (left) against recency (right).")
      .addSlider((slider) =>
        slider
          .setLimits(0, 1, 0.05)
          .setDynamicTooltip()
          .setValue(this.plugin.settings.recentItemsWeighting)
          .onChange(async (value) => {
            this.plugin.settings.recentItemsWeighting = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(this.containerEl)
      .setName("Maximum autocomplete suggestions")
      .setDesc("Limit the number of First Draft suggestions shown at once.")
      .addSlider((slider) =>
        slider
          .setLimits(3, 20, 1)
          .setDynamicTooltip()
          .setValue(this.plugin.settings.maximumSuggestions)
          .onChange(async (value) => {
            this.plugin.settings.maximumSuggestions = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(this.containerEl)
      .setName("Preferred scene types")
      .setDesc("Comma-separated values shown by New Scene, in order.")
      .addTextArea((text) => {
        text.inputEl.rows = 2;
        text
          .setValue(this.plugin.settings.preferredSceneTypes.join(", "))
          .onChange(async (value) => {
            const values = valuesFromText(value);
            if (values.length === 0) return;
            this.plugin.settings.preferredSceneTypes = values;
            await this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName("Preferred times of day")
      .setDesc("Comma-separated values shown by New Scene, in order.")
      .addTextArea((text) => {
        text.inputEl.rows = 3;
        text
          .setValue(this.plugin.settings.preferredTimesOfDay.join(", "))
          .onChange(async (value) => {
            const values = valuesFromText(value);
            if (values.length === 0) return;
            this.plugin.settings.preferredTimesOfDay = values;
            await this.plugin.saveSettings();
          });
      });
  }
}
