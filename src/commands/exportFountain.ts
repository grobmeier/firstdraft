import { Notice } from "obsidian";
import type { MarkdownView } from "obsidian";
import type FirstDraftPlugin from "../main";
import { fountainExportPath } from "../export/fountain";
import { loadScreenplayContext } from "../projects/vault";

export async function exportFountain(
  plugin: FirstDraftPlugin,
  view: MarkdownView,
): Promise<void> {
  const file = view.file;
  if (file === null) return;

  const existingPaths = new Set(
    plugin.app.vault.getFiles().map((candidate) => candidate.path),
  );
  const context = await loadScreenplayContext(
    plugin.app,
    file,
    plugin.settings.characterFolder,
    plugin.isScreenplayFile(file) ? view.editor.getValue() : undefined,
  );
  const path = fountainExportPath(context.owner.path, existingPaths);
  const content = context.source;

  try {
    const exported = await plugin.app.vault.create(path, content);
    new Notice(`Exported screenplay to ${path}`);
    await plugin.app.workspace.getLeaf(false).openFile(exported);
  } catch (error) {
    console.error("First Draft could not export Fountain", error);
    new Notice("First Draft could not export the screenplay.");
  }
}
