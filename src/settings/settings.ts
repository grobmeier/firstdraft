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

import { PluginSettingTab, Setting } from "obsidian";
import type { App } from "obsidian";
import type FirstDraftPlugin from "../main";
import type { PageSize } from "../screenplay/model";
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
  statusBarEnabled: boolean;
  showEstimatedPages: boolean;
  showEstimatedRuntime: boolean;
  showWordCount: boolean;
  showSceneCount: boolean;
  pageSize: PageSize;
  minutesPerPage: number;
  updateDelayMs: number;
  characterFolder: string;
}

export const DEFAULT_SETTINGS: FirstDraftSettings = {
  activateFountainFiles: true,
  activateFrontmatter: true,
  autocompleteEnabled: true,
  recentItemsWeighting: 0.65,
  maximumSuggestions: 8,
  preferredSceneTypes: DEFAULT_SCENE_TYPES,
  preferredTimesOfDay: DEFAULT_TIMES_OF_DAY,
  statusBarEnabled: true,
  showEstimatedPages: true,
  showEstimatedRuntime: true,
  showWordCount: true,
  showSceneCount: true,
  pageSize: "us-letter",
  minutesPerPage: 1,
  updateDelayMs: 300,
  characterFolder: "Characters",
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
      .setName("Status bar")
      .setDesc("Show current screenplay measurements in the status bar.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.statusBarEnabled)
          .onChange(async (value) => {
            this.plugin.settings.statusBarEnabled = value;
            await this.plugin.saveSettings();
            this.plugin.refreshStatus();
          }),
      );

    const statusFields: Array<{
      name: string;
      description: string;
      key:
        | "showEstimatedPages"
        | "showEstimatedRuntime"
        | "showWordCount"
        | "showSceneCount";
    }> = [
      {
        name: "Show estimated pages",
        description: "Include the approximate formatted screenplay length.",
        key: "showEstimatedPages",
      },
      {
        name: "Show estimated runtime",
        description: "Include runtime derived from pages and the ratio below.",
        key: "showEstimatedRuntime",
      },
      {
        name: "Show word count",
        description: "Include screenplay words in the status bar.",
        key: "showWordCount",
      },
      {
        name: "Show scene count",
        description: "Include detected scene headings in the status bar.",
        key: "showSceneCount",
      },
    ];

    for (const field of statusFields) {
      new Setting(this.containerEl)
        .setName(field.name)
        .setDesc(field.description)
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings[field.key])
            .onChange(async (value) => {
              this.plugin.settings[field.key] = value;
              await this.plugin.saveSettings();
              this.plugin.refreshStatus();
            }),
        );
    }

    new Setting(this.containerEl)
      .setName("Page size")
      .setDesc("Formatting assumption used for estimated pages.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("us-letter", "US Letter")
          .addOption("a4", "A4")
          .setValue(this.plugin.settings.pageSize)
          .onChange(async (value) => {
            this.plugin.settings.pageSize = value as PageSize;
            await this.plugin.saveSettings();
            this.plugin.refreshStatus();
          }),
      );

    new Setting(this.containerEl)
      .setName("Minutes per page")
      .setDesc("Runtime estimate ratio. The screenplay convention is 1.0.")
      .addSlider((slider) =>
        slider
          .setLimits(0.5, 2, 0.1)
          .setDynamicTooltip()
          .setValue(this.plugin.settings.minutesPerPage)
          .onChange(async (value) => {
            this.plugin.settings.minutesPerPage = value;
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
      .setName("Character pages folder")
      .setDesc(
        "Folder relative to the screenplay or project note. Start with / for a vault-relative folder; projects can override it with character-folder.",
      )
      .addText((text) =>
        text
          .setPlaceholder("Characters")
          .setValue(this.plugin.settings.characterFolder)
          .onChange(async (value) => {
            const folder = value.trim().replace(/\/+$/gu, "");
            if (!folder || folder === "/") return;
            this.plugin.settings.characterFolder = folder;
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
