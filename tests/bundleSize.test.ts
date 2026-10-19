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
  it.each(["atob('font')", "window.btoa('font')"])(
    "rejects native runtime base64: %s",
    (source) => {
      expect(() =>
        execFileSync(
          process.execPath,
          [
            "--input-type=module",
            "-e",
            `import { assertNoNativeBase64Calls } from './scripts/check-bundle-size.mjs'; assertNoNativeBase64Calls(${JSON.stringify(source)});`,
          ],
          { stdio: "pipe" },
        ),
      ).toThrow();
    },
  );
  it("accepts literal byte arrays without runtime base64", () => {
    expect(() =>
      execFileSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          "import { assertNoNativeBase64Calls } from './scripts/check-bundle-size.mjs'; assertNoNativeBase64Calls('new Uint8Array([0,1,255])');",
        ],
        { stdio: "pipe" },
      ),
    ).not.toThrow();
  });
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
