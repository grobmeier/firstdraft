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

import type { DataAdapter } from "obsidian";

export const FONT_CHUNK_BYTES = 4_000_000;
export const CJK_FONT_FILES = {
  regular: {
    name: "NotoSansCJK-Regular.woff",
    size: 11_610_804,
    sha256: "d61013536b8fe91d998513b0eaf752fa42d3a17ec189b06989344c050f37be21",
  },
  bold: {
    name: "NotoSansCJK-Bold.woff",
    size: 11_754_344,
    sha256: "43c0db530c9d2af4e1a294939e45beb58da7bb6d9197b8e6743660ef35708367",
  },
} as const;

export interface CjkFontBytes {
  regular: Uint8Array;
  bold: Uint8Array;
}

export class CjkFontPackError extends Error {
  constructor() {
    super(
      'CJK PDF fonts are missing, incomplete or invalid. Run "Install offline CJK PDF fonts" and select the official regular and bold WOFF files. No PDF was saved; your screenplay is unchanged.',
    );
    this.name = "CjkFontPackError";
  }
}

type FontStore = Pick<
  DataAdapter,
  "exists" | "mkdir" | "readBinary" | "writeBinary"
>;
type Weight = keyof typeof CJK_FONT_FILES;

function rootFor(pluginDirectory: string): string {
  if (
    !pluginDirectory ||
    pluginDirectory.startsWith("/") ||
    pluginDirectory
      .split("/")
      .some((part) => !part || part === "." || part === "..") ||
    pluginDirectory.includes("\\")
  )
    throw new CjkFontPackError();
  return `${pluginDirectory}/fonts/cjk-2.004`;
}

async function validate(weight: Weight, bytes: Uint8Array): Promise<void> {
  const expected = CJK_FONT_FILES[weight];
  if (bytes.byteLength !== expected.size) throw new CjkFontPackError();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new Uint8Array(bytes).buffer,
  );
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  if (hash !== expected.sha256) throw new CjkFontPackError();
}

/** Validate both files before writing; partial installation never passes loading. */
export async function installCjkFontPack(
  store: FontStore,
  pluginDirectory: string,
  fonts: CjkFontBytes,
): Promise<void> {
  const root = rootFor(pluginDirectory);
  for (const weight of ["regular", "bold"] as const)
    await validate(weight, fonts[weight]);
  // The registered plugin directory already exists; create only our own subfolders.
  for (const directory of [`${pluginDirectory}/fonts`, root]) {
    if (!(await store.exists(directory))) await store.mkdir(directory);
  }
  for (const weight of ["regular", "bold"] as const) {
    const bytes = fonts[weight];
    for (
      let offset = 0, index = 0;
      offset < bytes.byteLength;
      offset += FONT_CHUNK_BYTES, index++
    ) {
      await store.writeBinary(
        `${root}/${weight}-${index}.bin`,
        new Uint8Array(bytes.subarray(offset, offset + FONT_CHUNK_BYTES))
          .buffer,
      );
    }
  }
}

export async function loadCjkFontPack(
  store: FontStore,
  pluginDirectory: string,
): Promise<CjkFontBytes> {
  const root = rootFor(pluginDirectory);
  try {
    const fonts = {} as CjkFontBytes;
    for (const weight of ["regular", "bold"] as const) {
      const bytes = new Uint8Array(CJK_FONT_FILES[weight].size);
      for (
        let offset = 0, index = 0;
        offset < bytes.byteLength;
        offset += FONT_CHUNK_BYTES, index++
      ) {
        const chunk = new Uint8Array(
          await store.readBinary(`${root}/${weight}-${index}.bin`),
        );
        if (
          chunk.byteLength !==
          Math.min(FONT_CHUNK_BYTES, bytes.byteLength - offset)
        )
          throw new CjkFontPackError();
        bytes.set(chunk, offset);
      }
      await validate(weight, bytes);
      fonts[weight] = bytes;
    }
    return fonts;
  } catch {
    throw new CjkFontPackError();
  }
}
