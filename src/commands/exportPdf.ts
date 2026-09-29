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

import { Notice } from "obsidian";
import type { MarkdownView } from "obsidian";
import type FirstDraftPlugin from "../main";
import { pdfExportPath, serializePdf } from "../export/pdf";
import { loadScreenplayContext } from "../projects/vault";

export async function exportPdf(
  plugin: FirstDraftPlugin,
  view: MarkdownView,
): Promise<void> {
  const file = view.file;
  if (file === null) return;

  const context = await loadScreenplayContext(
    plugin.app,
    file,
    plugin.settings.characterFolder,
    plugin.isScreenplayFile(file) ? view.editor.getValue() : undefined,
  );
  const title = context.project?.project.title ?? context.owner.basename;
  const path = pdfExportPath(
    context.owner.path,
    {
      has: (candidate: string) =>
        plugin.app.vault.getAbstractFileByPath(candidate) !== null,
    },
    title,
  );

  try {
    const content = await serializePdf(context.document, {
      pageSize: plugin.settings.pageSize,
      title,
    });
    const buffer = content.buffer.slice(
      content.byteOffset,
      content.byteOffset + content.byteLength,
    ) as ArrayBuffer;
    await plugin.app.vault.createBinary(path, buffer);
    new Notice(`Exported screenplay PDF to ${path}`);
  } catch (error) {
    console.error("First Draft could not export PDF", error);
    new Notice("First Draft could not export the screenplay PDF.");
  }
}
