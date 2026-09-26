import { describe, expect, it } from "vitest";
import {
  characterFilename,
  characterPageFromFrontmatter,
  characterPageTemplate,
  matchingCharacterPages,
  wikiLinkTarget,
} from "../src/characters/catalogue";

describe("character catalogue", () => {
  it("parses portable character frontmatter", () => {
    expect(
      characterPageFromFrontmatter("Characters/Jane.md", {
        firstdraft: "character",
        character: "Jane",
        aliases: ["Dr. Jane Morrow"],
        screenplays: ["[[Milestone 4]]"],
        related: ["[[Miller|Dr Miller]]"],
      }),
    ).toEqual({
      path: "Characters/Jane.md",
      character: "JANE",
      aliases: ["DR. JANE MORROW"],
      screenplays: ["[[Milestone 4]]"],
      related: ["[[Miller|Dr Miller]]"],
    });
  });

  it("matches canonical cues and aliases without changing screenplay text", () => {
    const page = characterPageFromFrontmatter("Characters/Jane.md", {
      firstdraft: "character",
      character: "JANE",
      aliases: ["DR. JANE MORROW"],
    });
    expect(page).not.toBeNull();
    expect(matchingCharacterPages([page!], "dr. jane morrow")).toEqual([page]);
  });

  it("creates readable filenames and templates", () => {
    expect(characterFilename("DR. JANE MORROW (O.S.)")).toBe("Dr. Jane Morrow");
    const template = characterPageTemplate("JANE", "Scripts/Milestone 4");
    expect(template).toContain('character: "JANE"');
    expect(template).toContain('"[[Scripts/Milestone 4]]"');
    expect(template).toContain("## Relationships");
  });

  it("extracts ordinary Obsidian link targets", () => {
    expect(wikiLinkTarget("[[Characters/Miller|Miller]]")).toBe(
      "Characters/Miller",
    );
    expect(wikiLinkTarget("[[Jane#Background]]")).toBe("Jane");
  });
});
