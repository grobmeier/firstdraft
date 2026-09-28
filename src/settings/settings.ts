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

import { PluginSettingTab } from "obsidian";
import type { App, SettingDefinitionItem } from "obsidian";
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

function isSettingKey(key: string): key is keyof FirstDraftSettings {
  return key in DEFAULT_SETTINGS;
}

export class FirstDraftSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: FirstDraftPlugin,
  ) {
    super(app, plugin);
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: "Open .fountain files in screenplay mode",
        desc: "Automatically activate First Draft for Fountain files.",
        control: {
          type: "toggle",
          key: "activateFountainFiles",
          defaultValue: DEFAULT_SETTINGS.activateFountainFiles,
        },
      },
      {
        name: "Use screenplay frontmatter",
        desc: "Activate First Draft for Markdown notes with screenplay: true.",
        control: {
          type: "toggle",
          key: "activateFrontmatter",
          defaultValue: DEFAULT_SETTINGS.activateFrontmatter,
        },
      },
      {
        name: "Status bar",
        desc: "Show current screenplay measurements in the status bar.",
        control: {
          type: "toggle",
          key: "statusBarEnabled",
          defaultValue: DEFAULT_SETTINGS.statusBarEnabled,
        },
      },
      {
        name: "Show estimated pages",
        desc: "Include the approximate formatted screenplay length.",
        control: {
          type: "toggle",
          key: "showEstimatedPages",
          defaultValue: DEFAULT_SETTINGS.showEstimatedPages,
        },
      },
      {
        name: "Show estimated runtime",
        desc: "Include runtime derived from pages and the ratio below.",
        control: {
          type: "toggle",
          key: "showEstimatedRuntime",
          defaultValue: DEFAULT_SETTINGS.showEstimatedRuntime,
        },
      },
      {
        name: "Show word count",
        desc: "Include screenplay words in the status bar.",
        control: {
          type: "toggle",
          key: "showWordCount",
          defaultValue: DEFAULT_SETTINGS.showWordCount,
        },
      },
      {
        name: "Show scene count",
        desc: "Include detected scene headings in the status bar.",
        control: {
          type: "toggle",
          key: "showSceneCount",
          defaultValue: DEFAULT_SETTINGS.showSceneCount,
        },
      },
      {
        name: "Page size",
        desc: "Formatting assumption used for estimated pages.",
        control: {
          type: "dropdown",
          key: "pageSize",
          options: { "us-letter": "US Letter", a4: "A4" },
          defaultValue: DEFAULT_SETTINGS.pageSize,
        },
      },
      {
        name: "Minutes per page",
        desc: "Runtime estimate ratio. The screenplay convention is 1.0.",
        control: {
          type: "slider",
          key: "minutesPerPage",
          min: 0.5,
          max: 2,
          step: 0.1,
          defaultValue: DEFAULT_SETTINGS.minutesPerPage,
          displayFormat: (value) => value.toFixed(1),
        },
      },
      {
        name: "Autocomplete",
        desc: "Suggest screenplay elements while typing in Screenplay Mode.",
        control: {
          type: "toggle",
          key: "autocompleteEnabled",
          defaultValue: DEFAULT_SETTINGS.autocompleteEnabled,
        },
      },
      {
        name: "Recent-item weighting",
        desc: "Balance frequency (left) against recency (right).",
        control: {
          type: "slider",
          key: "recentItemsWeighting",
          min: 0,
          max: 1,
          step: 0.05,
          defaultValue: DEFAULT_SETTINGS.recentItemsWeighting,
          displayFormat: (value) => value.toFixed(2),
        },
      },
      {
        name: "Maximum autocomplete suggestions",
        desc: "Limit the number of First Draft suggestions shown at once.",
        control: {
          type: "slider",
          key: "maximumSuggestions",
          min: 3,
          max: 20,
          step: 1,
          defaultValue: DEFAULT_SETTINGS.maximumSuggestions,
          displayFormat: (value) => String(value),
        },
      },
      {
        name: "Character pages folder",
        desc: "Folder relative to the screenplay or project note. Start with / for a vault-relative folder; projects can override it with character-folder.",
        control: {
          type: "text",
          key: "characterFolder",
          placeholder: "Characters",
          defaultValue: DEFAULT_SETTINGS.characterFolder,
          validate: (value) =>
            value.trim() && value.trim() !== "/"
              ? undefined
              : "Choose a folder name other than the vault root.",
        },
      },
      {
        name: "Preferred scene types",
        desc: "Comma-separated values shown by New Scene, in order.",
        control: {
          type: "textarea",
          key: "preferredSceneTypes",
          rows: 2,
          validate: (value) =>
            valuesFromText(value).length > 0
              ? undefined
              : "Enter at least one scene type.",
        },
      },
      {
        name: "Preferred times of day",
        desc: "Comma-separated values shown by New Scene, in order.",
        control: {
          type: "textarea",
          key: "preferredTimesOfDay",
          rows: 3,
          validate: (value) =>
            valuesFromText(value).length > 0
              ? undefined
              : "Enter at least one time of day.",
        },
      },
    ];
  }

  getControlValue(key: string): unknown {
    if (!isSettingKey(key)) return undefined;
    const value = this.plugin.settings[key];
    return Array.isArray(value) ? value.join(", ") : value;
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    if (!isSettingKey(key)) return;

    if (key === "preferredSceneTypes" || key === "preferredTimesOfDay") {
      if (typeof value !== "string") return;
      const values = valuesFromText(value);
      if (values.length === 0) return;
      this.plugin.settings[key] = values;
    } else if (key === "characterFolder") {
      if (typeof value !== "string") return;
      const folder = value.trim().replace(/\/+$/gu, "");
      if (!folder || folder === "/") return;
      this.plugin.settings.characterFolder = folder;
    } else if (key === "pageSize") {
      if (value !== "us-letter" && value !== "a4") return;
      this.plugin.settings.pageSize = value;
    } else if (typeof DEFAULT_SETTINGS[key] === "boolean") {
      if (typeof value !== "boolean") return;
      this.setBooleanSetting(key, value);
    } else if (typeof DEFAULT_SETTINGS[key] === "number") {
      if (typeof value !== "number") return;
      this.setNumberSetting(key, value);
    } else {
      return;
    }

    await this.plugin.saveSettings();
    if (
      key === "activateFountainFiles" ||
      key === "activateFrontmatter" ||
      key === "statusBarEnabled" ||
      key === "showEstimatedPages" ||
      key === "showEstimatedRuntime" ||
      key === "showWordCount" ||
      key === "showSceneCount" ||
      key === "pageSize" ||
      key === "minutesPerPage"
    ) {
      this.plugin.refreshStatus();
    }
  }

  private setBooleanSetting(
    key: keyof FirstDraftSettings,
    value: boolean,
  ): void {
    switch (key) {
      case "activateFountainFiles":
      case "activateFrontmatter":
      case "autocompleteEnabled":
      case "statusBarEnabled":
      case "showEstimatedPages":
      case "showEstimatedRuntime":
      case "showWordCount":
      case "showSceneCount":
        this.plugin.settings[key] = value;
    }
  }

  private setNumberSetting(key: keyof FirstDraftSettings, value: number): void {
    switch (key) {
      case "recentItemsWeighting":
      case "maximumSuggestions":
      case "minutesPerPage":
      case "updateDelayMs":
        this.plugin.settings[key] = value;
    }
  }
}
