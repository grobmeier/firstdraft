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

import {
  matchingCharacterPages,
  normalizeCharacterName,
  type CharacterPage,
} from "./catalogue";

export type CharacterIssueSeverity = "error" | "warning" | "observation";

export interface VerifiableCharacterPage extends CharacterPage {
  linkedToScreenplay: boolean;
  unresolvedRelated: string[];
}

export interface CharacterIssue {
  severity: CharacterIssueSeverity;
  code:
    | "ambiguous-alias"
    | "duplicate-character"
    | "missing-page"
    | "possible-variant"
    | "unresolved-relationship"
    | "unused-page";
  message: string;
  path?: string;
}

function comparable(value: string): string {
  return normalizeCharacterName(value).replace(/[^\p{L}\p{N}]/gu, "");
}

function editDistance(left: string, right: string): number {
  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  );
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        (current[rightIndex - 1] ?? 0) + 1,
        (previous[rightIndex] ?? 0) + 1,
        (previous[rightIndex - 1] ?? 0) +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length] ?? 0;
}

function likelyVariant(cue: string, page: CharacterPage): boolean {
  const source = comparable(cue);
  return [page.character, ...page.aliases].some((name) => {
    const target = comparable(name);
    const threshold = Math.max(source.length, target.length) >= 8 ? 2 : 1;
    return source !== target && editDistance(source, target) <= threshold;
  });
}

export function verifyCharacterPages(
  screenplayCharacters: readonly string[],
  pages: readonly VerifiableCharacterPage[],
): CharacterIssue[] {
  const issues: CharacterIssue[] = [];
  const names = new Map<string, CharacterPage[]>();
  for (const page of pages) {
    for (const name of [page.character, ...page.aliases]) {
      const owners = names.get(name) ?? [];
      owners.push(page);
      names.set(name, owners);
    }
  }

  for (const [name, owners] of names) {
    if (owners.length < 2) continue;
    const canonicalOwners = owners.filter((page) => page.character === name);
    issues.push({
      severity: "error",
      code:
        canonicalOwners.length > 1 ? "duplicate-character" : "ambiguous-alias",
      message:
        canonicalOwners.length > 1
          ? `${name} is the canonical cue on ${owners.length} character pages.`
          : `${name} resolves to more than one character page.`,
      path: owners[0]?.path,
    });
  }

  const normalizedCues = [
    ...new Set(screenplayCharacters.map(normalizeCharacterName)),
  ];
  for (const cue of normalizedCues) {
    const matches = matchingCharacterPages(pages, cue);
    if (matches.length > 0) continue;
    issues.push({
      severity: "warning",
      code: "missing-page",
      message: `${cue} has no character page.`,
    });
    const possible = pages.find((page) => likelyVariant(cue, page));
    if (possible) {
      issues.push({
        severity: "observation",
        code: "possible-variant",
        message: `${cue} may be a spelling variant of ${possible.character}.`,
        path: possible.path,
      });
    }
  }

  for (const page of pages) {
    const used = normalizedCues.some(
      (cue) => matchingCharacterPages([page], cue).length > 0,
    );
    if (page.linkedToScreenplay && !used) {
      issues.push({
        severity: "observation",
        code: "unused-page",
        message: `${page.character} links to this screenplay but is not used in it.`,
        path: page.path,
      });
    }
    for (const related of page.unresolvedRelated) {
      issues.push({
        severity: "warning",
        code: "unresolved-relationship",
        message: `${page.character} links to missing relationship target ${related}.`,
        path: page.path,
      });
    }
  }

  const severityOrder: Record<CharacterIssueSeverity, number> = {
    error: 0,
    warning: 1,
    observation: 2,
  };
  return issues.sort(
    (left, right) =>
      severityOrder[left.severity] - severityOrder[right.severity] ||
      left.message.localeCompare(right.message),
  );
}
