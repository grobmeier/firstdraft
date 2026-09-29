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
  PageSize,
  ScreenplayDocument,
  ScreenplayElement,
  ScreenplayElementType,
} from "../screenplay/model";

export interface ScreenplayPageDimensions {
  width: number;
  height: number;
}

export interface ScreenplayLayoutBlock {
  type: ScreenplayElementType;
  lines: string[];
  left: number;
  top: number;
  width: number;
  align: "left" | "right";
}

export interface ScreenplayLayoutPage {
  blocks: ScreenplayLayoutBlock[];
}

export interface ScreenplayLayout {
  dimensions: ScreenplayPageDimensions;
  fontSize: number;
  lineHeight: number;
  pages: ScreenplayLayoutPage[];
}

interface ElementStyle {
  left: number;
  right: number;
  maximumCharacters: number;
  gapBefore: number;
  align: "left" | "right";
}

const PAGE_DIMENSIONS: Record<PageSize, ScreenplayPageDimensions> = {
  "us-letter": { width: 612, height: 792 },
  a4: { width: 595.28, height: 841.89 },
};

const FONT_SIZE = 12;
const LINE_HEIGHT = 12;
const TOP_MARGIN = 72;
const BOTTOM_MARGIN = 60;

function styleFor(
  type: ScreenplayElementType,
  pageWidth: number,
): ElementStyle {
  switch (type) {
    case "scene-heading":
      return {
        left: 90,
        right: 72,
        maximumCharacters: 60,
        gapBefore: 24,
        align: "left",
      };
    case "character":
      return {
        left: pageWidth * 0.38,
        right: pageWidth * 0.18,
        maximumCharacters: 32,
        gapBefore: 12,
        align: "left",
      };
    case "parenthetical":
      return {
        left: pageWidth * 0.31,
        right: pageWidth * 0.27,
        maximumCharacters: 25,
        gapBefore: 0,
        align: "left",
      };
    case "dialogue":
      return {
        left: pageWidth * 0.24,
        right: pageWidth * 0.24,
        maximumCharacters: 35,
        gapBefore: 0,
        align: "left",
      };
    case "transition":
      return {
        left: pageWidth * 0.48,
        right: 72,
        maximumCharacters: 32,
        gapBefore: 12,
        align: "right",
      };
    case "action":
      return {
        left: 90,
        right: 72,
        maximumCharacters: 60,
        gapBefore: 12,
        align: "left",
      };
  }
}

export function screenplayElementText(element: ScreenplayElement): string {
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

export function wrapScreenplayText(
  value: string,
  maximumCharacters: number,
): string[] {
  const words = value.trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (word.length > maximumCharacters) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let offset = 0; offset < word.length; offset += maximumCharacters) {
        const chunk = word.slice(offset, offset + maximumCharacters);
        if (chunk.length === maximumCharacters) lines.push(chunk);
        else current = chunk;
      }
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maximumCharacters) current = candidate;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function minimumFollowingLines(
  elements: readonly ScreenplayElement[],
  index: number,
): number {
  const current = elements[index];
  const next = elements[index + 1];
  if (!current || !next) return 0;
  if (current.type === "scene-heading") return 1;
  if (
    current.type === "character" &&
    (next.type === "parenthetical" || next.type === "dialogue")
  ) {
    return 1;
  }
  return 0;
}

export function layoutScreenplay(
  document: ScreenplayDocument,
  pageSize: PageSize,
): ScreenplayLayout {
  const dimensions = PAGE_DIMENSIONS[pageSize];
  const pages: ScreenplayLayoutPage[] = [{ blocks: [] }];
  let page = pages[0];
  let cursor = TOP_MARGIN;

  const addPage = (): void => {
    page = { blocks: [] };
    pages.push(page);
    cursor = TOP_MARGIN;
  };

  for (let index = 0; index < document.elements.length; index += 1) {
    const element = document.elements[index];
    if (!element) continue;
    const style = styleFor(element.type, dimensions.width);
    let lines = wrapScreenplayText(
      screenplayElementText(element),
      style.maximumCharacters,
    );
    let gap = page.blocks.length === 0 ? 0 : style.gapBefore;
    const minimumHeight =
      (lines.length + minimumFollowingLines(document.elements, index)) *
      LINE_HEIGHT;

    if (
      page.blocks.length > 0 &&
      cursor + gap + minimumHeight > dimensions.height - BOTTOM_MARGIN
    ) {
      addPage();
      gap = 0;
    }

    while (lines.length > 0) {
      const top = cursor + gap;
      const availableLines = Math.max(
        1,
        Math.floor((dimensions.height - BOTTOM_MARGIN - top) / LINE_HEIGHT),
      );
      const pageLines = lines.slice(0, availableLines);
      page.blocks.push({
        type: element.type,
        lines: pageLines,
        left: style.left,
        top,
        width: dimensions.width - style.left - style.right,
        align: style.align,
      });
      cursor = top + pageLines.length * LINE_HEIGHT;
      lines = lines.slice(availableLines);
      gap = 0;
      if (lines.length > 0) addPage();
    }
  }

  return {
    dimensions,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    pages,
  };
}
