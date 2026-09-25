import { describe, expect, it } from "vitest";
import { estimateRuntimeMinutes } from "../src/screenplay/runtime";

describe("estimateRuntimeMinutes", () => {
  it("uses one minute per page by default", () => {
    expect(estimateRuntimeMinutes(43.7)).toBe(43.7);
  });

  it("uses a configurable non-negative ratio", () => {
    expect(estimateRuntimeMinutes(10, 1.2)).toBe(12);
    expect(estimateRuntimeMinutes(10, -1)).toBe(0);
  });
});
