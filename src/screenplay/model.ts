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

export interface ScreenplayStatistics {
  scenes: number;
  words: number;
  characters: CharacterUsage[];
}
