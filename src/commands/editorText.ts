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

import type { Editor } from "obsidian";

export interface BlockInsertion {
  insertion: string;
  caretAdvance: number;
}

export function buildBlockInsertion(
  before: string,
  after: string,
  block: string,
  trailingNewlines: number,
): BlockInsertion {
  const requiredBefore = before.length === 0 ? 0 : 2;
  const existingBefore = before.endsWith("\n\n")
    ? 2
    : before.endsWith("\n")
      ? 1
      : 0;
  const prefix = "\n".repeat(Math.max(0, requiredBefore - existingBefore));

  const existingAfter = after.startsWith("\n\n")
    ? 2
    : after.startsWith("\n")
      ? 1
      : 0;
  const suffix = "\n".repeat(Math.max(0, trailingNewlines - existingAfter));

  return {
    insertion: `${prefix}${block}${suffix}`,
    caretAdvance: prefix.length + block.length + trailingNewlines,
  };
}

export function insertBlock(
  editor: Editor,
  block: string,
  trailingNewlines: number,
): void {
  const cursor = editor.getCursor();
  const offset = editor.posToOffset(cursor);
  const source = editor.getValue();
  const change = buildBlockInsertion(
    source.slice(0, offset),
    source.slice(offset),
    block,
    trailingNewlines,
  );
  editor.replaceRange(change.insertion, cursor);
  editor.setCursor(editor.offsetToPos(offset + change.caretAdvance));
  editor.focus();
}
