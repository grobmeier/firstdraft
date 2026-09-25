import type {
  CharacterUsage,
  PageSize,
  ScreenplayDocument,
  ScreenplayStatistics,
} from "./model";
import { estimateScreenplayPages } from "./estimator";
import { buildScreenplayIndex } from "./indexer";
import { estimateRuntimeMinutes } from "./runtime";

const WORD = /[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu;

export interface StatisticsOptions {
  pageSize: PageSize;
  minutesPerPage: number;
}

const DEFAULT_OPTIONS: StatisticsOptions = {
  pageSize: "us-letter",
  minutesPerPage: 1,
};

export function countWords(source: string): number {
  return source.match(WORD)?.length ?? 0;
}

export function calculateStatistics(
  document: ScreenplayDocument,
  options: StatisticsOptions = DEFAULT_OPTIONS,
): ScreenplayStatistics {
  const usage = new Map<string, number>();
  let scenes = 0;
  let words = 0;
  let dialogueBlocks = 0;
  let actionBlocks = 0;
  let previousElementType: string | null = null;
  let previousElementLine = 0;

  for (const element of document.elements) {
    words += countWords(element.text);
    if (element.type === "scene-heading") scenes += 1;
    if (element.type === "character") {
      usage.set(element.text, (usage.get(element.text) ?? 0) + 1);
      dialogueBlocks += 1;
    }
    if (
      element.type === "action" &&
      (previousElementType !== "action" ||
        element.line > previousElementLine + 1)
    ) {
      actionBlocks += 1;
    }
    previousElementType = element.type;
    previousElementLine = element.line;
  }

  const characters: CharacterUsage[] = [...usage.entries()]
    .map(([name, dialogueBlocks]) => ({ name, dialogueBlocks }))
    .sort(
      (left, right) =>
        right.dialogueBlocks - left.dialogueBlocks ||
        left.name.localeCompare(right.name),
    );

  const index = buildScreenplayIndex(document);
  const estimatedPages = estimateScreenplayPages(
    document,
    options.pageSize,
  ).pages;

  return {
    scenes,
    words,
    characters,
    locations: index.locations.map((location) => location.value),
    dialogueBlocks,
    actionBlocks,
    estimatedPages,
    estimatedRuntimeMinutes: estimateRuntimeMinutes(
      estimatedPages,
      options.minutesPerPage,
    ),
  };
}
