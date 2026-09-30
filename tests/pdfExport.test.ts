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

import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  pdfExportPath,
  serializePdf,
  UnsupportedPdfTextError,
} from "../src/export/pdf";
import { parseFountain } from "../src/screenplay/parser";

describe("PDF export", () => {
  it.each(["us-letter", "a4"] as const)(
    "preserves supported accents and genuine question marks on %s",
    async (pageSize) => {
      const bytes = await serializePdf(
        parseFountain("INT. CAFÉ - DAY\n\nJANE\nÇa va? Grüße, señor."),
        { pageSize, title: "Accents" },
      );
      expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
    },
  );

  it("rejects unsupported text with deduplicated Unicode diagnostics", async () => {
    const source = "INT. ROOM - DAY\n\nJANE\n你好 🙂 你好 🙂";
    const document = parseFountain(source);
    const original = JSON.stringify(document);
    let caught: unknown;
    try {
      await serializePdf(document, {
        pageSize: "us-letter",
        title: "Unsupported",
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(UnsupportedPdfTextError);
    if (!(caught instanceof UnsupportedPdfTextError))
      throw new Error("Expected PDF text error");
    expect(caught.characters).toEqual(["你", "好", "🙂"]);
    expect(caught.truncated).toBe(false);
    expect(caught.message).toContain("U+1F642");
    expect(caught.message).toContain("No PDF was saved");
    expect(caught.message).toContain("Export to Fountain");
    expect(JSON.stringify(document)).toBe(original);
  });

  it("bounds diagnostics and validates bold headings as well as dialogue", async () => {
    await expect(
      serializePdf(parseFountain("INT. 一二三四五六七八九十 - DAY"), {
        pageSize: "a4",
        title: "Bounded",
      }),
    ).rejects.toMatchObject({
      name: "UnsupportedPdfTextError",
      characters: ["一", "二", "三", "四", "五", "六", "七", "八"],
      truncated: true,
    });
  });

  it("creates a readable PDF with metadata and pages", async () => {
    const bytes = await serializePdf(
      parseFountain(`INT. KITCHEN - DAY

JANE
(smiling)
This is the first draft.

>FADE OUT:`),
      { pageSize: "us-letter", title: "The Long Night" },
    );
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getTitle()).toBe("The Long Night");
    expect(pdf.getCreator()).toBe("First Draft for Obsidian");
  });

  it("uses A4 dimensions when configured", async () => {
    const bytes = await serializePdf(parseFountain("INT. OFFICE - DAY"), {
      pageSize: "a4",
      title: "A4 Draft",
    });
    const [page] = (await PDFDocument.load(bytes)).getPages();

    expect(page?.getWidth()).toBeCloseTo(595.28, 2);
    expect(page?.getHeight()).toBeCloseTo(841.89, 2);
  });

  it("uses a non-destructive numbered export path", () => {
    expect(
      pdfExportPath(
        "Long Night/Screenplay Project.md",
        new Set([
          "Long Night/Screenplay Project.pdf",
          "Long Night/Screenplay Project-2.pdf",
        ]),
      ),
    ).toBe("Long Night/Screenplay Project-3.pdf");
  });

  it("uses a filesystem-safe project title without overwriting", () => {
    expect(
      pdfExportPath(
        "Long Night/Screenplay Project.md",
        new Set(["Long Night/The Long Night.pdf"]),
        "The Long Night: Act One",
      ),
    ).toBe("Long Night/The Long Night- Act One.pdf");
  });
});
