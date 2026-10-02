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

import { ItemView } from "obsidian";
import type { IconName, WorkspaceLeaf } from "obsidian";
import type FirstDraftPlugin from "../main";
import { renderFirstDraftPalette } from "./palette/paletteRenderer";
import { renderSceneWorkspace } from "./sceneWorkspace";
import { EMPTY_SCENE_FILTERS } from "../scenes/model";

export const FIRST_DRAFT_PALETTE_VIEW_TYPE = "firstdraft-palette";

export class FirstDraftPaletteView extends ItemView {
  private query = "";
  private renderGeneration = 0;
  private sceneFilters = { ...EMPTY_SCENE_FILTERS };

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: FirstDraftPlugin,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return FIRST_DRAFT_PALETTE_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "First Draft palette";
  }

  getIcon(): IconName {
    return "clapperboard";
  }

  async onOpen(): Promise<void> {
    this.contentEl.addClass("firstdraft-palette");
    this.refresh();
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }

  refresh(): void {
    const generation = ++this.renderGeneration;
    if (this.plugin.sceneWorkspaceMode) {
      void renderSceneWorkspace(
        this.plugin,
        this.contentEl,
        this.sceneFilters,
        () => generation === this.renderGeneration,
        () => this.refresh(),
      );
      return;
    }
    renderFirstDraftPalette(this.plugin, this.contentEl, {
      getQuery: () => this.query,
      setQuery: (query) => {
        this.query = query;
      },
      isCurrent: () => generation === this.renderGeneration,
    });
  }
}
