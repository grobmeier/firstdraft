import type { Editor } from "obsidian";
import type FirstDraftPlugin from "../main";
import { loadScreenplayContext } from "../projects/vault";
import { buildScreenplayIndex, rankUsages } from "../screenplay/indexer";
import { parseFountain } from "../screenplay/parser";
import { PickerModal, TextInputModal } from "../ui/pickers";
import { insertBlock } from "./editorText";

interface CharacterChoice {
  kind: "character" | "new";
  label: string;
}

export function openCharacterPicker(
  plugin: FirstDraftPlugin,
  editor: Editor,
): void {
  void openCharacterPickerForContext(plugin, editor);
}

async function openCharacterPickerForContext(
  plugin: FirstDraftPlugin,
  editor: Editor,
): Promise<void> {
  const file = plugin.activeMarkdownView()?.file ?? null;
  const document = file
    ? (
        await loadScreenplayContext(
          plugin.app,
          file,
          plugin.settings.characterFolder,
          editor.getValue(),
        )
      ).document
    : parseFountain(editor.getValue());
  const index = buildScreenplayIndex(document);
  const characters: CharacterChoice[] = rankUsages(
    index.characters,
    "",
    plugin.settings.recentItemsWeighting,
    plugin.settings.maximumSuggestions,
  ).map((usage) => ({ kind: "character", label: usage.value }));
  characters.push({ kind: "new", label: "New character…" });

  new PickerModal(plugin.app, {
    title: "Character",
    placeholder: "Choose a character or create one",
    items: characters,
    itemText: (item) => item.label,
    onChoose: (choice) => {
      if (choice.kind === "new") {
        new TextInputModal(
          plugin.app,
          "New character",
          "Character name",
          (name) => insertCharacter(editor, name),
        ).open();
      } else {
        insertCharacter(editor, choice.label);
      }
    },
  }).open();
}

export function insertCharacter(editor: Editor, name: string): void {
  insertBlock(editor, name.trim().toLocaleUpperCase(), 1);
}
