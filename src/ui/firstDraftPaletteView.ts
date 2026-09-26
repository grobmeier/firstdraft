import { ItemView } from "obsidian";
import type { Editor, IconName, TFile, WorkspaceLeaf } from "obsidian";
import {
  characterPageFromFrontmatter,
  wikiLinkTarget,
  type CharacterPage,
} from "../characters/catalogue";
import { characterPages } from "../characters/vault";
import { characterDocumentUsage } from "../characters/usage";
import { openCharacterGraph } from "../commands/characterGraph";
import { insertCharacter, openCharacterPicker } from "../commands/character";
import { openCharacterExtension } from "../commands/characterExtension";
import { openCharacterDossier } from "../commands/characterPage";
import { checkCharacters } from "../commands/checkCharacters";
import { openNewScene, openNewSceneAtLocation } from "../commands/newScene";
import {
  insertParenthetical,
  openParenthetical,
} from "../commands/parenthetical";
import { insertTransition, openTransition } from "../commands/transition";
import type FirstDraftPlugin from "../main";
import { buildScreenplayIndex, rankUsages } from "../screenplay/indexer";
import { parseFountain } from "../screenplay/parser";
import { orderPaletteActions, type PaletteAction } from "./paletteModel";

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
    return "First Draft Palette";
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

    const view = this.plugin.activeMarkdownView();
    if (view?.file && this.plugin.isCharacterFile(view.file)) {
      this.renderCharacterPage(container, view.file, generation);
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
      return;
    }

    const editor = view.editor;
    const source = editor.getValue();
    const cursorOffset = editor.posToOffset(editor.getCursor());
    this.renderActions(container, editor, view.file, source, cursorOffset);
    this.renderRecent(container, editor, view.file, source);
  }

  private renderCharacterPage(
    container: HTMLElement,
    file: TFile,
    generation: number,
  ): void {
    const frontmatter = this.plugin.app.metadataCache.getFileCache(file)
      ?.frontmatter as Record<string, unknown> | undefined;
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
      text: "Open Local Graph",
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
      const source = await this.plugin.app.vault.cachedRead(file);
      const usage = characterDocumentUsage(page, parseFountain(source));
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
      text: "Check Characters",
    });
    check.addEventListener("click", () =>
      checkCharacters(this.plugin, editor, screenplay),
    );
  }

  private renderRecent(
    container: HTMLElement,
    editor: Editor,
    screenplay: TFile,
    source: string,
  ): void {
    const index = buildScreenplayIndex(parseFountain(source));
    const limit = Math.min(6, this.plugin.settings.maximumSuggestions);
    const ranked = (values: typeof index.characters): string[] =>
      rankUsages(
        values,
        "",
        this.plugin.settings.recentItemsWeighting,
        limit,
      ).map((usage) => usage.value);
    const pages = characterPages(this.plugin.app);
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
