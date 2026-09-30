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

import { describe, expect, it, vi } from "vitest";
import {
  activateScreenplay,
  type ActivationContext,
} from "../src/onboarding/activateScreenplay";

function fixture() {
  const file = { extension: "md" };
  let active: typeof file | null = file;
  let enabled = true;
  let protectedNote = false;
  const frontmatter: Record<string, unknown> = {
    title: "Existing title",
    tags: ["draft"],
  };
  const processFrontMatter = vi.fn(
    async (
      _file: typeof file,
      update: (frontmatter: Record<string, unknown>) => void,
    ) => {
      update(frontmatter);
    },
  );
  const context: ActivationContext<typeof file> = {
    activeFile: () => active,
    activationEnabled: () => enabled,
    isProtected: () => protectedNote,
    processFrontMatter,
  };
  return {
    file,
    frontmatter,
    context,
    processFrontMatter,
    switchNote: () => {
      active = { extension: "md" };
    },
    disable: () => {
      enabled = false;
    },
    protect: () => {
      protectedNote = true;
    },
  };
}

describe("one-click screenplay activation", () => {
  it("sets only the screenplay property and is idempotent", async () => {
    const f = fixture();
    expect(await activateScreenplay(f.context, f.file)).toBe("activated");
    expect(f.frontmatter).toEqual({
      title: "Existing title",
      tags: ["draft"],
      screenplay: true,
    });
    expect(f.processFrontMatter).toHaveBeenCalledWith(
      f.file,
      expect.any(Function),
    );
    expect(await activateScreenplay(f.context, f.file)).toBe("already-active");
  });

  it("does not write when the setting is disabled", async () => {
    const f = fixture();
    f.disable();
    expect(await activateScreenplay(f.context, f.file)).toBe("disabled");
    expect(f.processFrontMatter).not.toHaveBeenCalled();
  });

  it("rejects a stale sidebar target", async () => {
    const f = fixture();
    f.switchNote();
    expect(await activateScreenplay(f.context, f.file)).toBe("unavailable");
    expect(f.processFrontMatter).not.toHaveBeenCalled();
  });

  it("rejects non-Markdown and protected notes", async () => {
    const f = fixture();
    f.file.extension = "fountain";
    expect(await activateScreenplay(f.context, f.file)).toBe("unavailable");
    f.file.extension = "md";
    f.protect();
    expect(await activateScreenplay(f.context, f.file)).toBe("unavailable");
    expect(f.processFrontMatter).not.toHaveBeenCalled();
  });

  it.each(["character", "screenplay-project"])(
    "checks fresh properties for %s notes",
    async (kind) => {
      const f = fixture();
      f.frontmatter.firstdraft = kind;
      expect(await activateScreenplay(f.context, f.file)).toBe("unavailable");
      expect(f.frontmatter.screenplay).toBeUndefined();
    },
  );

  it.each(["switch", "disable"])(
    "rechecks eligibility immediately before updating after %s",
    async (change) => {
      const f = fixture();
      f.processFrontMatter.mockImplementationOnce(async (_file, update) => {
        if (change === "switch") f.switchNote();
        else f.disable();
        update(f.frontmatter);
      });
      expect(await activateScreenplay(f.context, f.file)).toBe(
        change === "switch" ? "unavailable" : "disabled",
      );
      expect(f.frontmatter.screenplay).toBeUndefined();
    },
  );

  it("suppresses overlapping clicks and allows retry after a write failure", async () => {
    const f = fixture();
    let rejectWrite: (error: Error) => void = () => {};
    f.processFrontMatter.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectWrite = reject;
        }),
    );
    const first = activateScreenplay(f.context, f.file);
    expect(await activateScreenplay(f.context, f.file)).toBe("busy");
    const rejection = expect(first).rejects.toThrow("Read-only note");
    rejectWrite(new Error("Read-only note"));
    await rejection;
    expect(f.frontmatter.screenplay).toBeUndefined();
    expect(await activateScreenplay(f.context, f.file)).toBe("activated");
  });
});
