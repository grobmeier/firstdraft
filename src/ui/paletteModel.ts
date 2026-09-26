import { isLikelyCharacterCue } from "../screenplay/characterExtension";

export type PaletteAction =
  | "character"
  | "character-extension"
  | "parenthetical"
  | "new-scene"
  | "transition";

function currentLineNumber(source: string, offset: number): number {
  return source.slice(0, Math.max(0, offset)).split("\n").length - 1;
}

function isDialogueContext(
  lines: readonly string[],
  lineNumber: number,
): boolean {
  let blockStart = lineNumber;
  while (blockStart > 0 && (lines[blockStart - 1]?.trim() ?? "") !== "") {
    blockStart -= 1;
  }

  return (
    lineNumber > blockStart &&
    isLikelyCharacterCue(lines[blockStart]?.trim() ?? "")
  );
}

export function orderPaletteActions(
  source: string,
  cursorOffset: number,
): PaletteAction[] {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  const lineNumber = Math.min(
    currentLineNumber(source, cursorOffset),
    lines.length - 1,
  );
  const line = lines[lineNumber]?.trim() ?? "";

  if (isLikelyCharacterCue(line)) {
    return [
      "character-extension",
      "parenthetical",
      "character",
      "new-scene",
      "transition",
    ];
  }
  if (isDialogueContext(lines, lineNumber)) {
    return ["parenthetical", "character", "new-scene", "transition"];
  }
  if (line === "") {
    return ["new-scene", "character", "transition", "parenthetical"];
  }
  return ["character", "new-scene", "transition", "parenthetical"];
}
