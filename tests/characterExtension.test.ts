import { describe, expect, it } from "vitest";
import {
  isLikelyCharacterCue,
  withCharacterExtension,
} from "../src/screenplay/characterExtension";

describe("character extensions", () => {
  it("adds and replaces an extension", () => {
    expect(withCharacterExtension("JANE", "(O.S.)")).toBe("JANE (O.S.)");
    expect(withCharacterExtension("JANE (O.S.)", "(V.O.)")).toBe("JANE (V.O.)");
  });

  it("preserves dual-dialogue markers", () => {
    expect(withCharacterExtension("JANE ^", "(O.S.)")).toBe("JANE (O.S.) ^");
  });

  it("rejects scene headings and ordinary mixed-case text", () => {
    expect(isLikelyCharacterCue("JANE")).toBe(true);
    expect(isLikelyCharacterCue("INT. ROOM - DAY")).toBe(false);
    expect(isLikelyCharacterCue("Jane walks in.")).toBe(false);
  });
});
