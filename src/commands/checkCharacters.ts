import type { Editor, TFile } from "obsidian";
import { verifiableCharacterPages } from "../characters/vault";
import { verifyCharacterPages } from "../characters/verification";
import type FirstDraftPlugin from "../main";
import { buildScreenplayIndex } from "../screenplay/indexer";
import { parseFountain } from "../screenplay/parser";
import { CharacterCheckModal } from "../ui/characterCheckModal";

export function checkCharacters(
  plugin: FirstDraftPlugin,
  editor: Editor,
  screenplay: TFile,
): void {
  const index = buildScreenplayIndex(parseFountain(editor.getValue()));
  const pages = verifiableCharacterPages(plugin.app, screenplay);
  const issues = verifyCharacterPages(
    index.characters.map((usage) => usage.value),
    pages,
  );
  new CharacterCheckModal(plugin.app, issues).open();
}
