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

import { isLikelyCharacterCue } from "./characterExtension";

export interface ParentheticalEdit {
  from: number;
  to: number;
  insert: string;
  cursor: number;
}

export function normalizeParenthetical(value: string): string {
  const text = value.trim().replaceAll("\n", " ");
  if (!text) return "";
  return text.startsWith("(") && text.endsWith(")")
    ? text
    : `(${text.replace(/^\(+|\)+$/gu, "")})`;
}

export function buildParentheticalEdit(
  source: string,
  cursorOffset: number,
  value: string,
): ParentheticalEdit {
  const parenthetical = normalizeParenthetical(value);
  const safeOffset = Math.max(0, Math.min(source.length, cursorOffset));
  const lineStart = source.lastIndexOf("\n", Math.max(0, safeOffset - 1)) + 1;
  const nextBreak = source.indexOf("\n", safeOffset);
  const lineEnd = nextBreak === -1 ? source.length : nextBreak;
  const line = source.slice(lineStart, lineEnd);

  if (isLikelyCharacterCue(line)) {
    const insert =
      lineEnd < source.length ? `\n${parenthetical}` : `\n${parenthetical}\n`;
    return {
      from: lineEnd,
      to: lineEnd,
      insert,
      cursor: lineEnd + insert.length + (lineEnd < source.length ? 1 : 0),
    };
  }

  if (line.trim() === "") {
    const insert =
      lineEnd < source.length ? parenthetical : `${parenthetical}\n`;
    return {
      from: lineStart,
      to: lineEnd,
      insert,
      cursor: lineStart + parenthetical.length + 1,
    };
  }

  const insert = `${parenthetical}\n`;
  return {
    from: lineStart,
    to: lineStart,
    insert,
    cursor: lineStart + insert.length,
  };
}
