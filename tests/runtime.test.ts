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

import { describe, expect, it } from "vitest";
import { estimateRuntimeMinutes } from "../src/screenplay/runtime";

describe("estimateRuntimeMinutes", () => {
  it("uses one minute per page by default", () => {
    expect(estimateRuntimeMinutes(43.7)).toBe(43.7);
  });

  it("uses a configurable non-negative ratio", () => {
    expect(estimateRuntimeMinutes(10, 1.2)).toBe(12);
    expect(estimateRuntimeMinutes(10, -1)).toBe(0);
  });
});
