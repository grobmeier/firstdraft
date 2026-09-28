import type { Editor } from "obsidian";
import type FirstDraftPlugin from "../main";
import { loadScreenplayContext } from "../projects/vault";
import { buildScreenplayIndex, rankUsages } from "../screenplay/indexer";
import { parseFountain } from "../screenplay/parser";
import { PickerModal, TextInputModal } from "../ui/pickers";
import { insertBlock } from "./editorText";

interface Choice {
  kind: "value" | "custom";
  label: string;
  value?: string;
}

function choices(values: readonly string[], customLabel: string): Choice[] {
  return [
    ...values.map((value) => ({ kind: "value" as const, label: value, value })),
    { kind: "custom", label: customLabel },
  ];
}

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLocaleUpperCase();
    if (!value.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function openNewScene(plugin: FirstDraftPlugin, editor: Editor): void {
  void openNewSceneForContext(plugin, editor);
}

async function projectIndex(
  plugin: FirstDraftPlugin,
  editor: Editor,
): Promise<ReturnType<typeof buildScreenplayIndex>> {
  const file = plugin.activeMarkdownView()?.file ?? null;
  if (file === null)
    return buildScreenplayIndex(parseFountain(editor.getValue()));
  const context = await loadScreenplayContext(
    plugin.app,
    file,
    plugin.settings.characterFolder,
    editor.getValue(),
  );
  return buildScreenplayIndex(context.document);
}

async function openNewSceneForContext(
  plugin: FirstDraftPlugin,
  editor: Editor,
): Promise<void> {
  const index = await projectIndex(plugin, editor);
  new PickerModal(plugin.app, {
    title: "New Scene — Scene type",
    placeholder: "Choose INT., EXT., or another scene type",
    items: plugin.settings.preferredSceneTypes,
    itemText: (item) => item,
    onChoose: (sceneType) => chooseLocation(plugin, editor, index, sceneType),
  }).open();
}

export function openNewSceneAtLocation(
  plugin: FirstDraftPlugin,
  editor: Editor,
  location: string,
): void {
  void openNewSceneAtLocationForContext(plugin, editor, location);
}

async function openNewSceneAtLocationForContext(
  plugin: FirstDraftPlugin,
  editor: Editor,
  location: string,
): Promise<void> {
  const index = await projectIndex(plugin, editor);
  new PickerModal(plugin.app, {
    title: "New Scene — Scene type",
    placeholder: "Choose INT., EXT., or another scene type",
    items: plugin.settings.preferredSceneTypes,
    itemText: (item) => item,
    onChoose: (sceneType) =>
      chooseTime(plugin, editor, index, sceneType, location),
  }).open();
}

function chooseLocation(
  plugin: FirstDraftPlugin,
  editor: Editor,
  index: ReturnType<typeof buildScreenplayIndex>,
  sceneType: string,
): void {
  const locations = rankUsages(
    index.locations,
    "",
    plugin.settings.recentItemsWeighting,
    plugin.settings.maximumSuggestions,
  ).map((usage) => usage.value);

  new PickerModal(plugin.app, {
    title: "New Scene — Location",
    placeholder: "Choose a known location or create one",
    items: choices(locations, "New location…"),
    itemText: (item) => item.label,
    onChoose: (choice) => {
      if (choice.kind === "custom") {
        new TextInputModal(
          plugin.app,
          "New Scene — New location",
          "Location",
          (location) => chooseTime(plugin, editor, index, sceneType, location),
        ).open();
      } else if (choice.value) {
        chooseTime(plugin, editor, index, sceneType, choice.value);
      }
    },
  }).open();
}

function chooseTime(
  plugin: FirstDraftPlugin,
  editor: Editor,
  index: ReturnType<typeof buildScreenplayIndex>,
  sceneType: string,
  location: string,
): void {
  const recentCustom = rankUsages(
    index.timesOfDay,
    "",
    plugin.settings.recentItemsWeighting,
    plugin.settings.maximumSuggestions,
  ).map((usage) => usage.value);
  const times = unique([
    ...plugin.settings.preferredTimesOfDay,
    ...recentCustom,
  ]);

  new PickerModal(plugin.app, {
    title: "New Scene — Time",
    placeholder: "Choose a time or enter a custom value",
    items: choices(times, "Custom…"),
    itemText: (item) => item.label,
    onChoose: (choice) => {
      if (choice.kind === "custom") {
        new TextInputModal(
          plugin.app,
          "New Scene — Custom time",
          "Time of day",
          (time) => insertScene(editor, sceneType, location, time),
        ).open();
      } else if (choice.value) {
        insertScene(editor, sceneType, location, choice.value);
      }
    },
  }).open();
}

function insertScene(
  editor: Editor,
  sceneType: string,
  location: string,
  time: string,
): void {
  const heading = `${sceneType.trim()} ${location.trim().toLocaleUpperCase()} - ${time.trim().toLocaleUpperCase()}`;
  insertBlock(editor, heading, 2);
}
