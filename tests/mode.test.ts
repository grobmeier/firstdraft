import { describe, expect, it } from "vitest";
import { isScreenplayMode } from "../src/screenplay/mode";

const defaults = {
  activateFountainFiles: true,
  activateFrontmatter: true,
};

describe("isScreenplayMode", () => {
  it("activates Fountain files", () => {
    expect(
      isScreenplayMode({ extension: "fountain" }, undefined, defaults),
    ).toBe(true);
  });

  it("activates opted-in Markdown notes", () => {
    expect(
      isScreenplayMode({ extension: "md" }, { screenplay: true }, defaults),
    ).toBe(true);
  });

  it("leaves ordinary Markdown notes alone", () => {
    expect(isScreenplayMode({ extension: "md" }, undefined, defaults)).toBe(
      false,
    );
  });

  it("honours disabled activation settings", () => {
    expect(
      isScreenplayMode(
        { extension: "fountain" },
        { screenplay: true },
        { activateFountainFiles: false, activateFrontmatter: false },
      ),
    ).toBe(false);
  });
});
