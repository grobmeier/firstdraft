import { describe, expect, it } from "vitest";
import {
  fountainExportPath,
  stripObsidianFrontmatter,
} from "../src/export/fountain";

describe("Fountain export", () => {
  it("strips leading Obsidian frontmatter without changing screenplay text", () => {
    expect(
      stripObsidianFrontmatter(`---
screenplay: true
title: Test
---

INT. ROOM - DAY

JANE
Hello.
`),
    ).toBe(`INT. ROOM - DAY

JANE
Hello.
`);
  });

  it("leaves source without frontmatter byte-for-byte unchanged", () => {
    const source = "INT. ROOM - DAY\r\n\r\nAction.\r\n";
    expect(stripObsidianFrontmatter(source)).toBe(source);
  });

  it("chooses a collision-safe path beside a Markdown note", () => {
    expect(
      fountainExportPath(
        "Scripts/Draft.md",
        new Set(["Scripts/Draft.fountain", "Scripts/Draft-2.fountain"]),
      ),
    ).toBe("Scripts/Draft-3.fountain");
  });

  it("does not overwrite an existing Fountain source", () => {
    expect(
      fountainExportPath("Draft.fountain", new Set(["Draft-export.fountain"])),
    ).toBe("Draft-export-2.fountain");
  });
});
