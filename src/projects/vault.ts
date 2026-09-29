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

import { TFile } from "obsidian";
import type { App, TFolder } from "obsidian";
import { stripObsidianFrontmatter } from "../export/fountain";
import { parseFountain } from "../screenplay/parser";
import type { ScreenplayDocument } from "../screenplay/model";
import {
  combineScreenplayDocuments,
  resolveCharacterFolder,
  screenplayProjectFromFrontmatter,
  screenplayProjectLinksFromFrontmatter,
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

function resolveScreenplayProject(
  app: App,
  file: TFile,
): ResolvedScreenplayProject | null {
  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  const project = screenplayProjectFromFrontmatter(file.path, frontmatter);
  if (project === null) return null;
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
  return { project, file, parts, issues };
}

function projectCandidatesForPart(app: App, file: TFile): TFile[] {
  const candidates = new Map<string, TFile>();
  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  for (const link of screenplayProjectLinksFromFrontmatter(frontmatter)) {
    const target = app.metadataCache.getFirstLinkpathDest(link, file.path);
    if (target) candidates.set(target.path, target);
  }

  let folder: TFolder | null = file.parent;
  while (folder !== null) {
    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === "md") {
        candidates.set(child.path, child);
      }
    }
    folder = folder.parent;
  }
  return [...candidates.values()];
}

function projectsForPart(app: App, file: TFile): ResolvedScreenplayProject[] {
  return projectCandidatesForPart(app, file).flatMap((candidate) => {
    const project = resolveScreenplayProject(app, candidate);
    return project?.parts.some((part) => part.file?.path === file.path)
      ? [project]
      : [];
  });
}

export function projectForPart(
  app: App,
  file: TFile,
): ResolvedScreenplayProject | null {
  const matches = projectsForPart(app, file);
  if (matches.length !== 1) return null;
  return matches[0] ?? null;
}

export function projectForFile(
  app: App,
  file: TFile,
): ResolvedScreenplayProject | null {
  return resolveScreenplayProject(app, file) ?? projectForPart(app, file);
}

export function projectMembershipIssue(app: App, file: TFile): string | null {
  const matches = projectsForPart(app, file);
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
