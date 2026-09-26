import { Notice } from "obsidian";
import type { Editor, TFile } from "obsidian";
import type FirstDraftPlugin from "../main";
import {
  characterPages,
  ensureCharacterPage,
  openCharacterPage,
} from "../characters/vault";
import { characterNameFromCue } from "../screenplay/characterExtension";
import { buildScreenplayIndex, rankUsages } from "../screenplay/indexer";
import { parseFountain } from "../screenplay/parser";
import { PickerModal } from "../ui/pickers";

export function openCharacterDossier(
  plugin: FirstDraftPlugin,
  editor: Editor,
  screenplay: TFile,
  preferredCue?: string,
): void {
  const lineCue = characterNameFromCue(editor.getLine(editor.getCursor().line));
  const cue = preferredCue ?? lineCue;
  if (cue) {
    void ensureAndOpen(plugin, screenplay, cue);
    return;
  }

  const index = buildScreenplayIndex(parseFountain(editor.getValue()));
  const characters = rankUsages(
    index.characters,
    "",
    plugin.settings.recentItemsWeighting,
    plugin.settings.maximumSuggestions,
  ).map((usage) => usage.value);
  if (characters.length === 0) {
    new Notice("No screenplay characters were found in this note.");
    return;
  }
  new PickerModal(plugin.app, {
    title: "Character Page",
    placeholder: "Choose a screenplay character",
    items: characters,
    itemText: (item) => item,
    onChoose: (item) => void ensureAndOpen(plugin, screenplay, item),
  }).open();
}

async function ensureAndOpen(
  plugin: FirstDraftPlugin,
  screenplay: TFile,
  cue: string,
): Promise<void> {
  const matches = characterPages(plugin.app).filter(
    (page) =>
      page.character === cue.toLocaleUpperCase() ||
      page.aliases.includes(cue.toLocaleUpperCase()),
  );
  if (matches.length > 1) {
    new Notice(
      `More than one character page matches ${cue}. Run Check Characters.`,
    );
    return;
  }
  const file = await ensureCharacterPage(
    plugin.app,
    plugin.settings.characterFolder,
    screenplay,
    cue,
  );
  if (file === null) {
    new Notice(`Could not create or resolve the character page for ${cue}.`);
    return;
  }
  await openCharacterPage(plugin.app, file);
}
