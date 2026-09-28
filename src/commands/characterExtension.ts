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
import type FirstDraftPlugin from "../main";
import {
  isLikelyCharacterCue,
  withCharacterExtension,
} from "../screenplay/characterExtension";
import { CHARACTER_EXTENSIONS } from "../screenplay/fountain";
import { PickerModal } from "../ui/pickers";

export { isLikelyCharacterCue };

export function openCharacterExtension(
  plugin: FirstDraftPlugin,
  editor: Editor,
): void {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  if (!isLikelyCharacterCue(line)) return;

  new PickerModal(plugin.app, {
    title: "Character Extension",
    placeholder: "Choose an extension",
    items: CHARACTER_EXTENSIONS,
    itemText: (item) => item,
    onChoose: (extension) => {
      const replacement = withCharacterExtension(line, extension);
      editor.replaceRange(
        replacement,
        { line: cursor.line, ch: 0 },
        { line: cursor.line, ch: line.length },
      );
      editor.setCursor({ line: cursor.line, ch: replacement.length });
      editor.focus();
    },
  }).open();
}
