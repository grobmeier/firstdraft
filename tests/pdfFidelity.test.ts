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

import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { parseFountain } from "../src/screenplay/parser";
import { titlePageFromFrontmatter } from "../src/screenplay/titlePage";
import { combineScreenplayDocuments } from "../src/projects/model";
import {
  layoutScreenplay,
  ScreenplayLayoutError,
} from "../src/export/screenplayLayout";
import { serializePdf, UnsupportedPdfTextError } from "../src/export/pdf";
import type { PageSize } from "../src/screenplay/model";
import { testCjkFonts } from "./fixtures/cjkFonts";

describe("PDF title pages", () => {
  it("handles BOM/CRLF title blocks and does not recognise inherited field names", () => {
    expect(
      parseFountain("\uFEFFTitle: Night\r\nAuthor: Alex\r\n\r\nINT. ROOM - DAY")
        .titlePage?.title,
    ).toBe("Night");
    const document = parseFountain(
      "Title: Night\nconstructor: ordinary action\n\nINT. ROOM - DAY",
    );
    expect(document.elements[0]?.text).toBe("constructor: ordinary action");
  });
  it("extracts leading Fountain fields and indented values without changing source positions", () => {
    const source =
      "Title: The Long Night\nCredit: Written by\nAuthor:\n    Alex Example\nSource: An original screenplay\nDraft date: 1 October 2026\nContact:\n    Writer's office\n    Example City\n\nINT. OFFICE - NIGHT\n\n!Rain falls.";
    const document = parseFountain(source);
    expect(document.titlePage).toEqual({
      title: "The Long Night",
      credit: "Written by",
      author: "Alex Example",
      source: "An original screenplay",
      draftDate: "1 October 2026",
      contact: "Writer's office\nExample City",
    });
    expect(document.elements[0]).toMatchObject({
      type: "scene-heading",
      line: 11,
    });
    expect(document.elements).toHaveLength(2);
    expect(source).toContain("Title: The Long Night");
  });
  it("does not interpret metadata-like action later in the screenplay", () => {
    const document = parseFountain(
      "INT. OFFICE - DAY\n\nTitle: the label on a folder.",
    );
    expect(document.titlePage).toBeUndefined();
    expect(document.elements[1]?.text).toBe("Title: the label on a folder.");
  });
  it("requires an explicit nonempty title and accepts only string properties", () => {
    expect(titlePageFromFrontmatter({ author: "Writer" })).toBeUndefined();
    expect(titlePageFromFrontmatter({ title: "  " })).toBeUndefined();
    expect(
      titlePageFromFrontmatter({
        title: " Night ",
        author: " Alex ",
        "draft-date": "2026-10-01",
        contact: 42,
      }),
    ).toEqual({ title: "Night", author: "Alex", draftDate: "2026-10-01" });
  });
  it("does not inherit part title pages into combined project documents", () => {
    const document = combineScreenplayDocuments([
      parseFountain("Title: Part One\n\nINT. ROOM - DAY"),
      parseFountain("Title: Part Two\n\nEXT. ROAD - NIGHT"),
    ]);
    expect(document.titlePage).toBeUndefined();
    expect(document.elements).toHaveLength(2);
    document.titlePage = titlePageFromFrontmatter({ title: "Project Title" });
    expect(
      layoutScreenplay(document, "a4").pages.filter((page) => page.titlePage),
    ).toHaveLength(1);
  });
  it.each(["us-letter", "a4"] as PageSize[])(
    "renders an unnumbered title page before the body on %s",
    async (pageSize) => {
      const document = parseFountain(
        "Title: The Long Night\nCredit: Written by\nAuthor: Alex Example\nContact: Example office\n\nINT. OFFICE - NIGHT\n\n!Rain falls.",
      );
      const snapshot = JSON.stringify(document);
      const layout = layoutScreenplay(document, pageSize);
      expect(layout.pages).toHaveLength(2);
      expect(layout.pages[0]?.titlePage).toBe(true);
      expect(layout.pages[1]?.titlePage).toBeUndefined();
      expect(layout.pages[0]?.blocks[0]?.align).toBe("center");
      const pdf = await PDFDocument.load(
        await serializePdf(document, { pageSize, title: "Night" }),
      );
      expect(pdf.getPageCount()).toBe(2);
      expect(JSON.stringify(document)).toBe(snapshot);
    },
  );
  it("uses CJK fonts when only the title metadata contains CJK", async () => {
    const document = parseFountain(
      "Title: 東京の夜\nAuthor: 美咲\n\nINT. OFFICE - NIGHT",
    );
    expect(
      (
        await serializePdf(document, {
          pageSize: "a4",
          title: "Night",
          language: "ja",
          loadCjkFonts: testCjkFonts,
        })
      ).length,
    ).toBeGreaterThan(1000);
  });
  it("rejects unsupported characters in metadata", async () => {
    await expect(
      serializePdf(parseFountain("Title: Night 🙂\n\nINT. ROOM - DAY"), {
        pageSize: "a4",
        title: "Night",
      }),
    ).rejects.toBeInstanceOf(UnsupportedPdfTextError);
  });
  it("rejects metadata that cannot fit instead of clipping", () => {
    const document = parseFountain(
      `Title: ${"A very long title ".repeat(400)}\n\nINT. ROOM - DAY`,
    );
    expect(() => layoutScreenplay(document, "us-letter")).toThrow(
      ScreenplayLayoutError,
    );
  });
});

describe("dialogue page continuation", () => {
  it.each(["us-letter", "a4"] as PageSize[])(
    "preserves a multi-page speech and repeats speaker cues on %s",
    (pageSize) => {
      const source = `INT. ROOM - DAY\n\nALEX (V.O.)\n(quietly)\n${Array.from({ length: 200 }, (_, index) => `Line ${index}.`).join("\n")}`;
      const document = parseFountain(source);
      const snapshot = JSON.stringify(document);
      const layout = layoutScreenplay(document, pageSize);
      const dialoguePages = layout.pages.filter((page) =>
        page.blocks.some((block) => block.type === "dialogue"),
      );
      expect(dialoguePages.length).toBeGreaterThan(2);
      expect(
        dialoguePages[0]?.blocks.find((block) => block.type === "character")
          ?.lines,
      ).toEqual(["ALEX (V.O.)"]);
      for (const page of dialoguePages.slice(1))
        expect(page.blocks[0]?.lines).toEqual(["ALEX (V.O.) (CONT'D)"]);
      for (const page of dialoguePages.slice(0, -1))
        expect(page.blocks[page.blocks.length - 1]?.lines).toEqual(["(MORE)"]);
      expect(
        dialoguePages[dialoguePages.length - 1]?.blocks.flatMap(
          (block) => block.lines,
        ),
      ).not.toContain("(MORE)");
      const dialogue = layout.pages.flatMap((page) =>
        page.blocks
          .filter((block) => block.type === "dialogue")
          .flatMap((block) => block.lines),
      );
      expect(dialogue).toEqual(
        Array.from({ length: 200 }, (_, index) => `Line ${index}.`),
      );
      for (const page of layout.pages)
        for (const block of page.blocks)
          expect(
            block.top + block.lines.length * layout.lineHeight,
          ).toBeLessThanOrEqual(layout.dimensions.height - 60 + 0.001);
      expect(JSON.stringify(document)).toBe(snapshot);
    },
  );
  it("moves a short speech intact when the current page is almost full", () => {
    const document = parseFountain(
      `!${"x ".repeat(1500)}\n\nALEX\n(quietly)\n${"Hello.\n".repeat(10)}`,
    );
    const layout = layoutScreenplay(document, "us-letter");
    const speechPages = layout.pages.filter((page) =>
      page.blocks.some((block) => block.type === "character"),
    );
    expect(speechPages).toHaveLength(1);
    expect(
      layout.pages.flatMap((page) =>
        page.blocks.flatMap((block) => block.lines),
      ),
    ).not.toContain("(MORE)");
  });
  it("keeps parentheticals with following dialogue at a split boundary", () => {
    const document = parseFountain(
      `ALEX\n${"Hello.\n".repeat(53)}(after a long silence)\nOne more thing.\n${"Goodbye.\n".repeat(70)}`,
    );
    const layout = layoutScreenplay(document, "us-letter");
    for (const page of layout.pages) {
      const lines = page.blocks.flatMap((block) => block.lines);
      const index = lines.indexOf("(after a long silence)");
      if (index >= 0) expect(lines[index + 1]).toBe("One more thing.");
    }
  });
  it("does not duplicate an existing continuation extension", () => {
    const layout = layoutScreenplay(
      parseFountain(`ALEX (V.O.) (CONT'D)\n${"Hello.\n".repeat(100)}`),
      "us-letter",
    );
    for (const page of layout.pages)
      for (const cue of page.blocks.filter(
        (block) => block.type === "character",
      ))
        expect(cue.lines.join(" ")).toBe("ALEX (V.O.) (CONT'D)");
  });
  it("never adds speech markers to action", () => {
    const layout = layoutScreenplay(
      parseFountain(`!${"Rain falls. ".repeat(1000)}`),
      "a4",
    );
    expect(
      layout.pages
        .flatMap((page) => page.blocks)
        .every((block) => block.type === "action"),
    ).toBe(true);
  });
  it("rejects an oversized parenthetical safely", () => {
    const document = parseFountain(`ALEX\n(${"quietly ".repeat(500)})\nHello.`);
    expect(() => layoutScreenplay(document, "us-letter")).toThrow(
      ScreenplayLayoutError,
    );
  });
});
