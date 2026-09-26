import type { Editor } from "obsidian";
import type FirstDraftPlugin from "../main";
import { COMMON_PARENTHETICALS } from "../screenplay/fountain";
import { buildScreenplayIndex, rankUsages } from "../screenplay/indexer";
import {
  buildParentheticalEdit,
  normalizeParenthetical,
} from "../screenplay/parenthetical";
import { parseFountain } from "../screenplay/parser";
import { PickerModal, TextInputModal } from "../ui/pickers";

interface ParentheticalChoice {
  kind: "value" | "custom";
  label: string;
}

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLocaleLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function openParenthetical(
  plugin: FirstDraftPlugin,
  editor: Editor,
): void {
  const index = buildScreenplayIndex(parseFountain(editor.getValue()));
  const recent = rankUsages(
    index.parentheticals,
    "",
    plugin.settings.recentItemsWeighting,
    plugin.settings.maximumSuggestions,
  ).map((usage) => usage.value);
  const choices: ParentheticalChoice[] = unique([
    ...recent,
    ...COMMON_PARENTHETICALS,
  ]).map((label) => ({ kind: "value", label }));
  choices.push({ kind: "custom", label: "Custom parenthetical…" });

  new PickerModal(plugin.app, {
    title: "Parenthetical",
    placeholder: "Choose or create a parenthetical",
    items: choices,
    itemText: (item) => item.label,
    onChoose: (choice) => {
      if (choice.kind === "custom") {
        new TextInputModal(
          plugin.app,
          "Custom Parenthetical",
          "e.g. under her breath",
          (value) => insertParenthetical(editor, value),
        ).open();
      } else {
        insertParenthetical(editor, choice.label);
      }
    },
  }).open();
}

export function insertParenthetical(editor: Editor, value: string): void {
  if (!normalizeParenthetical(value)) return;
  const source = editor.getValue();
  const edit = buildParentheticalEdit(
    source,
    editor.posToOffset(editor.getCursor()),
    value,
  );
  editor.replaceRange(
    edit.insert,
    editor.offsetToPos(edit.from),
    editor.offsetToPos(edit.to),
  );
  editor.setCursor(editor.offsetToPos(edit.cursor));
  editor.focus();
}
