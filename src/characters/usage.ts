import type { ScreenplayDocument } from "../screenplay/model";
import { normalizeCharacterName, type CharacterPage } from "./catalogue";

export interface CharacterDocumentUsage {
  cueAppearances: number;
  dialogueBlocks: number;
  scenes: number;
}

export function characterDocumentUsage(
  page: CharacterPage,
  document: ScreenplayDocument,
): CharacterDocumentUsage {
  const names = new Set(
    [page.character, ...page.aliases].map(normalizeCharacterName),
  );
  const scenes = new Set<number>();
  let scene = 0;
  let cueAppearances = 0;

  for (const element of document.elements) {
    if (element.type === "scene-heading") scene += 1;
    if (
      element.type === "character" &&
      names.has(normalizeCharacterName(element.text))
    ) {
      cueAppearances += 1;
      scenes.add(scene);
    }
  }

  return {
    cueAppearances,
    dialogueBlocks: cueAppearances,
    scenes: scenes.size,
  };
}
