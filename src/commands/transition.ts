import type { Editor } from "obsidian";
import type FirstDraftPlugin from "../main";
import { COMMON_TRANSITIONS } from "../screenplay/fountain";
import { buildScreenplayIndex, rankUsages } from "../screenplay/indexer";
import { parseFountain } from "../screenplay/parser";
import { normalizeTransition } from "../screenplay/transition";
import { PickerModal, TextInputModal } from "../ui/pickers";
import { insertBlock } from "./editorText";

interface TransitionChoice {
  kind: "value" | "custom";
  label: string;
}

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLocaleUpperCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function openTransition(plugin: FirstDraftPlugin, editor: Editor): void {
  const index = buildScreenplayIndex(parseFountain(editor.getValue()));
  const discovered = rankUsages(
    index.transitions,
    "",
    plugin.settings.recentItemsWeighting,
    plugin.settings.maximumSuggestions,
  ).map((usage) => usage.value);
  const choices: TransitionChoice[] = unique([
    ...discovered,
    ...COMMON_TRANSITIONS,
  ]).map((label) => ({ kind: "value", label }));
  choices.push({ kind: "custom", label: "Custom transition…" });

  new PickerModal(plugin.app, {
    title: "Transition",
    placeholder: "Choose or create a transition",
    items: choices,
    itemText: (item) => item.label,
    onChoose: (choice) => {
      if (choice.kind === "custom") {
        new TextInputModal(
          plugin.app,
          "Custom Transition",
          "e.g. IRIS OUT",
          (value) => insertTransition(editor, value),
        ).open();
      } else {
        insertTransition(editor, choice.label);
      }
    },
  }).open();
}

export function insertTransition(editor: Editor, value: string): void {
  const transition = normalizeTransition(value);
  if (!transition) return;
  insertBlock(editor, transition, 2);
}
