import { describe, expect, it } from "vitest";
import {
  combineScreenplayDocuments,
  resolveCharacterFolder,
  screenplayProjectFromFrontmatter,
} from "../src/projects/model";
import { parseFountain } from "../src/screenplay/parser";
import { buildScreenplayIndex } from "../src/screenplay/indexer";

describe("screenplay projects", () => {
  it("parses ordered wiki links and the character folder override", () => {
    expect(
      screenplayProjectFromFrontmatter("Films/Night/Project.md", {
        firstdraft: "screenplay-project",
        title: "The Long Night",
        parts: ["[[Parts/01 - Opening]]", "[[Elsewhere/02 - Ward|Ward]]"],
        "character-folder": "People",
      }),
    ).toEqual({
      path: "Films/Night/Project.md",
      title: "The Long Night",
      parts: ["Parts/01 - Opening", "Elsewhere/02 - Ward"],
      characterFolder: "People",
    });
  });

  it("resolves relative folders beside their owner and absolute folders at vault root", () => {
    expect(resolveCharacterFolder("Films/Night/Project.md", "Characters")).toBe(
      "Films/Night/Characters",
    );
    expect(resolveCharacterFolder("Films/Night/Project.md", "/People")).toBe(
      "People",
    );
    expect(resolveCharacterFolder("Standalone.md", "Characters")).toBe(
      "Characters",
    );
  });

  it("combines documents in order while preserving recency", () => {
    const combined = combineScreenplayDocuments([
      parseFountain("INT. HOME - DAY\n\nJANE\nHello."),
      parseFountain("EXT. ROAD - NIGHT\n\nMILLER\nWait.\n\nJANE\nGo."),
    ]);
    const index = buildScreenplayIndex(combined);
    expect(
      index.characters.find((item) => item.value === "JANE"),
    ).toMatchObject({
      count: 2,
    });
    expect(
      index.characters.find((item) => item.value === "JANE")?.lastUsedPosition,
    ).toBeGreaterThan(
      index.characters.find((item) => item.value === "MILLER")
        ?.lastUsedPosition ?? 0,
    );
  });
});
