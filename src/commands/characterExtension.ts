import type { Editor } from "obsidian";
import type FirstDraftPlugin from "../main";
import {
  isLikelyCharacterCue,
  withCharacterExtension,
} from "../screenplay/characterExtension";
import { CHARACTER_EXTENSIONS } from "../screenplay/fountain";
import { PickerModal } from "../ui/pickers";

export { isLikelyCharacterCue };

export function openCharacterExtension(
  plugin: FirstDraftPlugin,
  editor: Editor,
): void {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  if (!isLikelyCharacterCue(line)) return;

  new PickerModal(plugin.app, {
    title: "Character Extension",
    placeholder: "Choose an extension",
    items: CHARACTER_EXTENSIONS,
    itemText: (item) => item,
    onChoose: (extension) => {
      const replacement = withCharacterExtension(line, extension);
      editor.replaceRange(
        replacement,
        { line: cursor.line, ch: 0 },
        { line: cursor.line, ch: line.length },
      );
      editor.setCursor({ line: cursor.line, ch: replacement.length });
      editor.focus();
    },
  }).open();
}
