import { Notice } from "obsidian";
import type { MarkdownView } from "obsidian";
import type FirstDraftPlugin from "../main";
import { fdxExportPath, serializeFdx } from "../export/fdx";
import { loadScreenplayContext } from "../projects/vault";

export async function exportFdx(
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
  const path = fdxExportPath(context.owner.path, existingPaths);
  const content = serializeFdx(context.document);

  try {
    await plugin.app.vault.create(path, content);
    new Notice(`Exported Final Draft FDX to ${path}`);
  } catch (error) {
    console.error("First Draft could not export Final Draft FDX", error);
    new Notice("First Draft could not export the Final Draft FDX file.");
  }
}
