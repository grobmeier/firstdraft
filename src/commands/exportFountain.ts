import { Notice } from "obsidian";
import type { MarkdownView } from "obsidian";
import type FirstDraftPlugin from "../main";
import {
  fountainExportPath,
  stripObsidianFrontmatter,
} from "../export/fountain";

export async function exportFountain(
  plugin: FirstDraftPlugin,
  view: MarkdownView,
): Promise<void> {
  const file = view.file;
  if (file === null) return;

  const existingPaths = new Set(
    plugin.app.vault.getFiles().map((candidate) => candidate.path),
  );
  const path = fountainExportPath(file.path, existingPaths);
  const content = stripObsidianFrontmatter(view.editor.getValue());

  try {
    const exported = await plugin.app.vault.create(path, content);
    new Notice(`Exported screenplay to ${path}`);
    await plugin.app.workspace.getLeaf(false).openFile(exported);
  } catch (error) {
    console.error("First Draft could not export Fountain", error);
    new Notice("First Draft could not export the screenplay.");
  }
}
