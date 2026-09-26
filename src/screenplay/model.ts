export type ScreenplayElementType =
  | "scene-heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition";

export interface ScreenplayElement {
  type: ScreenplayElementType;
  text: string;
  line: number;
}

export interface ScreenplayDocument {
  elements: ScreenplayElement[];
  blankLines: number;
}

export type PageSize = "us-letter" | "a4";

export interface PageEstimate {
  pages: number;
  formattedLines: number;
}

export interface PageEstimationOptions {
  pageSize: PageSize;
}

export interface PageEstimator {
  estimate(
    document: ScreenplayDocument,
    options: PageEstimationOptions,
  ): PageEstimate;
}

export interface CharacterUsage {
  name: string;
  dialogueBlocks: number;
}

export interface Usage {
  value: string;
  count: number;
  lastUsedPosition: number;
}

export interface ScreenplayIndex {
  characters: Usage[];
  locations: Usage[];
  timesOfDay: Usage[];
  parentheticals: Usage[];
  transitions: Usage[];
}

export interface ScreenplayStatistics {
  scenes: number;
  words: number;
  characters: CharacterUsage[];
  locations: string[];
  dialogueBlocks: number;
  actionBlocks: number;
  estimatedPages: number;
  estimatedRuntimeMinutes: number;
}
