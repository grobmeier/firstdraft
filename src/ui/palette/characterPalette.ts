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

import type { TFile } from "obsidian";
import {
  characterPageFromFrontmatter,
  wikiLinkTarget,
  type CharacterPage,
} from "../../characters/catalogue";
import { characterDocumentUsage } from "../../characters/usage";
import { openCharacterGraph } from "../../commands/characterGraph";
import type FirstDraftPlugin from "../../main";
import { loadScreenplayContext } from "../../projects/vault";
import { parseFountain } from "../../screenplay/parser";

export function renderCharacterPalette(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
  file: TFile,
  isCurrent: () => boolean,
): void {
  const frontmatter = plugin.app.metadataCache.getFileCache(file)?.frontmatter;
  const page = characterPageFromFrontmatter(file.path, frontmatter);
  if (page === null) return;

  container.createEl("h3", { text: page.character });
  if (page.aliases.length > 0) {
    container.createEl("p", {
      cls: "firstdraft-palette-muted",
      text: `Aliases: ${page.aliases.join(", ")}`,
    });
  }
  const graph = container.createEl("button", {
    cls: "mod-cta firstdraft-character-graph",
    text: "Open local graph",
  });
  graph.addEventListener("click", () => void openCharacterGraph(plugin, file));

  const usage = container.createEl("p", {
    cls: "firstdraft-palette-muted",
    text: "Calculating linked screenplay usage…",
  });
  void renderCharacterUsage(plugin, usage, page, isCurrent);
  renderCharacterLinks(
    plugin,
    container,
    "Screenplays",
    page.screenplays,
    page,
  );
  renderCharacterLinks(plugin, container, "Relationships", page.related, page);
  const appearances = container.createDiv();
  void renderCharacterAppearances(plugin, appearances, page, isCurrent);
}

async function renderCharacterUsage(
  plugin: FirstDraftPlugin,
  element: HTMLElement,
  page: CharacterPage,
  isCurrent: () => boolean,
): Promise<void> {
  let cueAppearances = 0;
  let dialogueBlocks = 0;
  let scenes = 0;
  let screenplays = 0;
  for (const link of page.screenplays) {
    const file = plugin.app.metadataCache.getFirstLinkpathDest(
      wikiLinkTarget(link),
      page.path,
    );
    if (!file) continue;
    const context = await loadScreenplayContext(
      plugin.app,
      file,
      plugin.settings.characterFolder,
    );
    const usage = characterDocumentUsage(page, context.document);
    cueAppearances += usage.cueAppearances;
    dialogueBlocks += usage.dialogueBlocks;
    scenes += usage.scenes;
    screenplays += 1;
  }
  if (!isCurrent()) return;
  element.setText(
    `${screenplays} linked screenplay${screenplays === 1 ? "" : "s"} · ` +
      `${scenes} scene${scenes === 1 ? "" : "s"} · ` +
      `${cueAppearances} cue${cueAppearances === 1 ? "" : "s"} · ` +
      `${dialogueBlocks} dialogue block${dialogueBlocks === 1 ? "" : "s"}`,
  );
}

async function renderCharacterAppearances(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
  page: CharacterPage,
  isCurrent: () => boolean,
): Promise<void> {
  const appearances: Array<{ file: TFile; label: string; cues: number }> = [];
  const seen = new Set<string>();
  for (const link of page.screenplays) {
    const owner = plugin.app.metadataCache.getFirstLinkpathDest(
      wikiLinkTarget(link),
      page.path,
    );
    if (!owner) continue;
    const context = await loadScreenplayContext(
      plugin.app,
      owner,
      plugin.settings.characterFolder,
    );
    for (const part of context.parts) {
      if (seen.has(part.path)) continue;
      const source = await plugin.app.vault.cachedRead(part);
      const usage = characterDocumentUsage(page, parseFountain(source));
      if (usage.cueAppearances === 0) continue;
      seen.add(part.path);
      appearances.push({
        file: part,
        label: part.basename,
        cues: usage.cueAppearances,
      });
    }
  }
  if (!isCurrent() || appearances.length === 0) return;
  container.createEl("h3", { text: "Appearances" });
  const list = container.createDiv({ cls: "firstdraft-palette-items" });
  for (const appearance of appearances) {
    const button = list.createEl("button", {
      cls: "firstdraft-palette-item",
      text: `${appearance.label} · ${appearance.cues} cue${appearance.cues === 1 ? "" : "s"}`,
    });
    button.addEventListener(
      "click",
      () => void plugin.app.workspace.getLeaf(false).openFile(appearance.file),
    );
  }
}

function renderCharacterLinks(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
  heading: string,
  links: readonly string[],
  page: CharacterPage,
): void {
  container.createEl("h3", { text: heading });
  if (links.length === 0) {
    container.createEl("p", {
      cls: "firstdraft-palette-empty",
      text: `No ${heading.toLocaleLowerCase()} linked yet.`,
    });
    return;
  }
  const list = container.createDiv({ cls: "firstdraft-palette-items" });
  for (const link of links) {
    const target = wikiLinkTarget(link);
    const button = list.createEl("button", {
      cls: "firstdraft-palette-item",
      text: target.split("/").at(-1) ?? target,
    });
    button.addEventListener("click", () => {
      const file = plugin.app.metadataCache.getFirstLinkpathDest(
        target,
        page.path,
      );
      if (file) void plugin.app.workspace.getLeaf("tab").openFile(file);
    });
  }
}
