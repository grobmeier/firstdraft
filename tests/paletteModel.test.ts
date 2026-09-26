import { describe, expect, it } from "vitest";
import { orderPaletteActions } from "../src/ui/paletteModel";

describe("First Draft palette action order", () => {
  it("prioritises character extensions on a character cue", () => {
    const source = "INT. ROOM - DAY\n\nJANE\nDialogue.";
    expect(orderPaletteActions(source, source.indexOf("JANE") + 2)[0]).toBe(
      "character-extension",
    );
    expect(orderPaletteActions(source, source.indexOf("JANE") + 2)[1]).toBe(
      "character-page",
    );
  });

  it("prioritises parentheticals inside a dialogue block", () => {
    const source = "INT. ROOM - DAY\n\nJANE\nDialogue continues.";
    expect(orderPaletteActions(source, source.indexOf("continues"))[0]).toBe(
      "parenthetical",
    );
  });

  it("prioritises new scenes on a blank line", () => {
    const source = "INT. ROOM - DAY\n\nAction.\n\n";
    expect(orderPaletteActions(source, source.length)[0]).toBe("new-scene");
  });

  it("does not offer character extension away from a cue", () => {
    const actions = orderPaletteActions("Action line.", 4);
    expect(actions).not.toContain("character-extension");
  });
});
