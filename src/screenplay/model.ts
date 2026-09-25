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
}

export interface ScreenplayStatistics {
  scenes: number;
  words: number;
  characters: CharacterUsage[];
}
