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

import type { ScreenplayDocument } from "../screenplay/model";
import { normalizeCharacterName, type CharacterPage } from "./catalogue";

export interface CharacterDocumentUsage {
  cueAppearances: number;
  dialogueBlocks: number;
  scenes: number;
}

export function characterDocumentUsage(
  page: CharacterPage,
  document: ScreenplayDocument,
): CharacterDocumentUsage {
  const names = new Set(
    [page.character, ...page.aliases].map(normalizeCharacterName),
  );
  const scenes = new Set<number>();
  let scene = 0;
  let cueAppearances = 0;

  for (const element of document.elements) {
    if (element.type === "scene-heading") scene += 1;
    if (
      element.type === "character" &&
      names.has(normalizeCharacterName(element.text))
    ) {
      cueAppearances += 1;
      scenes.add(scene);
    }
  }

  return {
    cueAppearances,
    dialogueBlocks: cueAppearances,
    scenes: scenes.size,
  };
}
