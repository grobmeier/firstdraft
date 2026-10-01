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
import { wrapMeasuredText } from "./measuredWrapping";

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
  align: "left" | "right" | "center";
}

export interface ScreenplayLayoutPage {
  blocks: ScreenplayLayoutBlock[];
  titlePage?: boolean;
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
export const CJK_LINE_HEIGHT = 14.4;
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
  measure?: (text: string, type: ScreenplayElementType) => number,
  lineHeight = LINE_HEIGHT,
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

  const wrap = (text: string, type: ScreenplayElementType): string[] => {
    const style = styleFor(type, dimensions.width);
    return measure
      ? wrapMeasuredText(
          text,
          dimensions.width - style.left - style.right,
          (line) => measure(line, type),
        )
      : wrapScreenplayText(text, style.maximumCharacters);
  };
  const append = (
    type: ScreenplayElementType,
    lines: string[],
    gap = 0,
  ): void => {
    const style = styleFor(type, dimensions.width);
    page.blocks.push({
      type,
      lines,
      left: style.left,
      top: cursor + gap,
      width: dimensions.width - style.left - style.right,
      align: style.align,
    });
    cursor += gap + lines.length * lineHeight;
  };

  if (document.titlePage) {
    const metadata = document.titlePage;
    page.titlePage = true;
    const titleLines = (value: string, type: ScreenplayElementType): string[] =>
      value
        .split("\n")
        .flatMap((line) =>
          measure
            ? wrapMeasuredText(line, dimensions.width - 144, (text) =>
                measure(text, type),
              )
            : wrapScreenplayText(
                line,
                Math.floor((dimensions.width - 144) / 7.2),
              ),
        );
    const central = [metadata.title, metadata.credit, metadata.author].filter(
      (value): value is string => Boolean(value),
    );
    cursor = dimensions.height * 0.32;
    for (const [index, value] of central.entries()) {
      const type = index === 0 ? "scene-heading" : "action";
      const lines = titleLines(value, type);
      page.blocks.push({
        type,
        lines,
        left: 72,
        top: cursor,
        width: dimensions.width - 144,
        align: "center",
      });
      cursor += lines.length * lineHeight + 24;
    }
    const lower = [
      metadata.source,
      metadata.draftDate,
      metadata.contact,
    ].filter((value): value is string => Boolean(value));
    const lowerLines = lower.map((value) => titleLines(value, "action"));
    const lowerHeight = lowerLines.reduce(
      (sum, lines) => sum + lines.length * lineHeight + 12,
      0,
    );
    const lowerTop = dimensions.height - 72 - lowerHeight;
    if (cursor > lowerTop - 24)
      throw new ScreenplayLayoutError(
        "Title-page metadata is too long for one page. Shorten the title, credits or contact details.",
      );
    cursor = lowerTop;
    for (const lines of lowerLines) {
      page.blocks.push({
        type: "action",
        lines,
        left: 72,
        top: cursor,
        width: dimensions.width - 144,
        align: "left",
      });
      cursor += lines.length * lineHeight + 12;
    }
    addPage();
  }

  for (let index = 0; index < document.elements.length; index += 1) {
    const element = document.elements[index];
    if (!element) continue;
    if (
      element.type === "character" &&
      document.elements[index + 1]?.type &&
      ["dialogue", "parenthetical"].includes(
        document.elements[index + 1]?.type ?? "",
      )
    ) {
      let end = index + 1;
      while (
        ["dialogue", "parenthetical"].includes(
          document.elements[end]?.type ?? "",
        )
      )
        end++;
      const speech = document.elements.slice(index + 1, end);
      if (speech.some((part) => part.type === "dialogue")) {
        const cue = screenplayElementText(element);
        const firstCue = wrap(cue, "character");
        const continued = wrap(
          /\(CONT['’]D\)/iu.test(cue) ? cue : `${cue} (CONT'D)`,
          "character",
        );
        // Each parenthetical is atomic and tied to the first following dialogue line.
        const units: { type: ScreenplayElementType; lines: string[] }[][] = [];
        let pending: { type: ScreenplayElementType; lines: string[] }[] = [];
        for (const part of speech) {
          const lines = wrap(screenplayElementText(part), part.type);
          if (part.type === "parenthetical")
            pending.push({ type: part.type, lines });
          else
            for (const line of lines) {
              units.push([...pending, { type: part.type, lines: [line] }]);
              pending = [];
            }
        }
        // A trailing parenthetical belongs to the final dialogue unit.
        if (pending.length && units.length)
          units[units.length - 1]?.push(...pending);
        const size = (unit: typeof pending) =>
          unit.reduce((sum, part) => sum + part.lines.length, 0);
        const total =
          firstCue.length + units.reduce((sum, unit) => sum + size(unit), 0);
        const capacity = Math.floor(
          (dimensions.height - BOTTOM_MARGIN - TOP_MARGIN) / lineHeight,
        );
        let gap = page.blocks.length ? 12 : 0;
        if (
          total <= capacity &&
          cursor + gap + total * lineHeight > dimensions.height - BOTTOM_MARGIN
        ) {
          addPage();
          gap = 0;
        }
        let offset = 0;
        let cueLines = firstCue;
        while (offset < units.length) {
          const available = Math.floor(
            (dimensions.height - BOTTOM_MARGIN - cursor - gap) / lineHeight,
          );
          let used = cueLines.length;
          let stop = offset;
          while (stop < units.length) {
            const count = size(units[stop] ?? []);
            const more = stop + 1 < units.length ? 1 : 0;
            if (used + count + more > available) break;
            used += count;
            stop++;
          }
          if (stop === offset) {
            if (!page.blocks.length)
              throw new ScreenplayLayoutError(
                "A character cue or parenthetical is too long to fit with dialogue on one page. Shorten it before exporting.",
              );
            addPage();
            gap = 0;
            continue;
          }
          append("character", cueLines, gap);
          for (const unit of units.slice(offset, stop))
            for (const part of unit) {
              const last = page.blocks[page.blocks.length - 1];
              if (
                last?.type === part.type &&
                last.top + last.lines.length * lineHeight === cursor
              ) {
                last.lines.push(...part.lines);
                cursor += part.lines.length * lineHeight;
              } else append(part.type, [...part.lines]);
            }
          offset = stop;
          if (offset < units.length) {
            append("parenthetical", ["(MORE)"]);
            addPage();
            gap = 0;
            cueLines = continued;
          }
        }
        index = end - 1;
        continue;
      }
    }
    const style = styleFor(element.type, dimensions.width);
    const text = screenplayElementText(element);
    let lines = measure
      ? wrapMeasuredText(
          text,
          dimensions.width - style.left - style.right,
          (line) => measure(line, element.type),
        )
      : wrapScreenplayText(text, style.maximumCharacters);
    let gap = page.blocks.length === 0 ? 0 : style.gapBefore;
    const minimumHeight =
      (lines.length + minimumFollowingLines(document.elements, index)) *
      lineHeight;

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
        Math.floor((dimensions.height - BOTTOM_MARGIN - top) / lineHeight),
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
      cursor = top + pageLines.length * lineHeight;
      lines = lines.slice(availableLines);
      gap = 0;
      if (lines.length > 0) addPage();
    }
  }

  return {
    dimensions,
    fontSize: FONT_SIZE,
    lineHeight,
    pages,
  };
}

export class ScreenplayLayoutError extends Error {
  constructor(message: string) {
    super(`PDF layout stopped: ${message} Your source is unchanged.`);
    this.name = "ScreenplayLayoutError";
  }
}
