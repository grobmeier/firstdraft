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

import { normalizePath, TFile } from "obsidian";
import type { App } from "obsidian";
import {
  characterFilename,
  characterPageFromFrontmatter,
  characterPageTemplate,
  matchingCharacterPages,
  type CharacterPage,
  wikiLinkTarget,
} from "./catalogue";
import type { VerifiableCharacterPage } from "./verification";

export function characterPages(app: App): CharacterPage[] {
  return app.vault.getMarkdownFiles().flatMap((file) => {
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
    const page = characterPageFromFrontmatter(file.path, frontmatter);
    return page ? [page] : [];
  });
}

export function characterPageFile(app: App, page: CharacterPage): TFile | null {
  const file = app.vault.getAbstractFileByPath(page.path);
  return file instanceof TFile ? file : null;
}

export function verifiableCharacterPages(
  app: App,
  scopeFiles: readonly TFile[],
): VerifiableCharacterPage[] {
  const scopePaths = new Set(scopeFiles.map((file) => file.path));
  return characterPages(app)
    .filter((page) =>
      page.screenplays.some((link) => {
        const target = wikiLinkTarget(link);
        const file = app.metadataCache.getFirstLinkpathDest(target, page.path);
        return file !== null && scopePaths.has(file.path);
      }),
    )
    .map((page) => ({
      ...page,
      linkedToScreenplay: true,
      unresolvedRelated: page.related.filter((link) => {
        const target = wikiLinkTarget(link);
        return (
          !target ||
          app.metadataCache.getFirstLinkpathDest(target, page.path) === null
        );
      }),
    }));
}

export function characterPagesForScope(
  app: App,
  scopeFiles: readonly TFile[],
): CharacterPage[] {
  return verifiableCharacterPages(app, scopeFiles);
}

async function ensureFolder(app: App, folder: string): Promise<void> {
  const parts = normalizePath(folder).split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (app.vault.getAbstractFileByPath(current) === null) {
      await app.vault.createFolder(current);
    }
  }
}

function availablePath(app: App, folder: string, cue: string): string {
  const stem = characterFilename(cue);
  let suffix = 1;
  let path = normalizePath(`${folder}/${stem}.md`);
  while (app.vault.getAbstractFileByPath(path) !== null) {
    suffix += 1;
    path = normalizePath(`${folder}/${stem} ${suffix}.md`);
  }
  return path;
}

export async function ensureCharacterPage(
  app: App,
  folder: string,
  owner: TFile,
  scopeFiles: readonly TFile[],
  cue: string,
): Promise<TFile | null> {
  const matches = matchingCharacterPages(
    characterPagesForScope(app, scopeFiles),
    cue,
  );
  if (matches.length === 1) return characterPageFile(app, matches[0]);
  if (matches.length > 1) return null;

  await ensureFolder(app, folder);
  const path = availablePath(app, folder, cue);
  const screenplayLink = app.metadataCache.fileToLinktext(
    owner,
    path,
    owner.extension === "md",
  );
  return app.vault.create(path, characterPageTemplate(cue, screenplayLink));
}

export async function openCharacterPage(app: App, file: TFile): Promise<void> {
  await app.workspace.getLeaf("tab").openFile(file);
}
