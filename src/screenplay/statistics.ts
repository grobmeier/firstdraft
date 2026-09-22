import type {
  CharacterUsage,
  ScreenplayDocument,
  ScreenplayStatistics,
} from "./model";

const WORD = /[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu;

export function countWords(source: string): number {
  return source.match(WORD)?.length ?? 0;
}

export function calculateStatistics(
  document: ScreenplayDocument,
): ScreenplayStatistics {
  const usage = new Map<string, number>();
  let scenes = 0;
  let words = 0;

  for (const element of document.elements) {
    words += countWords(element.text);
    if (element.type === "scene-heading") scenes += 1;
    if (element.type === "character") {
      usage.set(element.text, (usage.get(element.text) ?? 0) + 1);
    }
  }

  const characters: CharacterUsage[] = [...usage.entries()]
    .map(([name, dialogueBlocks]) => ({ name, dialogueBlocks }))
    .sort(
      (left, right) =>
        right.dialogueBlocks - left.dialogueBlocks ||
        left.name.localeCompare(right.name),
    );

  return { scenes, words, characters };
}
