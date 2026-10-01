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

import { PDFDict, PDFDocument, PDFName } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  pdfExportPath,
  serializePdf,
  UnsupportedPdfTextError,
} from "../src/export/pdf";
import { parseFountain } from "../src/screenplay/parser";
import { embedScreenplayFonts } from "../src/export/pdfFonts";
import { layoutScreenplay } from "../src/export/screenplayLayout";

describe("PDF export", () => {
  it.each(["us-letter", "a4"] as const)(
    "embeds fonts for extended Latin, Greek and Cyrillic on %s",
    async (pageSize) => {
      const text =
        "INT. ŁÓDŹ - DAY\n\nŻANETA\nPříliš žluťoučký kůň. Ελληνικά. Привет, мир. Cafe\u0301?";
      const document = parseFountain(text);
      const before = JSON.stringify(document);
      const pdf = await PDFDocument.load(
        await serializePdf(document, {
          pageSize,
          title: "International draft",
        }),
      );
      expect(
        pdf.context
          .enumerateIndirectObjects()
          .some(
            ([, object]) =>
              object instanceof PDFDict && object.has(PDFName.of("FontFile2")),
          ),
      ).toBe(true);
      expect(pdf.getPageCount()).toBe(
        layoutScreenplay(document, pageSize).pages.length,
      );
      expect(JSON.stringify(document)).toBe(before);
    },
  );

  it("uses Courier-compatible fixed-width metrics and detects missing glyphs in both weights", async () => {
    const { regular, bold } = await embedScreenplayFonts(
      await PDFDocument.create(),
    );
    for (const font of [regular, bold]) {
      expect(font.widthOfTextAtSize("MMMM", 12)).toBeCloseTo(28.8, 1);
      expect(font.widthOfTextAtSize("iiii", 12)).toBe(
        font.widthOfTextAtSize("MMMM", 12),
      );
      const characters = new Set(font.getCharacterSet());
      for (const character of "ŁŻřůΕλΠривет\u0301")
        expect(characters.has(character.codePointAt(0) ?? -1)).toBe(true);
      expect(characters.has(0x1f642)).toBe(false);
      expect(characters.has(0x4f60)).toBe(false);
    }
  });

  it.each(["us-letter", "a4"] as const)(
    "preserves multi-page pagination on %s",
    async (pageSize) => {
      const document = parseFountain(
        Array.from(
          { length: 30 },
          (_, index) =>
            `INT. OFFICE ${index + 1} - DAY\n\nJANE\n${"A consistent line of dialogue. ".repeat(8)}`,
        ).join("\n\n"),
      );
      const layout = layoutScreenplay(document, pageSize);
      const pdf = await PDFDocument.load(
        await serializePdf(document, { pageSize, title: "Pagination" }),
      );
      expect(layout.pages.length).toBeGreaterThan(1);
      expect(pdf.getPageCount()).toBe(layout.pages.length);
    },
  );

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
    const source = "INT. ROOM - DAY\n\nJANE\n🙂 🙂";
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
    expect(caught.characters).toEqual(["🙂"]);
    expect(caught.truncated).toBe(false);
    expect(caught.message).toContain("U+1F642");
    expect(caught.message).toContain("No PDF was saved");
    expect(caught.message).toContain("Export to Fountain");
    expect(JSON.stringify(document)).toBe(original);
  });

  it("bounds diagnostics and validates bold headings as well as dialogue", async () => {
    await expect(
      serializePdf(parseFountain("INT. 😀😁😂😃😄😅😆😇😈😉 - DAY"), {
        pageSize: "a4",
        title: "Bounded",
      }),
    ).rejects.toMatchObject({
      name: "UnsupportedPdfTextError",
      characters: ["😀", "😁", "😂", "😃", "😄", "😅", "😆", "😇"],
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
