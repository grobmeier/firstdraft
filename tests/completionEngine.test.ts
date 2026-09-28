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
import {
  DEFAULT_COMPLETION_PREFERENCES,
  getScreenplayCompletionPlan,
} from "../src/editor/completionEngine";
import { parseFountain } from "../src/screenplay/parser";

const screenplay = `INT. MILITARY BASE - THERAPY ROOM - DAY

JANE
Hello.

MILLER
Report.

INT. MILITARY BASE - WARD - NIGHT

JANE
Ready.
`;

describe("screenplay completion engine", () => {
  it("completes a character cue and prepares a dialogue line", () => {
    const source = `${screenplay}\nJA`;
    const plan = getScreenplayCompletionPlan(
      source,
      source.length,
      DEFAULT_COMPLETION_PREFERENCES,
    );

    expect(plan?.kind).toBe("character");
    expect(plan?.candidates[0]).toMatchObject({
      label: "JANE",
      applyText: "JANE\n",
    });
  });

  it("completes known locations while preserving the scene type", () => {
    const source = `${screenplay}\nINT. MIL`;
    const plan = getScreenplayCompletionPlan(
      source,
      source.length,
      DEFAULT_COMPLETION_PREFERENCES,
    );

    expect(plan?.kind).toBe("scene-location");
    expect(plan?.candidates[0]?.label).not.toBe("MIL");
    expect(plan?.candidates.map((candidate) => candidate.applyText)).toContain(
      "MILITARY BASE - THERAPY ROOM - ",
    );
  });

  it("offers time values after a completed location", () => {
    const source = `${screenplay}\nINT. MILITARY BASE - THERAPY ROOM - `;
    const plan = getScreenplayCompletionPlan(
      source,
      source.length,
      DEFAULT_COMPLETION_PREFERENCES,
    );

    expect(plan?.kind).toBe("scene-time");
    expect(plan?.candidates.map((candidate) => candidate.label)).toContain(
      "NIGHT",
    );
  });

  it("offers character extensions only for discovered characters", () => {
    const source = `${screenplay}\nJANE (`;
    const plan = getScreenplayCompletionPlan(
      source,
      source.length,
      DEFAULT_COMPLETION_PREFERENCES,
    );

    expect(plan?.kind).toBe("character-extension");
    expect(plan?.candidates.map((candidate) => candidate.label)).toEqual([
      "(O.S.)",
      "(V.O.)",
      "(CONT'D)",
      "(ON RADIO)",
      "(ON PHONE)",
    ]);
  });

  it("does not activate character completion in ordinary action", () => {
    const source = `${screenplay}JANE walks to the door.`;
    expect(
      getScreenplayCompletionPlan(
        source,
        source.length,
        DEFAULT_COMPLETION_PREFERENCES,
      ),
    ).toBeNull();
  });

  it("offers characters discovered in another project part", () => {
    const source = "\nMI";
    const plan = getScreenplayCompletionPlan(
      source,
      source.length,
      DEFAULT_COMPLETION_PREFERENCES,
      false,
      parseFountain(screenplay),
    );

    expect(plan?.candidates.map((candidate) => candidate.label)).toContain(
      "MILLER",
    );
  });
});
