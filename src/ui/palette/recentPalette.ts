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
import type { CharacterPage } from "../../characters/catalogue";
import { insertCharacter } from "../../commands/character";
import { openCharacterDossier } from "../../commands/characterPage";
import { openNewSceneAtLocation } from "../../commands/newScene";
import { insertParenthetical } from "../../commands/parenthetical";
import { insertTransition } from "../../commands/transition";
import type FirstDraftPlugin from "../../main";
import { buildScreenplayIndex, rankUsages } from "../../screenplay/indexer";
import type { ScreenplayDocument } from "../../screenplay/model";

export interface PaletteRenderState {
  getQuery: () => string;
  setQuery: (query: string) => void;
  isCurrent: () => boolean;
}

interface RecentSection {
  title: string;
  values: string[];
  insert: (value: string) => void;
  secondary?: (value: string) => void;
  secondaryLabel?: (value: string) => string;
}

export function renderRecentPalette(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
  editor: Editor,
  screenplay: TFile,
  document: ScreenplayDocument,
  pages: readonly CharacterPage[],
  state: PaletteRenderState,
): void {
  const index = buildScreenplayIndex(document);
  const limit = Math.min(6, plugin.settings.maximumSuggestions);
  const ranked = (values: typeof index.characters): string[] =>
    rankUsages(values, "", plugin.settings.recentItemsWeighting, limit).map(
      (usage) => usage.value,
    );
  const sections: RecentSection[] = [
    {
      title: "Characters",
      values: ranked(index.characters),
      insert: (value) => insertCharacter(editor, value),
      secondary: (value) =>
        openCharacterDossier(plugin, editor, screenplay, value),
      secondaryLabel: (value) => {
        const normalized = value.toLocaleUpperCase();
        const exists = pages.some(
          (page) =>
            page.character === normalized || page.aliases.includes(normalized),
        );
        return exists ? "Open page" : "Create page";
      },
    },
    {
      title: "Locations",
      values: ranked(index.locations),
      insert: (value) => openNewSceneAtLocation(plugin, editor, value),
    },
    {
      title: "Parentheticals",
      values: ranked(index.parentheticals),
      insert: (value) => insertParenthetical(editor, value),
    },
    {
      title: "Transitions",
      values: ranked(index.transitions),
      insert: (value) => insertTransition(editor, value),
    },
  ];

  container.createEl("h3", { text: "Recent" });
  const search = container.createEl("input", {
    cls: "firstdraft-palette-search",
    type: "search",
    placeholder: "Filter recent items",
    value: state.getQuery(),
  });
  const recent = container.createDiv({ cls: "firstdraft-palette-recent" });
  const renderSections = (): void => {
    recent.empty();
    const query = state.getQuery().trim().toLocaleLowerCase();
    let matches = 0;
    for (const section of sections) {
      const values = section.values.filter((value) =>
        value.toLocaleLowerCase().includes(query),
      );
      if (values.length === 0) continue;
      matches += values.length;
      const group = recent.createDiv({ cls: "firstdraft-palette-section" });
      group.createEl("h4", { text: section.title });
      const list = group.createDiv({ cls: "firstdraft-palette-items" });
      for (const value of values) {
        const item = list.createDiv({ cls: "firstdraft-palette-item-row" });
        const button = item.createEl("button", {
          cls: "firstdraft-palette-item",
          text: value,
          attr: { title: `Insert ${value}` },
        });
        button.addEventListener("click", () => section.insert(value));
        if (section.secondary && section.secondaryLabel) {
          const secondary = item.createEl("button", {
            cls: "firstdraft-palette-item-secondary",
            text: section.secondaryLabel(value),
          });
          secondary.addEventListener("click", () => section.secondary?.(value));
        }
      }
    }
    if (matches === 0) {
      recent.createEl("p", {
        cls: "firstdraft-palette-empty",
        text: query
          ? "No recent items match this filter."
          : "Recent items appear here as the screenplay grows.",
      });
    }
  };

  search.addEventListener("input", () => {
    state.setQuery(search.value);
    renderSections();
  });
  renderSections();
}
