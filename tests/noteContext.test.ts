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
import { NoteContext, resolveNoteProperties } from "../src/ui/noteContext";
import { isScreenplayMode } from "../src/screenplay/mode";

function fixture() {
  const file = { extension: "md" };
  const other = { extension: "md" };
  const view = { file };
  const otherView = { file: other };
  const context = new NoteContext<typeof file, { file: typeof file | null }>();
  context.resolve(view, file, [view], false);
  return { file, other, view, otherView, context };
}

describe("palette note context", () => {
  it("retains an open note when the palette takes focus without an active file", () => {
    const f = fixture();
    expect(f.context.resolve(null, null, [f.view], true)).toBe(f.view);
    expect(f.context.resolve(null, null, [f.view], true)).toBe(f.view);
  });

  it("selects the new note instead of a retained screenplay", () => {
    const f = fixture();
    expect(f.context.resolve(null, f.other, [f.view, f.otherView], true)).toBe(
      f.otherView,
    );
    expect(f.context.resolve(null, null, [f.view, f.otherView], true)).toBe(
      f.otherView,
    );
  });

  it("never returns the previous editor while a different opened note is loading", () => {
    const f = fixture();
    f.context.opened(f.other);
    expect(f.context.resolve(f.view, f.file, [f.view], false)).toBeNull();
    expect(f.context.resolve(null, f.file, [f.view], true)).toBeNull();
    expect(
      f.context.resolve(f.otherView, f.other, [f.view, f.otherView], false),
    ).toBe(f.otherView);
  });

  it("resolves a newly opened note after its view becomes available", () => {
    const f = fixture();
    f.context.opened(f.other);
    expect(f.context.resolve(null, null, [f.view, f.otherView], true)).toBe(
      f.otherView,
    );
  });

  it("does not retain closed views", () => {
    const f = fixture();
    expect(f.context.resolve(null, null, [], true)).toBeNull();
  });

  it("does not use a view that has been reused for a different file", () => {
    const f = fixture();
    f.view.file = f.other;
    expect(f.context.resolve(null, null, [f.view], true)).toBeNull();
  });

  it("clears context when an empty Markdown view becomes active", () => {
    const f = fixture();
    const empty = { file: null };
    expect(f.context.resolve(empty, f.file, [f.view, empty], false)).toBe(
      empty,
    );
    expect(f.context.resolve(null, null, [f.view, empty], true)).toBeNull();
  });

  it("does not retain context when an unrelated view has no active file", () => {
    const f = fixture();
    expect(f.context.resolve(null, null, [f.view], false)).toBeNull();
    expect(f.context.resolve(null, null, [f.view], true)).toBeNull();
  });

  it("survives a null file-open notification when the palette owns focus", () => {
    const f = fixture();
    f.context.opened(null);
    expect(f.context.resolve(null, null, [f.view], true)).toBe(f.view);
  });
});

describe("current note properties", () => {
  const parse = (text: string) => {
    if (text === "invalid") throw new Error("Invalid YAML");
    if (text === "enabled") return { screenplay: true };
    if (text === "disabled") return { screenplay: false };
    return undefined;
  };
  const settings = { activateFountainFiles: true, activateFrontmatter: true };

  it("recognises activated source before metadata is available", () => {
    expect(resolveNoteProperties("enabled", false, undefined, parse)).toEqual({
      state: "ready",
      frontmatter: { screenplay: true },
    });
  });

  it("prefers current activation over stale cached properties", () => {
    expect(
      resolveNoteProperties("enabled", true, { screenplay: false }, parse),
    ).toEqual({
      state: "ready",
      frontmatter: { screenplay: true },
    });
  });

  it.each(["disabled", "ordinary", ""])(
    "respects removal or disabling in source: %s",
    (source) => {
      const properties = resolveNoteProperties(
        source,
        true,
        { screenplay: true },
        parse,
      );
      expect(properties.state).toBe("ready");
      expect(
        isScreenplayMode(
          { extension: "md" },
          properties.state === "ready" ? properties.frontmatter : undefined,
          settings,
        ),
      ).toBe(false);
    },
  );

  it("waits for unreadable properties instead of treating them as unactivated", () => {
    expect(
      resolveNoteProperties("invalid", true, { screenplay: true }, parse),
    ).toEqual({ state: "loading" });
    expect(resolveNoteProperties(null, false, undefined, parse)).toEqual({
      state: "loading",
    });
  });

  it("uses cached properties when no editor source is available", () => {
    expect(
      resolveNoteProperties(null, true, { screenplay: true }, parse),
    ).toEqual({ state: "ready", frontmatter: { screenplay: true } });
    expect(resolveNoteProperties(null, true, undefined, parse)).toEqual({
      state: "ready",
      frontmatter: undefined,
    });
  });

  it("still respects disabled frontmatter activation", () => {
    const properties = resolveNoteProperties(
      "enabled",
      false,
      undefined,
      parse,
    );
    expect(
      isScreenplayMode(
        { extension: "md" },
        properties.state === "ready" ? properties.frontmatter : undefined,
        { ...settings, activateFrontmatter: false },
      ),
    ).toBe(false);
  });
});
