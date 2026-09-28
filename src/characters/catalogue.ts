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

export interface CharacterPage {
  path: string;
  character: string;
  aliases: string[];
  screenplays: string[];
  related: string[];
}

export function normalizeCharacterName(value: string): string {
  return value.trim().replace(/\s+/gu, " ").toLocaleUpperCase();
}

function stringValues(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isCharacterFrontmatter(
  frontmatter: Record<string, unknown> | undefined,
): boolean {
  return frontmatter?.firstdraft === "character";
}

export function characterPageFromFrontmatter(
  path: string,
  frontmatter: Record<string, unknown> | undefined,
): CharacterPage | null {
  if (!isCharacterFrontmatter(frontmatter)) return null;
  const character =
    typeof frontmatter?.character === "string"
      ? normalizeCharacterName(frontmatter.character)
      : "";
  if (!character) return null;

  return {
    path,
    character,
    aliases: stringValues(frontmatter?.aliases).map(normalizeCharacterName),
    screenplays: stringValues(frontmatter?.screenplays),
    related: stringValues(frontmatter?.related),
  };
}

export function matchingCharacterPages(
  pages: readonly CharacterPage[],
  cue: string,
): CharacterPage[] {
  const normalized = normalizeCharacterName(cue);
  return pages.filter(
    (page) =>
      page.character === normalized || page.aliases.includes(normalized),
  );
}

export function characterFilename(cue: string): string {
  const words = normalizeCharacterName(cue)
    .replace(/\s+\([^)]*\)\s*$/u, "")
    .replace(/[\\/:*?"<>|#[\]^]/gu, " ")
    .split(/\s+/u)
    .filter(Boolean);
  const title = words
    .map((word) => `${word.charAt(0)}${word.slice(1).toLocaleLowerCase()}`)
    .join(" ");
  return title || "Character";
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

export function characterPageTemplate(
  cue: string,
  screenplayLink: string,
): string {
  const character = normalizeCharacterName(cue);
  const title = characterFilename(character);
  return `---
firstdraft: character
character: ${yamlString(character)}
aliases: []
screenplays:
  - ${yamlString(`[[${screenplayLink}]]`)}
related: []
---

# ${title}

## Background

## Wants and fears

## Voice

## Relationships

## Continuity notes
`;
}

export function wikiLinkTarget(value: string): string {
  const trimmed = value.trim();
  const inner =
    trimmed.startsWith("[[") && trimmed.endsWith("]]")
      ? trimmed.slice(2, -2)
      : trimmed;
  return (inner.split("|")[0] ?? "").split("#")[0]?.trim() ?? "";
}
