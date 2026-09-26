import { describe, expect, it } from "vitest";
import { normalizeTransition } from "../src/screenplay/transition";

describe("normalizeTransition", () => {
  it("normalizes common transitions", () => {
    expect(normalizeTransition("cut to:")).toBe("CUT TO:");
    expect(normalizeTransition("fade out.")).toBe("FADE OUT.");
  });

  it("preserves forced transitions", () => {
    expect(normalizeTransition(">IRIS OUT")).toBe(">IRIS OUT");
  });

  it("forces arbitrary custom transitions without rewriting them", () => {
    expect(normalizeTransition("Through the looking glass")).toBe(
      ">Through the looking glass",
    );
  });
});
