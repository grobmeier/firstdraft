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

import type {
  ScreenplayDocument,
  ScreenplayElement,
  ScreenplayElementType,
} from "../screenplay/model";

const FDX_PARAGRAPH_TYPES: Record<ScreenplayElementType, string> = {
  "scene-heading": "Scene Heading",
  action: "Action",
  character: "Character",
  dialogue: "Dialogue",
  parenthetical: "Parenthetical",
  transition: "Transition",
};

function validXmlCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0);
  return (
    codePoint !== undefined &&
    (codePoint === 0x9 ||
      codePoint === 0xa ||
      codePoint === 0xd ||
      (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
      (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
      (codePoint >= 0x10000 && codePoint <= 0x10ffff))
  );
}

export function escapeXmlText(value: string): string {
  return [...value]
    .map((character) => (validXmlCharacter(character) ? character : "�"))
    .join("")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function fdxText(element: ScreenplayElement): string {
  if (element.type === "character" && element.characterExtension) {
    return `${element.text} ${element.characterExtension}`;
  }
  if (element.type === "scene-heading" && element.text.startsWith(".")) {
    return element.text.slice(1);
  }
  if (element.type === "transition" && element.text.startsWith(">")) {
    return element.text.slice(1);
  }
  if (element.type === "action" && element.text.startsWith("!")) {
    return element.text.slice(1);
  }
  return element.text;
}

export function serializeFdx(document: ScreenplayDocument): string {
  const paragraphs = document.elements.map((element) => {
    const type = FDX_PARAGRAPH_TYPES[element.type];
    const text = escapeXmlText(fdxText(element));
    return `    <Paragraph Type="${type}">\n      <Text>${text}</Text>\n    </Paragraph>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
    '<FinalDraft DocumentType="Script" Template="No" Version="1">',
    "  <Content>",
    ...paragraphs,
    "  </Content>",
    "</FinalDraft>",
    "",
  ].join("\n");
}

export function fdxExportPath(
  sourcePath: string,
  existingPaths: Pick<ReadonlySet<string>, "has">,
): string {
  const slash = sourcePath.lastIndexOf("/");
  const directory = slash === -1 ? "" : sourcePath.slice(0, slash + 1);
  const filename = slash === -1 ? sourcePath : sourcePath.slice(slash + 1);
  const dot = filename.lastIndexOf(".");
  const basename = dot === -1 ? filename : filename.slice(0, dot);
  const extension = dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
  const exportBase = extension === "fdx" ? `${basename}-export` : basename;

  let candidate = `${directory}${exportBase}.fdx`;
  let suffix = 2;
  while (existingPaths.has(candidate)) {
    candidate = `${directory}${exportBase}-${suffix}.fdx`;
    suffix += 1;
  }
  return candidate;
}
