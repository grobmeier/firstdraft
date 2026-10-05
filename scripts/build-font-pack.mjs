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

import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const output = resolve("output/font-pack");
await mkdir(output, { recursive: true });
const hashes = [];
for (const weight of ["Regular", "Bold"]) {
  const name = `NotoSansCJK-${weight}.woff`;
  const bytes = await readFile(`assets/fonts/noto-cjk/${name}`);
  hashes.push(`${createHash("sha256").update(bytes).digest("hex")}  ${name}`);
  await copyFile(`assets/fonts/noto-cjk/${name}`, `${output}/${name}`);
}
await copyFile("assets/fonts/noto-cjk/LICENSE", `${output}/LICENSE.txt`);
await copyFile("docs/CJK_FONT_PACK.md", `${output}/README.md`);
await writeFile(`${output}/SHA256SUMS.txt`, `${hashes.join("\n")}\n`);
console.log(`Optional offline font pack: ${output}`);
console.log(
  "Deliver this folder separately from the three standard plugin release assets.",
);
