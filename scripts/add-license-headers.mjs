#!/usr/bin/env node
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

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const HEADER = `/*
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
 */`;

const CODE_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".cts",
  ".js",
  ".mjs",
  ".mts",
  ".ts",
]);
const ROOT_FILES = ["esbuild.config.mjs", "eslint.config.mjs", "styles.css"];
const SOURCE_DIRECTORIES = ["scripts", "src", "tests"];
const checkOnly = process.argv.includes("--check");

function sourceWithoutShebang(source) {
  if (!source.startsWith("#!")) return source;

  const firstNewline = source.indexOf("\n");
  return firstNewline === -1 ? "" : source.slice(firstNewline + 1);
}

function addHeader(source) {
  if (!source.startsWith("#!")) return `${HEADER}\n\n${source}`;

  const firstNewline = source.indexOf("\n");
  const shebang = firstNewline === -1 ? source : source.slice(0, firstNewline);
  const body = firstNewline === -1 ? "" : source.slice(firstNewline + 1);
  return `${shebang}\n${HEADER}\n\n${body}`;
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath)));
    } else if (CODE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

const files = [...ROOT_FILES];
for (const directory of SOURCE_DIRECTORIES) {
  files.push(...(await collectFiles(directory)));
}

const missing = [];
for (const file of files.sort()) {
  const source = await readFile(file, "utf8");
  if (sourceWithoutShebang(source).startsWith(HEADER)) continue;

  missing.push(file);
  if (!checkOnly) {
    await writeFile(file, addHeader(source));
  }
}

if (checkOnly && missing.length > 0) {
  console.error(`Missing Apache-2.0 header:\n${missing.join("\n")}`);
  process.exitCode = 1;
} else if (missing.length > 0) {
  console.log(`Added Apache-2.0 header to ${missing.length} files.`);
} else {
  console.log("All code files have an Apache-2.0 header.");
}
