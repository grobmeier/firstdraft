import type { TFile } from "obsidian";
import type FirstDraftPlugin from "../main";

export async function openCharacterGraph(
  plugin: FirstDraftPlugin,
  characterFile: TFile,
): Promise<void> {
  const existing = plugin.app.workspace.getLeavesOfType("localgraph")[0];
  const leaf = existing ?? plugin.app.workspace.getRightLeaf(true);
  if (leaf === null) return;
  await leaf.setViewState({
    type: "localgraph",
    active: true,
    state: { file: characterFile.path },
  });
  await plugin.app.workspace.revealLeaf(leaf);
}
