import { describe, expect, it } from "vitest";
import {
  buildParentheticalEdit,
  normalizeParenthetical,
} from "../src/screenplay/parenthetical";

function applyEdit(
  source: string,
  edit: ReturnType<typeof buildParentheticalEdit>,
) {
  return `${source.slice(0, edit.from)}${edit.insert}${source.slice(edit.to)}`;
}

describe("parenthetical helper", () => {
  it("normalizes arbitrary input", () => {
    expect(normalizeParenthetical("beat")).toBe("(beat)");
    expect(normalizeParenthetical("(quietly)")).toBe("(quietly)");
  });

  it("inserts after a character cue and leaves the caret at dialogue", () => {
    const source = "JANE\nDialogue.";
    const edit = buildParentheticalEdit(source, 2, "quietly");

    expect(applyEdit(source, edit)).toBe("JANE\n(quietly)\nDialogue.");
    expect(edit.cursor).toBe("JANE\n(quietly)\n".length);
  });

  it("uses an existing blank dialogue line", () => {
    const source = "JANE\n\n";
    const edit = buildParentheticalEdit(source, 5, "(beat)");

    expect(applyEdit(source, edit)).toBe("JANE\n(beat)\n");
    expect(edit.cursor).toBe(source.length + "(beat)".length);
  });

  it("places a parenthetical before existing dialogue", () => {
    const source = "JANE\nHello.";
    const edit = buildParentheticalEdit(source, source.length, "whispering");

    expect(applyEdit(source, edit)).toBe("JANE\n(whispering)\nHello.");
  });
});
