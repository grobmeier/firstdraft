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

import { beforeEach, describe, expect, it, vi } from "vitest";
import { TFile } from "obsidian";
import type FirstDraftPlugin from "../src/main";
import { activateScreenplayNote } from "../src/commands/activateScreenplay";
import { activateScreenplay } from "../src/onboarding/activateScreenplay";

const notices = vi.hoisted(() => vi.fn());
vi.mock("obsidian", () => ({
  TFile: class {
    basename = "Example";
  },
  Notice: class {
    constructor(text: string) {
      notices(text);
    }
  },
}));
vi.mock("../src/onboarding/activateScreenplay", () => ({
  activateScreenplay: vi.fn(),
}));

describe("activation feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["activated", "already-active"] as const)(
    "refreshes controls after %s",
    async (result) => {
      vi.mocked(activateScreenplay).mockResolvedValue(result);
      const refreshStatus = vi.fn();
      const plugin = { refreshStatus } as unknown as FirstDraftPlugin;
      const file = new TFile();
      await activateScreenplayNote(plugin, file);
      expect(refreshStatus).toHaveBeenCalledOnce();
      expect(notices).toHaveBeenCalledWith(
        result === "activated"
          ? "Screenplay mode enabled for Example."
          : "Screenplay mode is already enabled for Example.",
      );
    },
  );

  it("reports a stale target without refreshing as if activation succeeded", async () => {
    vi.mocked(activateScreenplay).mockResolvedValue("unavailable");
    const refreshStatus = vi.fn();
    await activateScreenplayNote(
      { refreshStatus } as unknown as FirstDraftPlugin,
      new TFile(),
    );
    expect(refreshStatus).not.toHaveBeenCalled();
    expect(notices).toHaveBeenCalledWith(
      "The note changed. Open an ordinary note and try again.",
    );
  });
});
