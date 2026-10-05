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

import { describe, expect, it, vi } from "vitest";
import {
  CJK_FONT_FILES,
  FONT_CHUNK_BYTES,
  CjkFontPackError,
  installCjkFontPack,
  loadCjkFontPack,
} from "../src/export/cjkFontPack";
import { testCjkFonts } from "./fixtures/cjkFonts";
import { serializePdf } from "../src/export/pdf";
import { parseFountain } from "../src/screenplay/parser";
import { PDFDocument } from "pdf-lib";

function fixture() {
  const files = new Map<string, ArrayBuffer>();
  const root = "custom-config/plugins/firstdraft";
  const directories = new Set([root]);
  const store = {
    exists: vi.fn(
      async (path: string) => directories.has(path) || files.has(path),
    ),
    mkdir: vi.fn(async (path: string) => {
      directories.add(path);
    }),
    writeBinary: vi.fn(async (path: string, bytes: ArrayBuffer) => {
      files.set(path, bytes);
    }),
    readBinary: vi.fn(async (path: string) => {
      const bytes = files.get(path);
      if (!bytes) throw new Error("Missing file");
      return bytes;
    }),
  };
  return { store, files, root };
}

describe("offline CJK font packs", () => {
  it("exports mixed-script PDFs through the installed pack loader", async () => {
    const f = fixture();
    await installCjkFontPack(f.store, f.root, await testCjkFonts());
    const source =
      "INT. 東京 北京 서울 - DAY\n\n@美咲\nこんにちは。你好。안녕하세요.";
    const document = parseFountain(source);
    const snapshot = JSON.stringify(document);
    const bytes = await serializePdf(document, {
      pageSize: "a4",
      title: "Example",
      language: "ja",
      loadCjkFonts: () => loadCjkFontPack(f.store, f.root),
    });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
    expect(f.store.readBinary).toHaveBeenCalledTimes(6);
    expect(JSON.stringify(document)).toBe(snapshot);
  });
  it("round-trips the full verified fonts using six sub-5-MB chunks", async () => {
    const f = fixture();
    const fonts = await testCjkFonts();
    await installCjkFontPack(f.store, f.root, fonts);
    expect(f.files.size).toBe(6);
    for (const bytes of f.files.values())
      expect(bytes.byteLength).toBeLessThanOrEqual(FONT_CHUNK_BYTES);
    const loaded = await loadCjkFontPack(f.store, f.root);
    expect(Buffer.from(loaded.regular).equals(fonts.regular)).toBe(true);
    expect(Buffer.from(loaded.bold).equals(fonts.bold)).toBe(true);
  });

  it("validates both fonts before writing anything", async () => {
    const f = fixture();
    const fonts = await testCjkFonts();
    fonts.bold = fonts.bold.slice();
    fonts.bold[100] ^= 1;
    await expect(
      installCjkFontPack(f.store, f.root, fonts),
    ).rejects.toBeInstanceOf(CjkFontPackError);
    expect(f.store.writeBinary).not.toHaveBeenCalled();
    expect(f.store.mkdir).not.toHaveBeenCalled();
  });

  it("rejects missing packs with actionable feedback", async () => {
    const f = fixture();
    await expect(loadCjkFontPack(f.store, f.root)).rejects.toThrow(
      "Install offline CJK PDF fonts",
    );
    expect(f.store.writeBinary).not.toHaveBeenCalled();
  });

  it.each(["missing", "truncated", "corrupt"])(
    "rejects a %s installed chunk",
    async (kind) => {
      const f = fixture();
      await installCjkFontPack(f.store, f.root, await testCjkFonts());
      const path = `${f.root}/fonts/cjk-2.004/bold-1.bin`;
      const bytes = new Uint8Array(f.files.get(path)!);
      if (kind === "missing") f.files.delete(path);
      else if (kind === "truncated")
        f.files.set(path, bytes.slice(0, 1).buffer);
      else {
        bytes[10] ^= 1;
        f.files.set(path, bytes.buffer);
      }
      await expect(loadCjkFontPack(f.store, f.root)).rejects.toBeInstanceOf(
        CjkFontPackError,
      );
    },
  );

  it("can repair an interrupted installation by retrying", async () => {
    const f = fixture();
    const fonts = await testCjkFonts();
    f.store.writeBinary.mockRejectedValueOnce(new Error("Storage full"));
    await expect(installCjkFontPack(f.store, f.root, fonts)).rejects.toThrow(
      "Storage full",
    );
    await expect(loadCjkFontPack(f.store, f.root)).rejects.toBeInstanceOf(
      CjkFontPackError,
    );
    await installCjkFontPack(f.store, f.root, fonts);
    expect((await loadCjkFontPack(f.store, f.root)).bold.byteLength).toBe(
      CJK_FONT_FILES.bold.size,
    );
  });

  it.each(["", "/absolute", "plugin/../notes", "plugin\\notes"])(
    "rejects unsafe plugin directory %s",
    async (root) => {
      const f = fixture();
      await expect(loadCjkFontPack(f.store, root)).rejects.toBeInstanceOf(
        CjkFontPackError,
      );
      expect(f.store.readBinary).not.toHaveBeenCalled();
    },
  );

  it("requires a pack only for PDFs containing CJK text", async () => {
    const loadCjkFonts = vi.fn(async () => {
      throw new CjkFontPackError();
    });
    const options = { pageSize: "a4" as const, title: "Example", loadCjkFonts };
    expect(
      (await serializePdf(parseFountain("INT. OFFICE - DAY"), options)).length,
    ).toBeGreaterThan(1000);
    expect(loadCjkFonts).not.toHaveBeenCalled();
    await expect(
      serializePdf(parseFountain("INT. 東京 - DAY"), options),
    ).rejects.toBeInstanceOf(CjkFontPackError);
    expect(loadCjkFonts).toHaveBeenCalledOnce();
    await expect(
      serializePdf(parseFountain("Title: 東京\n\nINT. OFFICE - DAY"), {
        ...options,
        loadCjkFonts: undefined,
      }),
    ).rejects.toThrow("Install offline CJK PDF fonts");
  });
});
