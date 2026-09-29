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

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PDFFont } from "pdf-lib";
import type { PageSize, ScreenplayDocument } from "../screenplay/model";
import { layoutScreenplay } from "./screenplayLayout";

export interface PdfExportOptions {
  pageSize: PageSize;
  title: string;
}

function encodableText(font: PDFFont, value: string): string {
  return [...value]
    .map((character) => {
      try {
        font.encodeText(character);
        return character;
      } catch {
        return "?";
      }
    })
    .join("");
}

export async function serializePdf(
  document: ScreenplayDocument,
  options: PdfExportOptions,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(options.title);
  pdf.setCreator("First Draft for Obsidian");
  pdf.setProducer("First Draft for Obsidian");
  const regular = await pdf.embedFont(StandardFonts.Courier);
  const bold = await pdf.embedFont(StandardFonts.CourierBold);
  const layout = layoutScreenplay(document, options.pageSize);

  for (const [pageIndex, layoutPage] of layout.pages.entries()) {
    const page = pdf.addPage([
      layout.dimensions.width,
      layout.dimensions.height,
    ]);
    for (const block of layoutPage.blocks) {
      const font =
        block.type === "scene-heading" || block.type === "character"
          ? bold
          : regular;
      for (const [lineIndex, rawLine] of block.lines.entries()) {
        const text = encodableText(font, rawLine);
        const textWidth = font.widthOfTextAtSize(text, layout.fontSize);
        const x =
          block.align === "right"
            ? block.left + Math.max(0, block.width - textWidth)
            : block.left;
        const y =
          layout.dimensions.height -
          block.top -
          layout.fontSize -
          lineIndex * layout.lineHeight;
        page.drawText(text, {
          x,
          y,
          size: layout.fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      }
    }

    const pageNumber = String(pageIndex + 1);
    const numberWidth = regular.widthOfTextAtSize(pageNumber, 10);
    page.drawText(pageNumber, {
      x: layout.dimensions.width - 72 - numberWidth,
      y: 30,
      size: 10,
      font: regular,
      color: rgb(0.25, 0.25, 0.25),
    });
  }

  return pdf.save();
}

export function pdfExportPath(
  sourcePath: string,
  existingPaths: Pick<ReadonlySet<string>, "has">,
  preferredBasename?: string,
): string {
  const slash = sourcePath.lastIndexOf("/");
  const directory = slash === -1 ? "" : sourcePath.slice(0, slash + 1);
  const filename = slash === -1 ? sourcePath : sourcePath.slice(slash + 1);
  const dot = filename.lastIndexOf(".");
  const basename = dot === -1 ? filename : filename.slice(0, dot);
  const extension = dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
  const safePreferredBasename = preferredBasename
    ?.replace(/[\\/:*?"<>|]/gu, "-")
    .trim();
  const exportBase =
    safePreferredBasename ||
    (extension === "pdf" ? `${basename}-export` : basename);

  let candidate = `${directory}${exportBase}.pdf`;
  let suffix = 2;
  while (existingPaths.has(candidate)) {
    candidate = `${directory}${exportBase}-${suffix}.pdf`;
    suffix += 1;
  }
  return candidate;
}
