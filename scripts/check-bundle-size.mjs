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

import { readFile, stat } from "node:fs/promises";

export const MAX_RELEASE_ASSET_BYTES = 5_000_000;
export function assertReleaseAssetSize(name, size) {
  if (size >= MAX_RELEASE_ASSET_BYTES)
    throw new Error(
      `${name} is ${size} bytes; release assets must be below ${MAX_RELEASE_ASSET_BYTES} bytes for Obsidian Sync Standard.`,
    );
}

export function assertNoNativeBase64Calls(source) {
  if (/\b(?:atob|btoa)\s*\(/.test(source))
    throw new Error(
      "The release bundle must not call atob() or btoa(). Embed font bytes at build time instead.",
    );
}

if (
  process.argv[1] &&
  import.meta.url === new URL(process.argv[1], "file:").href
) {
  assertNoNativeBase64Calls(await readFile("main.js", "utf8"));
  for (const name of ["main.js", "manifest.json", "styles.css"]) {
    const { size } = await stat(name);
    assertReleaseAssetSize(name, size);
    console.log(`${name}: ${size} bytes (below 5 MB)`);
  }
}
