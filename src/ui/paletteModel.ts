/*
 * Copyright 2026 Christian Grobmeier
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { isLikelyCharacterCue } from "../screenplay/characterExtension";

export type PaletteAction =
  | "character"
  | "character-extension"
  | "character-page"
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
      "character-page",
      "parenthetical",
      "character",
      "new-scene",
      "transition",
    ];
  }
  if (isDialogueContext(lines, lineNumber)) {
    return [
      "parenthetical",
      "character",
      "character-page",
      "new-scene",
      "transition",
    ];
  }
  if (line === "") {
    return [
      "new-scene",
      "character",
      "character-page",
      "transition",
      "parenthetical",
    ];
  }
  return [
    "character",
    "character-page",
    "new-scene",
    "transition",
    "parenthetical",
  ];
}
