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

import { readFile } from "node:fs/promises";

// Embed the original font bytes as data, not a runtime-decoded data URL.
export async function fontBytesModule(path) {
  const bytes = await readFile(path);
  return `export default new Uint8Array([${bytes.join(",")}]);`;
}

export function fontBytesEsbuildPlugin() {
  return {
    name: "font-bytes",
    setup(build) {
      build.onLoad({ filter: /\.ttf$/ }, async ({ path, suffix }) => {
        if (suffix !== "?bytes") return;
        return { contents: await fontBytesModule(path), loader: "js" };
      });
    },
  };
}

export function fontBytesVitePlugin() {
  return {
    name: "font-bytes",
    enforce: "pre",
    async load(id) {
      if (id.endsWith(".ttf?bytes"))
        return fontBytesModule(id.slice(0, -"?bytes".length));
    },
  };
}
