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
import type { Editor, IconName, TFile, WorkspaceLeaf } from "obsidian";
import {
  characterPageFromFrontmatter,
  wikiLinkTarget,
  type CharacterPage,
} from "../characters/catalogue";
import { characterPagesForScope } from "../characters/vault";
import { characterDocumentUsage } from "../characters/usage";
import { openCharacterGraph } from "../commands/characterGraph";
import { insertCharacter, openCharacterPicker } from "../commands/character";
import { openCharacterExtension } from "../commands/characterExtension";
import { openCharacterDossier } from "../commands/characterPage";
import { checkCharacters } from "../commands/checkCharacters";
import { createExampleScreenplay } from "../commands/createExample";
import { exportFdx } from "../commands/exportFdx";
import { exportFountain } from "../commands/exportFountain";
import { openNewScene, openNewSceneAtLocation } from "../commands/newScene";
import {
  insertParenthetical,
  openParenthetical,
} from "../commands/parenthetical";
import { insertTransition, openTransition } from "../commands/transition";
import type FirstDraftPlugin from "../main";
import {
  loadScreenplayContext,
  openAdjacentProjectPart,
  projectForPart,
  projectMembershipIssue,
} from "../projects/vault";
import { buildScreenplayIndex, rankUsages } from "../screenplay/indexer";
import { parseFountain } from "../screenplay/parser";
import { calculateStatistics } from "../screenplay/statistics";
import type { ScreenplayDocument } from "../screenplay/model";
import { orderPaletteActions, type PaletteAction } from "./paletteModel";
import { StatisticsModal } from "./statisticsModal";
import { CheatSheetModal } from "./cheatSheetModal";

export const FIRST_DRAFT_PALETTE_VIEW_TYPE = "firstdraft-palette";

const ACTION_LABELS: Record<PaletteAction, string> = {
  character: "Character",
  "character-extension": "Character Extension",
  "character-page": "Character Page",
  parenthetical: "Parenthetical",
  "new-scene": "New Scene",
  transition: "Transition",
};

interface RecentSection {
  title: string;
  values: string[];
  insert: (value: string) => void;
  secondary?: (value: string) => void;
  secondaryLabel?: (value: string) => string;
}

export class FirstDraftPaletteView extends ItemView {
  private readonly plugin: FirstDraftPlugin;
  private query = "";
  private renderGeneration = 0;

  constructor(leaf: WorkspaceLeaf, plugin: FirstDraftPlugin) {
    super(leaf);
    this.plugin = plugin;
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
    this.render();
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }

  refresh(): void {
    this.render();
  }

  private render(): void {
    const generation = ++this.renderGeneration;
    const container = this.contentEl;
    container.empty();
    container.createEl("h2", { text: "First Draft" });
    const globalActions = container.createDiv({
      cls: "firstdraft-palette-global-actions",
    });
    const cheatSheet = globalActions.createEl("button", {
      cls: "firstdraft-palette-action",
      text: "Cheat sheet",
    });
    cheatSheet.addEventListener("click", () => {
      new CheatSheetModal(this.plugin.app).open();
    });

    const view = this.plugin.activeMarkdownView();
    if (view?.file && this.plugin.isCharacterFile(view.file)) {
      this.renderCharacterPage(container, view.file, generation);
      return;
    }
    if (view?.file && this.plugin.isProjectFile(view.file)) {
      this.renderProject(container, view.editor, view.file, generation);
      return;
    }
    if (
      view === null ||
      view.file === null ||
      !this.plugin.isScreenplayFile(view.file)
    ) {
      container.createEl("p", {
        cls: "firstdraft-palette-empty",
        text: "Open a screenplay note to use writing actions and recent elements.",
      });
      const actions = container.createDiv({
        cls: "firstdraft-palette-actions",
      });
      const example = actions.createEl("button", {
        cls: "firstdraft-palette-action",
        text: "Create example screenplay",
      });
      example.addEventListener(
        "click",
        () => void createExampleScreenplay(this.plugin),
      );
      return;
    }

    const editor = view.editor;
    const source = editor.getValue();
    const cursorOffset = editor.posToOffset(editor.getCursor());
    this.renderActions(container, editor, view.file, source, cursorOffset);
    this.renderProjectNavigation(container, view.file);
    const loading = container.createEl("p", {
      cls: "firstdraft-palette-muted",
      text: "Loading screenplay project…",
    });
    void this.renderRecentContext(
      container,
      loading,
      editor,
      view.file,
      source,
      generation,
    );
  }

  private renderCharacterPage(
    container: HTMLElement,
    file: TFile,
    generation: number,
  ): void {
    const frontmatter =
      this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
    const page = characterPageFromFrontmatter(file.path, frontmatter);
    if (page === null) return;

    container.createEl("h3", { text: page.character });
    if (page.aliases.length > 0) {
      container.createEl("p", {
        cls: "firstdraft-palette-muted",
        text: `Aliases: ${page.aliases.join(", ")}`,
      });
    }
    const graph = container.createEl("button", {
      cls: "mod-cta firstdraft-character-graph",
      text: "Open local graph",
    });
    graph.addEventListener(
      "click",
      () => void openCharacterGraph(this.plugin, file),
    );
    const usage = container.createEl("p", {
      cls: "firstdraft-palette-muted",
      text: "Calculating linked screenplay usage…",
    });
    void this.renderCharacterUsage(usage, page, generation);
    this.renderCharacterLinks(container, "Screenplays", page.screenplays, page);
    this.renderCharacterLinks(container, "Relationships", page.related, page);
    const appearances = container.createDiv();
    void this.renderCharacterAppearances(appearances, page, generation);
  }

  private async renderCharacterUsage(
    element: HTMLElement,
    page: CharacterPage,
    generation: number,
  ): Promise<void> {
    let cueAppearances = 0;
    let dialogueBlocks = 0;
    let scenes = 0;
    let screenplays = 0;
    for (const link of page.screenplays) {
      const file = this.plugin.app.metadataCache.getFirstLinkpathDest(
        wikiLinkTarget(link),
        page.path,
      );
      if (!file) continue;
      const context = await loadScreenplayContext(
        this.plugin.app,
        file,
        this.plugin.settings.characterFolder,
      );
      const usage = characterDocumentUsage(page, context.document);
      cueAppearances += usage.cueAppearances;
      dialogueBlocks += usage.dialogueBlocks;
      scenes += usage.scenes;
      screenplays += 1;
    }
    if (generation !== this.renderGeneration) return;
    element.setText(
      `${screenplays} linked screenplay${screenplays === 1 ? "" : "s"} · ` +
        `${scenes} scene${scenes === 1 ? "" : "s"} · ` +
        `${cueAppearances} cue${cueAppearances === 1 ? "" : "s"} · ` +
        `${dialogueBlocks} dialogue block${dialogueBlocks === 1 ? "" : "s"}`,
    );
  }

  private async renderCharacterAppearances(
    container: HTMLElement,
    page: CharacterPage,
    generation: number,
  ): Promise<void> {
    const appearances: Array<{ file: TFile; label: string; cues: number }> = [];
    const seen = new Set<string>();
    for (const link of page.screenplays) {
      const owner = this.plugin.app.metadataCache.getFirstLinkpathDest(
        wikiLinkTarget(link),
        page.path,
      );
      if (!owner) continue;
      const context = await loadScreenplayContext(
        this.plugin.app,
        owner,
        this.plugin.settings.characterFolder,
      );
      for (const part of context.parts) {
        if (seen.has(part.path)) continue;
        const source = await this.plugin.app.vault.cachedRead(part);
        const usage = characterDocumentUsage(page, parseFountain(source));
        if (usage.cueAppearances === 0) continue;
        seen.add(part.path);
        appearances.push({
          file: part,
          label: part.basename,
          cues: usage.cueAppearances,
        });
      }
    }
    if (generation !== this.renderGeneration || appearances.length === 0)
      return;
    container.createEl("h3", { text: "Appearances" });
    const list = container.createDiv({ cls: "firstdraft-palette-items" });
    for (const appearance of appearances) {
      const button = list.createEl("button", {
        cls: "firstdraft-palette-item",
        text: `${appearance.label} · ${appearance.cues} cue${appearance.cues === 1 ? "" : "s"}`,
      });
      button.addEventListener(
        "click",
        () =>
          void this.plugin.app.workspace
            .getLeaf(false)
            .openFile(appearance.file),
      );
    }
  }

  private renderProject(
    container: HTMLElement,
    editor: Editor,
    file: TFile,
    generation: number,
  ): void {
    const loading = container.createEl("p", {
      cls: "firstdraft-palette-muted",
      text: "Loading screenplay project…",
    });
    void this.renderProjectContext(
      container,
      loading,
      editor,
      file,
      generation,
    );
  }

  private async renderProjectContext(
    container: HTMLElement,
    loading: HTMLElement,
    editor: Editor,
    file: TFile,
    generation: number,
  ): Promise<void> {
    const context = await loadScreenplayContext(
      this.plugin.app,
      file,
      this.plugin.settings.characterFolder,
    );
    if (generation !== this.renderGeneration || context.project === null)
      return;
    loading.remove();
    container.createEl("h3", { text: context.project.project.title });
    const issues = [...context.project.issues];
    for (const part of context.parts) {
      const issue = projectMembershipIssue(this.plugin.app, part);
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
        button.addEventListener(
          "click",
          () =>
            void this.plugin.app.workspace.getLeaf(false).openFile(part.file!),
        );
      }
    }
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
        this.plugin.app,
        calculateStatistics(context.document, {
          pageSize: this.plugin.settings.pageSize,
          minutesPerPage: this.plugin.settings.minutesPerPage,
        }),
      ).open();
    });
    addAction("Check Characters", () =>
      checkCharacters(this.plugin, editor, file),
    );
    addAction("Export Fountain", () => {
      const view = this.plugin.activeMarkdownView();
      if (view) void exportFountain(this.plugin, view);
    });
    addAction("Export FDX", () => {
      const view = this.plugin.activeMarkdownView();
      if (view) void exportFdx(this.plugin, view);
    });
    container.createEl("p", {
      cls: "firstdraft-palette-muted",
      text: `Character pages: ${context.characterFolder}`,
    });
    this.renderRecent(
      container,
      editor,
      file,
      context.document,
      characterPagesForScope(this.plugin.app, context.scopeFiles),
    );
  }

  private renderProjectNavigation(container: HTMLElement, file: TFile): void {
    const project = projectForPart(this.plugin.app, file);
    if (project === null) return;
    const navigation = container.createDiv({
      cls: "firstdraft-palette-actions",
    });
    for (const [label, offset] of [
      ["Previous Part", -1],
      ["Next Part", 1],
    ] as const) {
      const button = navigation.createEl("button", {
        cls: "firstdraft-palette-action",
        text: label,
      });
      button.addEventListener(
        "click",
        () => void openAdjacentProjectPart(this.plugin.app, file, offset),
      );
    }
    const projectButton = navigation.createEl("button", {
      cls: "firstdraft-palette-action",
      text: "Project note",
    });
    projectButton.addEventListener(
      "click",
      () =>
        void this.plugin.app.workspace.getLeaf(false).openFile(project.file),
    );
  }

  private async renderRecentContext(
    container: HTMLElement,
    loading: HTMLElement,
    editor: Editor,
    file: TFile,
    source: string,
    generation: number,
  ): Promise<void> {
    const context = await loadScreenplayContext(
      this.plugin.app,
      file,
      this.plugin.settings.characterFolder,
      source,
    );
    if (generation !== this.renderGeneration) return;
    loading.remove();
    this.renderRecent(
      container,
      editor,
      file,
      context.document,
      characterPagesForScope(this.plugin.app, context.scopeFiles),
    );
  }

  private renderCharacterLinks(
    container: HTMLElement,
    heading: string,
    links: readonly string[],
    page: CharacterPage,
  ): void {
    container.createEl("h3", { text: heading });
    if (links.length === 0) {
      container.createEl("p", {
        cls: "firstdraft-palette-empty",
        text: `No ${heading.toLocaleLowerCase()} linked yet.`,
      });
      return;
    }
    const list = container.createDiv({ cls: "firstdraft-palette-items" });
    for (const link of links) {
      const target = wikiLinkTarget(link);
      const button = list.createEl("button", {
        cls: "firstdraft-palette-item",
        text: target.split("/").at(-1) ?? target,
      });
      button.addEventListener("click", () => {
        const file = this.plugin.app.metadataCache.getFirstLinkpathDest(
          target,
          page.path,
        );
        if (file) void this.plugin.app.workspace.getLeaf("tab").openFile(file);
      });
    }
  }

  private renderActions(
    container: HTMLElement,
    editor: Editor,
    screenplay: TFile,
    source: string,
    cursorOffset: number,
  ): void {
    container.createEl("h3", { text: "Actions" });
    const actions = container.createDiv({ cls: "firstdraft-palette-actions" });

    for (const action of orderPaletteActions(source, cursorOffset)) {
      const button = actions.createEl("button", {
        cls: "firstdraft-palette-action",
        text: ACTION_LABELS[action],
      });
      button.addEventListener("click", () =>
        this.runAction(action, editor, screenplay),
      );
    }
    const check = actions.createEl("button", {
      cls: "firstdraft-palette-action firstdraft-palette-check",
      text: "Check characters",
    });
    check.addEventListener("click", () =>
      checkCharacters(this.plugin, editor, screenplay),
    );
  }

  private renderRecent(
    container: HTMLElement,
    editor: Editor,
    screenplay: TFile,
    document: ScreenplayDocument,
    pages: readonly CharacterPage[],
  ): void {
    const index = buildScreenplayIndex(document);
    const limit = Math.min(6, this.plugin.settings.maximumSuggestions);
    const ranked = (values: typeof index.characters): string[] =>
      rankUsages(
        values,
        "",
        this.plugin.settings.recentItemsWeighting,
        limit,
      ).map((usage) => usage.value);
    const sections: RecentSection[] = [
      {
        title: "Characters",
        values: ranked(index.characters),
        insert: (value) => insertCharacter(editor, value),
        secondary: (value) =>
          openCharacterDossier(this.plugin, editor, screenplay, value),
        secondaryLabel: (value) => {
          const normalized = value.toLocaleUpperCase();
          const exists = pages.some(
            (page) =>
              page.character === normalized ||
              page.aliases.includes(normalized),
          );
          return exists ? "Open page" : "Create page";
        },
      },
      {
        title: "Locations",
        values: ranked(index.locations),
        insert: (value) => openNewSceneAtLocation(this.plugin, editor, value),
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
      value: this.query,
    });
    const recent = container.createDiv({ cls: "firstdraft-palette-recent" });
    const renderSections = (): void => {
      recent.empty();
      const query = this.query.trim().toLocaleLowerCase();
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
            secondary.addEventListener("click", () =>
              section.secondary?.(value),
            );
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
      this.query = search.value;
      renderSections();
    });
    renderSections();
  }

  private runAction(
    action: PaletteAction,
    editor: Editor,
    screenplay: TFile,
  ): void {
    switch (action) {
      case "character":
        openCharacterPicker(this.plugin, editor);
        break;
      case "character-extension":
        openCharacterExtension(this.plugin, editor);
        break;
      case "character-page":
        openCharacterDossier(this.plugin, editor, screenplay);
        break;
      case "parenthetical":
        openParenthetical(this.plugin, editor);
        break;
      case "new-scene":
        openNewScene(this.plugin, editor);
        break;
      case "transition":
        openTransition(this.plugin, editor);
        break;
    }
  }
}
