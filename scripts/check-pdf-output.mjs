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

import { build } from "esbuild";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const temporary = await mkdtemp(join(tmpdir(), "firstdraft-pdf-"));
const output = resolve("output/pdf");
const engine = join(temporary, "engine.mjs");
try {
  await build({
    stdin: {
      contents:
        'export { serializePdf } from "./src/export/pdf"; export { parseFountain } from "./src/screenplay/parser";',
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "browser",
    format: "esm",
    loader: { ".ttf": "dataurl", ".woff": "dataurl" },
    outfile: engine,
  });
  // eslint-disable-next-line no-unsanitized/method -- Fixed filename built by esbuild in our own newly created temporary directory.
  const { serializePdf, parseFountain } = await import(pathToFileURL(engine));
  await mkdir(output, { recursive: true });
  const source =
    "INT. 東京 / 北京 / 서울 - DAY\n\n@美咲\nこんにちは。「今日は雨です。」 English dialogue.\n\n@小李\n你好，世界！窗外下着雨。\n\n@小林\n繁體中文：窗外下著雨。\n\n@민수\n안녕하세요. 오늘은 비가 옵니다. 한글.\n\n!" +
    "雨が静かに降る。窗外下着雨。오늘은 비가 옵니다. ".repeat(100);
  const document = parseFountain(source);
  const results = [];
  for (const language of ["zh-Hans", "zh-Hant", "ja", "ko"]) {
    for (const pageSize of ["us-letter", "a4"]) {
      const started = performance.now();
      const bytes = await serializePdf(document, {
        language,
        pageSize,
        title: "CJK review",
      });
      const path = join(output, `cjk-${language}-${pageSize}.pdf`);
      await writeFile(path, bytes);
      results.push({
        language,
        pageSize,
        bytes: bytes.length,
        milliseconds: Math.round(performance.now() - started),
      });
    }
  }
  for (const pageSize of ["us-letter", "a4"]) {
    for (const cjk of [false, true]) {
      const source = `Title: ${cjk ? "東京の夜 / 서울 / 北京" : "The Long Night"}\nCredit: Written by\nAuthor: Alex Example\nSource: An original screenplay\nDraft date: 1 October 2026\nContact:\n    Example office\n    Example City\n\nINT. OFFICE - NIGHT\n\nALEX (V.O.)\n(quietly)\n${Array.from({ length: 150 }, (_, index) => (cjk ? `${index + 1}. 雨が静かに降る。窗外下着雨。오늘은 비가 옵니다.` : `${index + 1}. We should leave before anyone notices.`)).join("\n")}\n\n!Rain falls outside.`;
      const bytes = await serializePdf(parseFountain(source), {
        pageSize,
        title: "Title and continuation review",
        language: "ja",
      });
      await writeFile(
        join(output, `fidelity-${cjk ? "cjk" : "latin"}-${pageSize}.pdf`),
        bytes,
      );
    }
  }
  await writeFile(
    join(output, "timings.json"),
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
  console.log(`PDF review files: ${output}`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
