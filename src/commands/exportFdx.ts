import { Notice } from "obsidian";
import type { MarkdownView } from "obsidian";
import type FirstDraftPlugin from "../main";
import { fdxExportPath, serializeFdx } from "../export/fdx";
import { parseFountain } from "../screenplay/parser";

export async function exportFdx(
  plugin: FirstDraftPlugin,
  view: MarkdownView,
): Promise<void> {
  const file = view.file;
  if (file === null) return;

  const existingPaths = new Set(
    plugin.app.vault.getFiles().map((candidate) => candidate.path),
  );
  const path = fdxExportPath(file.path, existingPaths);
  const content = serializeFdx(parseFountain(view.editor.getValue()));

  try {
    await plugin.app.vault.create(path, content);
    new Notice(`Exported Final Draft FDX to ${path}`);
  } catch (error) {
    console.error("First Draft could not export Final Draft FDX", error);
    new Notice("First Draft could not export the Final Draft FDX file.");
  }
}
