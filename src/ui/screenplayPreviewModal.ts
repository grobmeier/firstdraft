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

import { Modal } from "obsidian";
import type { App } from "obsidian";
import type { PageSize, ScreenplayDocument } from "../screenplay/model";
import {
  CJK_LINE_HEIGHT,
  layoutScreenplay,
  screenplayElementText,
  ScreenplayLayoutError,
} from "../export/screenplayLayout";
import { hasCjkText } from "../export/pdfLanguage";

export class ScreenplayPreviewModal extends Modal {
  constructor(
    app: App,
    private readonly screenplay: ScreenplayDocument,
    private readonly pageSize: PageSize,
    private readonly screenplayTitle: string,
    private readonly exportPdf: () => Promise<void>,
  ) {
    super(app);
  }

  onOpen(): void {
    this.setTitle(`${this.screenplayTitle} - screenplay preview`);
    this.modalEl.addClass("firstdraft-preview-modal");
    this.contentEl.addClass("firstdraft-preview");

    const toolbar = this.contentEl.createDiv({
      cls: "firstdraft-preview-toolbar",
    });
    const cjk =
      Object.values(this.screenplay.titlePage ?? {}).some(hasCjkText) ||
      this.screenplay.elements.some((element) =>
        hasCjkText(screenplayElementText(element)),
      );
    toolbar.createEl("p", {
      text: cjk
        ? "Read-only preview. CJK line breaks and page count are approximate; export PDF for the measured layout. Choose the PDF language in settings for regional character forms."
        : "Read-only preview. Your Fountain source remains unchanged.",
    });
    const exportButton = toolbar.createEl("button", { text: "Export PDF" });
    exportButton.addEventListener("click", () => void this.exportPdf());

    let layout;
    try {
      layout = layoutScreenplay(
        this.screenplay,
        this.pageSize,
        cjk
          ? (text) =>
              Array.from(text).reduce(
                (width, character) =>
                  width + (hasCjkText(character) ? 12 : 7.2),
                0,
              )
          : undefined,
        cjk ? CJK_LINE_HEIGHT : undefined,
      );
    } catch (error) {
      if (!(error instanceof ScreenplayLayoutError)) throw error;
      this.contentEl.createEl("p", { text: error.message });
      return;
    }
    const pages = this.contentEl.createDiv({
      cls: "firstdraft-preview-pages",
    });
    for (const [pageIndex, layoutPage] of layout.pages.entries()) {
      const page = pages.createDiv({ cls: "firstdraft-preview-page" });
      page.style.aspectRatio = `${layout.dimensions.width} / ${layout.dimensions.height}`;
      for (const block of layoutPage.blocks) {
        const element = page.createDiv({
          cls: `firstdraft-preview-block firstdraft-preview-${block.type}`,
          text: block.lines.join("\n"),
        });
        element.style.left = `${(block.left / layout.dimensions.width) * 100}%`;
        element.style.top = `${(block.top / layout.dimensions.height) * 100}%`;
        element.style.width = `${(block.width / layout.dimensions.width) * 100}%`;
        element.style.textAlign = block.align;
        element.style.lineHeight = String(layout.lineHeight / layout.fontSize);
      }
      if (!layoutPage.titlePage)
        page.createDiv({
          cls: "firstdraft-preview-page-number",
          text: String(pageIndex + 1 - (this.screenplay.titlePage ? 1 : 0)),
        });
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
