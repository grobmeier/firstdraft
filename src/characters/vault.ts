import { normalizePath, TFile } from "obsidian";
import type { App } from "obsidian";
import {
  characterFilename,
  characterPageFromFrontmatter,
  characterPageTemplate,
  matchingCharacterPages,
  type CharacterPage,
} from "./catalogue";

export function characterPages(app: App): CharacterPage[] {
  return app.vault.getMarkdownFiles().flatMap((file) => {
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter as
      Record<string, unknown> | undefined;
    const page = characterPageFromFrontmatter(file.path, frontmatter);
    return page ? [page] : [];
  });
}

export function characterPageFile(app: App, page: CharacterPage): TFile | null {
  const file = app.vault.getAbstractFileByPath(page.path);
  return file instanceof TFile ? file : null;
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
  screenplay: TFile,
  cue: string,
): Promise<TFile | null> {
  const matches = matchingCharacterPages(characterPages(app), cue);
  if (matches.length === 1) return characterPageFile(app, matches[0]);
  if (matches.length > 1) return null;

  await ensureFolder(app, folder);
  const path = availablePath(app, folder, cue);
  const screenplayLink = app.metadataCache.fileToLinktext(
    screenplay,
    path,
    screenplay.extension === "md",
  );
  return app.vault.create(path, characterPageTemplate(cue, screenplayLink));
}

export async function openCharacterPage(app: App, file: TFile): Promise<void> {
  await app.workspace.getLeaf("tab").openFile(file);
}
