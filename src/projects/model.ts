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
import { wikiLinkTarget } from "../characters/catalogue";

export const SCREENPLAY_PROJECT_KIND = "screenplay-project";

export interface ScreenplayProject {
  path: string;
  title: string;
  parts: string[];
  characterFolder: string | null;
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return typeof value === "string" && value.trim() ? [value] : [];
}

function parentPath(path: string): string {
  const separator = path.lastIndexOf("/");
  return separator === -1 ? "" : path.slice(0, separator);
}

export function isScreenplayProjectFrontmatter(
  frontmatter: Record<string, unknown> | undefined,
): boolean {
  return frontmatter?.firstdraft === SCREENPLAY_PROJECT_KIND;
}

export function screenplayProjectFromFrontmatter(
  path: string,
  frontmatter: Record<string, unknown> | undefined,
): ScreenplayProject | null {
  if (!isScreenplayProjectFrontmatter(frontmatter)) return null;
  const fallbackTitle = path.split("/").pop()?.replace(/\.md$/u, "") ?? path;
  const title =
    typeof frontmatter?.title === "string" && frontmatter.title.trim()
      ? frontmatter.title.trim()
      : fallbackTitle;
  const characterFolder = frontmatter?.["character-folder"];
  return {
    path,
    title,
    parts: stringList(frontmatter?.parts).map(wikiLinkTarget).filter(Boolean),
    characterFolder:
      typeof characterFolder === "string" && characterFolder.trim()
        ? characterFolder.trim()
        : null,
  };
}

export function resolveCharacterFolder(
  ownerPath: string,
  configuredFolder: string,
): string {
  const normalized = configuredFolder.trim().replace(/\/+$/gu, "");
  if (normalized.startsWith("/")) return normalized.replace(/^\/+|\/+$/gu, "");
  const parent = parentPath(ownerPath);
  return [parent, normalized].filter(Boolean).join("/");
}

export function combineScreenplayDocuments(
  documents: readonly ScreenplayDocument[],
): ScreenplayDocument {
  let lineOffset = 0;
  return {
    elements: documents.flatMap((document) => {
      const elements = document.elements.map((element) => ({
        ...element,
        line: element.line + lineOffset,
      }));
      lineOffset +=
        Math.max(1, ...document.elements.map((item) => item.line)) + 1;
      return elements;
    }),
    blankLines: documents.reduce(
      (sum, document) => sum + document.blankLines,
      0,
    ),
  };
}
