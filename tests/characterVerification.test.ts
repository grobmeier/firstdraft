import { describe, expect, it } from "vitest";
import {
  verifyCharacterPages,
  type VerifiableCharacterPage,
} from "../src/characters/verification";

function page(
  character: string,
  options: Partial<VerifiableCharacterPage> = {},
): VerifiableCharacterPage {
  return {
    path: `Characters/${character}.md`,
    character,
    aliases: [],
    screenplays: ["[[Script]]"],
    related: [],
    linkedToScreenplay: true,
    unresolvedRelated: [],
    ...options,
  };
}

describe("character verification", () => {
  it("reports missing and unused pages", () => {
    const issues = verifyCharacterPages(
      ["JANE", "MILLER"],
      [page("JANE"), page("REEVES")],
    );
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-page", severity: "warning" }),
        expect.objectContaining({
          code: "unused-page",
          severity: "observation",
        }),
      ]),
    );
  });

  it("reports duplicate canonical names and ambiguous aliases", () => {
    const issues = verifyCharacterPages(
      [],
      [
        page("JANE", { path: "Characters/Jane One.md", aliases: ["DOCTOR"] }),
        page("JANE", { path: "Characters/Jane Two.md" }),
        page("MILLER", { aliases: ["DOCTOR"] }),
      ],
    );
    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["duplicate-character", "ambiguous-alias"]),
    );
  });

  it("reports unresolved relationships", () => {
    const issues = verifyCharacterPages(
      ["JANE"],
      [page("JANE", { unresolvedRelated: ["[[Missing]]"] })],
    );
    expect(issues[0]).toMatchObject({
      code: "unresolved-relationship",
      severity: "warning",
    });
  });

  it("suggests likely cue spelling variants without claiming equivalence", () => {
    const issues = verifyCharacterPages(
      ["JANE MOROW"],
      [page("JANE MORROW", { linkedToScreenplay: false })],
    );
    expect(issues.map((issue) => issue.code)).toEqual([
      "missing-page",
      "possible-variant",
    ]);
  });

  it("accepts aliases as valid screenplay cues", () => {
    expect(
      verifyCharacterPages(
        ["DR. JANE MORROW"],
        [page("JANE", { aliases: ["DR. JANE MORROW"] })],
      ),
    ).toEqual([]);
  });
});
