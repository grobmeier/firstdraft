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
import { normalizeTransition } from "../src/screenplay/transition";

describe("normalizeTransition", () => {
  it("normalizes common transitions", () => {
    expect(normalizeTransition("cut to:")).toBe("CUT TO:");
    expect(normalizeTransition("fade out.")).toBe("FADE OUT.");
  });

  it("preserves forced transitions", () => {
    expect(normalizeTransition(">IRIS OUT")).toBe(">IRIS OUT");
  });

  it("forces arbitrary custom transitions without rewriting them", () => {
    expect(normalizeTransition("Through the looking glass")).toBe(
      ">Through the looking glass",
    );
  });
});
