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

import esbuild from "esbuild";
import process from "node:process";
import { builtinModules } from "node:module";
import { readFileSync } from "node:fs";

const fontLicense = readFileSync(
  new URL("./assets/fonts/liberation-mono/LICENSE", import.meta.url),
  "utf8",
);
const thirdPartyNotices = readFileSync(
  new URL("./THIRD_PARTY_NOTICES.md", import.meta.url),
  "utf8",
);
const cjkLicense = readFileSync(
  new URL("./assets/fonts/noto-cjk/LICENSE", import.meta.url),
  "utf8",
);

const production = process.argv[2] === "production";
const context = await esbuild.context({
  banner: {
    js: `/*!
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
 *
 * Includes pdf-lib, Copyright (c) 2019 Andrew Dillon, used under the MIT
 * License. See THIRD_PARTY_NOTICES.md in the source repository.
 * Includes @pdf-lib/fontkit, Copyright (c) 2014 Devon Govett, MIT License.
 * Includes unmodified Liberation Mono 2.1.5 regular and bold fonts:
${fontLicense
  .split("\n")
  .map((line) => ` * ${line}`)
  .join("\n")}
${thirdPartyNotices
  .split("\n")
  .map((line) => ` * ${line}`)
  .join("\n")}
${cjkLicense
  .split("\n")
  .map((line) => ` * ${line}`)
  .join("\n")}
 */`,
  },
  entryPoints: ["src/main.ts"],
  bundle: true,
  loader: { ".ttf": "dataurl", ".woff": "dataurl" },
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtinModules,
  ],
  format: "cjs",
  target: "es2021",
  logLevel: "info",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  minify: production,
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
