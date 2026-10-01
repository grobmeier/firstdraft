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

import {
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  decodePDFRawStream,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { embedCjkFonts, localizeFont } from "../src/export/cjkFonts";
import { hasCjkText, isPdfLanguage } from "../src/export/pdfLanguage";
import { serializePdf, UnsupportedPdfTextError } from "../src/export/pdf";
import { parseFountain } from "../src/screenplay/parser";
import { layoutScreenplay } from "../src/export/screenplayLayout";
import { wrapMeasuredText } from "../src/export/measuredWrapping";
import { decodeWoff } from "../src/export/woff";

describe("CJK PDF export", () => {
  it("decodes the same font with native compression and the older-browser fallback", async () => {
    const bytes = readFileSync(
      new URL(
        "../assets/fonts/noto-cjk/NotoSansCJK-Regular.woff",
        import.meta.url,
      ),
    );
    const native = await decodeWoff(bytes);
    try {
      vi.stubGlobal("DecompressionStream", undefined);
      const fallback = await decodeWoff(bytes);
      expect(Buffer.from(fallback).equals(Buffer.from(native))).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("rejects malformed font headers before allocating tables", async () => {
    await expect(decodeWoff(new Uint8Array(44))).rejects.toThrow(
      "Invalid bundled WOFF",
    );
    const invalid = new Uint8Array(64);
    const header = new DataView(invalid.buffer);
    header.setUint32(0, 0x774f4646);
    header.setUint16(12, 1);
    await expect(decodeWoff(invalid)).rejects.toThrow(
      "Invalid bundled font directory",
    );
  });
  it.each(["us-letter", "a4"] as const)(
    "exports all four languages on %s",
    async (pageSize) => {
      for (const language of ["zh-Hans", "zh-Hant", "ja", "ko"] as const) {
        const doc = parseFountain(
          "INT. 东京 - DAY\n\n@美咲\n你好，世界！繁體中文。こんにちは。한국어 대사. Mixed English.\n\n!" +
            "雨が静かに降る。窗外下着雨。오늘은 비가 옵니다. ".repeat(100),
        );
        const before = JSON.stringify(doc);
        const bytes = await serializePdf(doc, {
          pageSize,
          title: "CJK",
          language,
        });
        const pdf = await PDFDocument.load(bytes);
        expect(pdf.getPageCount()).toBeGreaterThan(1);
        expect(bytes.length).toBeLessThan(200_000);
        const fonts = pdf.context
          .enumerateIndirectObjects()
          .flatMap(([, object]) => {
            if (
              !(object instanceof PDFDict) ||
              !object.has(PDFName.of("FontFile2"))
            )
              return [];
            const stream = pdf.context.lookup(
              object.get(PDFName.of("FontFile2")),
            );
            if (!(stream instanceof PDFRawStream))
              throw new Error("Missing embedded TrueType stream");
            return [fontkit.create(decodePDFRawStream(stream).decode())];
          });
        expect(fonts).toHaveLength(2);
        for (const font of fonts) {
          expect(font.numGlyphs).toBeGreaterThan(10);
          // Round-trip the actual embedded subset, not just the source font.
          expect(font.getGlyph(1).path.toSVG().length).toBeGreaterThan(0);
        }
        expect(JSON.stringify(doc)).toBe(before);
      }
    },
    60000,
  );

  it("applies regional glyph forms independently, including mixed Latin/Han lines", async () => {
    const bytes = readFileSync(
      new URL(
        "../assets/fonts/noto-cjk/NotoSansCJK-Regular.woff",
        import.meta.url,
      ),
    );
    const decoded = await decodeWoff(bytes);
    const jp = localizeFont(fontkit.create(decoded), "ja");
    const sc = localizeFont(fontkit.create(decoded), "zh-Hans");
    const tc = localizeFont(fontkit.create(decoded), "zh-Hant");
    const ids = (font: typeof jp) =>
      font.layout("INT. 骨令 - DAY").glyphs.map((g) => g.id);
    const original = ids(jp);
    expect(ids(sc)).not.toEqual(original);
    expect(ids(tc)).not.toEqual(ids(sc));
    expect(ids(jp)).toEqual(original);
    const kr = localizeFont(fontkit.create(decoded), "ko");
    expect(kr.layout("한").glyphs.map((g) => g.id)).toEqual(
      kr.layout("한").glyphs.map((g) => g.id),
    );
  });

  it("measures both weights and fits every mixed-script line within its column", async () => {
    const { regular, bold } = await embedCjkFonts(
      await PDFDocument.create(),
      "ko",
    );
    const doc = parseFountain(
      "INT. 서울 - DAY\n\n@민수\n" + "안녕하세요. Hello, 世界。 ".repeat(40),
    );
    for (const size of ["us-letter", "a4"] as const) {
      const layout = layoutScreenplay(doc, size, (text, type) =>
        (type === "character" || type === "scene-heading"
          ? bold
          : regular
        ).widthOfTextAtSize(text, 12),
      );
      for (const page of layout.pages)
        for (const block of page.blocks) {
          const font =
            block.type === "character" || block.type === "scene-heading"
              ? bold
              : regular;
          for (const line of block.lines)
            expect(font.widthOfTextAtSize(line, 12)).toBeLessThanOrEqual(
              block.width + 0.001,
            );
          expect(
            block.top + block.lines.length * layout.lineHeight,
          ).toBeLessThanOrEqual(layout.dimensions.height - 60);
        }
    }
  });

  it("retains bounded unsupported-glyph errors for CJK documents", async () => {
    await expect(
      serializePdf(parseFountain("INT. 室内 - DAY\n\n@小李\n你好 🙂 𱍐"), {
        pageSize: "a4",
        title: "Missing",
      }),
    ).rejects.toMatchObject({
      name: "UnsupportedPdfTextError",
      characters: ["🙂", "𱍐"],
    });
    expect(UnsupportedPdfTextError.prototype).toBeInstanceOf(Error);
  });

  it("preserves every sampled glyph outline through TrueType subsetting", async () => {
    for (const weight of ["Regular", "Bold"]) {
      const font = fontkit.create(
        await decodeWoff(
          readFileSync(
            new URL(
              `../assets/fonts/noto-cjk/NotoSansCJK-${weight}.woff`,
              import.meta.url,
            ),
          ),
        ),
      );
      const subset = font.createSubset();
      const shapes = font
        .layout("INT. 東京 北京 서울 こんにちは 한국어 Hello")
        .glyphs.map((glyph) => ({
          id: subset.includeGlyph(glyph),
          path: glyph.path.toSVG(),
        }));
      const chunks: Uint8Array[] = [];
      await new Promise<void>((resolve) => {
        subset
          .encodeStream()
          .on("data", (chunk) => chunks.push(chunk))
          .on("end", () => resolve());
      });
      const bytes = new Uint8Array(
        chunks.reduce((size, chunk) => size + chunk.length, 0),
      );
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      const embedded = fontkit.create(bytes);
      for (const shape of shapes)
        expect(embedded.getGlyph(shape.id).path.toSVG()).toBe(shape.path);
    }
  });

  it("wraps CJK at legal punctuation boundaries and preserves grapheme clusters", () => {
    const width = (text: string) =>
      [
        ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
          text,
        ),
      ].length;
    const value = "你好，世界。こんにちは（世界）。";
    const lines = wrapMeasuredText(value, 5, width);
    expect(lines.join("")).toBe(value);
    for (const line of lines) {
      expect(line).not.toMatch(/^[，。、）]/u);
      expect(line).not.toMatch(/[（]$/u);
      expect(width(line)).toBeLessThanOrEqual(5);
    }
    expect(wrapMeasuredText("Cafe\u0301Cafe\u0301", 4, width)).toEqual([
      "Cafe\u0301",
      "Cafe\u0301",
    ]);
    expect(wrapMeasuredText("𠀀𠀀𠀀", 1, width)).toEqual(["𠀀", "𠀀", "𠀀"]);
    expect(wrapMeasuredText("안녕 세계입니다", 5, width)).toEqual([
      "안녕",
      "세계입니다",
    ]);
  });

  it("validates languages and detects all three scripts without guessing Han language", () => {
    for (const text of ["汉字", "漢字", "かなカナ", "한글", "，"])
      expect(hasCjkText(text)).toBe(true);
    expect(hasCjkText("Łódź Ελληνικά Привет")).toBe(false);
    for (const language of ["zh-Hans", "zh-Hant", "ja", "ko"])
      expect(isPdfLanguage(language)).toBe(true);
    for (const invalid of ["toString", "auto", null])
      expect(isPdfLanguage(invalid)).toBe(false);
  });
});
