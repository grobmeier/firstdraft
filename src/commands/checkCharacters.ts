import type { Editor, TFile } from "obsidian";
import { verifiableCharacterPages } from "../characters/vault";
import { verifyCharacterPages } from "../characters/verification";
import type FirstDraftPlugin from "../main";
import { loadScreenplayContext } from "../projects/vault";
import { buildScreenplayIndex } from "../screenplay/indexer";
import { CharacterCheckModal } from "../ui/characterCheckModal";

export function checkCharacters(
  plugin: FirstDraftPlugin,
  editor: Editor,
  screenplay: TFile,
): void {
  void checkCharacterContext(plugin, editor, screenplay);
}

async function checkCharacterContext(
  plugin: FirstDraftPlugin,
  editor: Editor,
  screenplay: TFile,
): Promise<void> {
  const context = await loadScreenplayContext(
    plugin.app,
    screenplay,
    plugin.settings.characterFolder,
    editor.getValue(),
  );
  const index = buildScreenplayIndex(context.document);
  const pages = verifiableCharacterPages(plugin.app, context.scopeFiles);
  const issues = verifyCharacterPages(
    index.characters.map((usage) => usage.value),
    pages,
  );
  new CharacterCheckModal(plugin.app, issues).open();
}
