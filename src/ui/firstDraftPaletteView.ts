import { ItemView } from "obsidian";
import type { Editor, IconName, WorkspaceLeaf } from "obsidian";
import { insertCharacter, openCharacterPicker } from "../commands/character";
import { openCharacterExtension } from "../commands/characterExtension";
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
  parenthetical: "Parenthetical",
  "new-scene": "New Scene",
  transition: "Transition",
};

interface RecentSection {
  title: string;
  values: string[];
  insert: (value: string) => void;
}

export class FirstDraftPaletteView extends ItemView {
  private readonly plugin: FirstDraftPlugin;
  private query = "";

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
    const container = this.contentEl;
    container.empty();
    container.createEl("h2", { text: "First Draft" });

    const view = this.plugin.activeMarkdownView();
    if (view === null || !this.plugin.isScreenplayFile(view.file)) {
      container.createEl("p", {
        cls: "firstdraft-palette-empty",
        text: "Open a screenplay note to use writing actions and recent elements.",
      });
      return;
    }

    const editor = view.editor;
    const source = editor.getValue();
    const cursorOffset = editor.posToOffset(editor.getCursor());
    this.renderActions(container, editor, source, cursorOffset);
    this.renderRecent(container, editor, source);
  }

  private renderActions(
    container: HTMLElement,
    editor: Editor,
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
      button.addEventListener("click", () => this.runAction(action, editor));
    }
  }

  private renderRecent(
    container: HTMLElement,
    editor: Editor,
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
    const sections: RecentSection[] = [
      {
        title: "Characters",
        values: ranked(index.characters),
        insert: (value) => insertCharacter(editor, value),
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
          const button = list.createEl("button", {
            cls: "firstdraft-palette-item",
            text: value,
            attr: { title: `Insert ${value}` },
          });
          button.addEventListener("click", () => section.insert(value));
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

  private runAction(action: PaletteAction, editor: Editor): void {
    switch (action) {
      case "character":
        openCharacterPicker(this.plugin, editor);
        break;
      case "character-extension":
        openCharacterExtension(this.plugin, editor);
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
