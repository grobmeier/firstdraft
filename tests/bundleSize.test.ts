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

import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("release asset size guard", () => {
  it.each([0, 2_400_000, 4_999_999])("accepts %i bytes", (size) => {
    expect(() =>
      execFileSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `import { assertReleaseAssetSize } from './scripts/check-bundle-size.mjs'; assertReleaseAssetSize('main.js', ${size});`,
        ],
        { stdio: "pipe" },
      ),
    ).not.toThrow();
  });
  it.each([5_000_000, 33_495_561])("rejects %i bytes", (size) => {
    expect(() =>
      execFileSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `import { assertReleaseAssetSize } from './scripts/check-bundle-size.mjs'; assertReleaseAssetSize('main.js', ${size});`,
        ],
        { stdio: "pipe" },
      ),
    ).toThrow();
  });
});
