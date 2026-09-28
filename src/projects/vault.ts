import { TFile } from "obsidian";
import type { App } from "obsidian";
import { stripObsidianFrontmatter } from "../export/fountain";
import { parseFountain } from "../screenplay/parser";
import type { ScreenplayDocument } from "../screenplay/model";
import {
  combineScreenplayDocuments,
  resolveCharacterFolder,
  screenplayProjectFromFrontmatter,
  type ScreenplayProject,
} from "./model";

export interface ProjectPart {
  link: string;
  file: TFile | null;
}

export interface ResolvedScreenplayProject {
  project: ScreenplayProject;
  file: TFile;
  parts: ProjectPart[];
  issues: string[];
}

export interface ScreenplayContext {
  owner: TFile;
  project: ResolvedScreenplayProject | null;
  parts: TFile[];
  document: ScreenplayDocument;
  source: string;
  characterFolder: string;
  scopeFiles: TFile[];
}

export function screenplayProjects(app: App): ResolvedScreenplayProject[] {
  return app.vault.getMarkdownFiles().flatMap((file) => {
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter as
      Record<string, unknown> | undefined;
    const project = screenplayProjectFromFrontmatter(file.path, frontmatter);
    if (project === null) return [];
    const parts = project.parts.map((link) => ({
      link,
      file: app.metadataCache.getFirstLinkpathDest(link, file.path),
    }));
    const resolvedPaths = parts.flatMap((part) =>
      part.file ? [part.file.path] : [],
    );
    const duplicatePaths = new Set(
      resolvedPaths.filter(
        (path, index) => resolvedPaths.indexOf(path) !== index,
      ),
    );
    const issues = [
      ...parts
        .filter((part) => part.file === null)
        .map((part) => `Unresolved part: ${part.link}`),
      ...[...duplicatePaths].map((path) => `Duplicate part: ${path}`),
    ];
    if (parts.length === 0) issues.push("The project has no parts.");
    return [{ project, file, parts, issues }];
  });
}

export function projectForPart(
  app: App,
  file: TFile,
): ResolvedScreenplayProject | null {
  const matches = screenplayProjects(app).filter((project) =>
    project.parts.some((part) => part.file?.path === file.path),
  );
  if (matches.length !== 1) return null;
  return matches[0] ?? null;
}

export function projectForFile(
  app: App,
  file: TFile,
): ResolvedScreenplayProject | null {
  return (
    screenplayProjects(app).find(
      (project) => project.file.path === file.path,
    ) ?? projectForPart(app, file)
  );
}

export function projectMembershipIssue(app: App, file: TFile): string | null {
  const matches = screenplayProjects(app).filter((project) =>
    project.parts.some((part) => part.file?.path === file.path),
  );
  return matches.length > 1
    ? `This part belongs to ${matches.length} screenplay projects.`
    : null;
}

export async function loadScreenplayContext(
  app: App,
  file: TFile,
  defaultCharacterFolder: string,
  currentSource?: string,
): Promise<ScreenplayContext> {
  const project = projectForFile(app, file);
  if (project === null) {
    const source = currentSource ?? (await app.vault.cachedRead(file));
    return {
      owner: file,
      project: null,
      parts: [file],
      document: parseFountain(source),
      source: stripObsidianFrontmatter(source),
      characterFolder: resolveCharacterFolder(
        file.path,
        defaultCharacterFolder,
      ),
      scopeFiles: [file],
    };
  }

  const parts = project.parts.flatMap((part) => (part.file ? [part.file] : []));
  const sources = await Promise.all(
    parts.map((part) =>
      part.path === file.path && currentSource !== undefined
        ? Promise.resolve(currentSource)
        : app.vault.cachedRead(part),
    ),
  );
  return {
    owner: project.file,
    project,
    parts,
    document: combineScreenplayDocuments(sources.map(parseFountain)),
    source: sources.map(stripObsidianFrontmatter).join("\n\n"),
    characterFolder: resolveCharacterFolder(
      project.file.path,
      project.project.characterFolder ?? defaultCharacterFolder,
    ),
    scopeFiles: [project.file, ...parts],
  };
}

export async function openAdjacentProjectPart(
  app: App,
  file: TFile,
  offset: -1 | 1,
): Promise<boolean> {
  const project = projectForPart(app, file);
  if (project === null) return false;
  const parts = project.parts.flatMap((part) => (part.file ? [part.file] : []));
  const index = parts.findIndex((part) => part.path === file.path);
  const target = parts[index + offset];
  if (!target) return false;
  await app.workspace.getLeaf(false).openFile(target);
  return true;
}
