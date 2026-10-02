/*
 * Copyright 2026 Christian Grobmeier
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, expect, it } from "vitest";
import {
  sceneFile,
  filterScenes,
  EMPTY_SCENE_FILTERS,
  createScene,
  moveScene,
  editSynopsis,
} from "../src/scenes/model";
import { parseFountain } from "../src/screenplay/parser";
import { calculateStatistics } from "../src/screenplay/statistics";
import { layoutScreenplay } from "../src/export/screenplayLayout";

const source =
  "---\nscreenplay: true\ntitle: Night\n---\n\nOpening text remains here.\n\nINT. OFFICE - DAY\n= A quiet meeting.\n\nALEX\nHello.\n\nEXT. STREET - NIGHT\n= A departure.\n\n@美咲\nこんにちは。\n\n.INT. 東京 - DAY\n\n!Rain falls.";

describe("source scene workspace", () => {
  it("uses absolute source lines and byte-preserving ranges including metadata", () => {
    const file = sceneFile("Film.md", source);
    expect(file.scenes).toHaveLength(3);
    expect(file.scenes[0]?.line).toBe(7);
    for (const scene of file.scenes)
      expect(source.slice(scene.start, scene.end)).toBe(scene.text);
    expect(file.scenes[0]).toMatchObject({
      synopsis: "A quiet meeting.",
      location: "OFFICE",
      time: "DAY",
      characters: ["ALEX"],
    });
    expect(file.scenes[1]?.characters).toEqual(["美咲"]);
    expect(file.scenes[2]?.heading).toBe(".INT. 東京 - DAY");
  });
  it("keeps BOM/CRLF offsets and Fountain title fields outside scenes", () => {
    const text =
      "\uFEFFTitle: Night\r\nAuthor:\r\n    EXT. NOT A SCENE - DAY\r\n\r\nINT. ROOM - DAY\r\n\r\n!Rain.";
    const file = sceneFile("Film.fountain", text);
    expect(file.scenes).toHaveLength(1);
    expect(file.scenes[0]?.line).toBe(4);
    expect(file.scenes[0]?.start).toBe(text.indexOf("INT. ROOM"));
  });
  it("keeps duplicate scene headings distinct", () => {
    const file = sceneFile(
      "Film.md",
      "INT. ROOM - DAY\n\n!First.\n\nINT. ROOM - DAY\n\n!Second.",
    );
    expect(file.scenes).toHaveLength(2);
    expect(file.scenes[0]?.start).not.toBe(file.scenes[1]?.start);
  });
  it("filters headings/synopses, parts, characters, locations and times together", () => {
    const scenes = sceneFile("Film.md", source).scenes;
    expect(
      filterScenes(scenes, {
        ...EMPTY_SCENE_FILTERS,
        query: "quiet",
        part: "Film.md",
        character: "ALEX",
        location: "OFFICE",
        time: "DAY",
      }),
    ).toHaveLength(1);
    expect(
      filterScenes(scenes, { ...EMPTY_SCENE_FILTERS, time: "NIGHT" }),
    ).toHaveLength(1);
    expect(
      filterScenes(scenes, { ...EMPTY_SCENE_FILTERS, part: "Other.md" }),
    ).toHaveLength(0);
  });
  it("estimates page positions across parts without treating title pages as body pages", () => {
    const first = sceneFile("One.md", source);
    const second = sceneFile("Two.md", "EXT. ROAD - DAY", "a4", first.pages);
    expect(second.scenes[0]?.page).toBe(first.pages + 1);
    expect(first.scenes[2]?.page).toBeGreaterThan(first.scenes[0]?.page ?? 0);
  });
  it("excludes synopsis lines from dialogue, statistics and PDF layout", () => {
    const doc = parseFountain(
      "INT. ROOM - DAY\n= Secret synopsis words\n\nALEX\nHello.",
    );
    expect(
      doc.elements.some((element) => element.text.includes("synopsis")),
    ).toBe(false);
    expect(calculateStatistics(doc).words).toBe(
      calculateStatistics(parseFountain("INT. ROOM - DAY\n\nALEX\nHello."))
        .words,
    );
    expect(
      layoutScreenplay(doc, "us-letter")
        .pages.flatMap((page) => page.blocks.flatMap((block) => block.lines))
        .join(" "),
    ).not.toContain("Secret");
  });
  it("does not turn a synopsis immediately after a heading into a character cue", () => {
    const doc = parseFountain("INT. ROOM - DAY\n= Synopsis\n\n!Action.");
    expect(doc.elements.map((element) => element.type)).toEqual([
      "scene-heading",
      "action",
    ]);
  });
  it("creates before/after a scene and at EOF without altering metadata", () => {
    const file = sceneFile("Film.md", source);
    for (const position of ["before", "after"] as const) {
      const change = createScene(
        file,
        "EXT. LAKE - DAWN",
        "A new beginning.",
        file.scenes[0] ?? null,
        position,
      );
      expect(
        change.after.startsWith(source.slice(0, file.scenes[0]?.start)),
      ).toBe(true);
      expect(change.after).toContain("= A new beginning.");
      const scenes = sceneFile(file.path, change.after).scenes;
      expect(scenes).toHaveLength(4);
      expect(
        scenes.find((scene) => scene.start === change.focus)?.heading,
      ).toBe("EXT. LAKE - DAWN");
      expect(scenes[position === "before" ? 0 : 1]?.heading).toBe(
        "EXT. LAKE - DAWN",
      );
    }
    expect(
      sceneFile(
        file.path,
        createScene(file, ".A NEW PLACE", "", null, "after").after,
      ).scenes,
    ).toHaveLength(4);
  });
  it("rejects multiline/invalid headings", () => {
    const file = sceneFile("Film.md", source);
    expect(() => createScene(file, "Hello", "", null, "after")).toThrow(
      "valid scene heading",
    );
    expect(() =>
      createScene(
        file,
        "INT. ROOM - DAY\n!Injected action.",
        "",
        null,
        "after",
      ),
    ).toThrow();
  });
  it("changes/removes only the immediately attached synopsis", () => {
    const file = sceneFile("Film.md", source);
    const scene = file.scenes[0];
    if (!scene) throw new Error("Fixture missing scene");
    const changed = editSynopsis(file, scene, "First line.\nSecond line.");
    expect(changed.after).toBe(
      source.replace("= A quiet meeting.\n", "= First line.\n= Second line.\n"),
    );
    const removed = editSynopsis(file, scene, "");
    expect(removed.after).toBe(source.replace("= A quiet meeting.\n", ""));
  });
  it("adds a synopsis to a final heading with no newline", () => {
    const file = sceneFile("Film.md", "INT. ROOM - DAY");
    const scene = file.scenes[0];
    if (!scene) throw new Error("Fixture missing scene");
    expect(editSynopsis(file, scene, "A beginning.").after).toBe(
      "INT. ROOM - DAY\n= A beginning.\n",
    );
  });
  it("reorders whole scenes while preserving preamble, comments and every word", () => {
    const file = sceneFile("Film.md", source);
    const scene = file.scenes[1];
    const target = file.scenes[0];
    if (!scene || !target) throw new Error("Fixture missing scene");
    const changed = moveScene(file, scene, file, target, "before")[0];
    expect(changed?.after.startsWith(source.slice(0, target.start))).toBe(true);
    const updated = sceneFile(file.path, changed?.after ?? "");
    expect(updated.scenes.map((item) => item.heading)).toEqual([
      scene.heading,
      target.heading,
      ".INT. 東京 - DAY",
    ]);
    for (const item of file.scenes) expect(changed?.after).toContain(item.text);
  });
  it("moves the final non-newline block before another scene without merging headings", () => {
    const file = sceneFile(
      "Film.md",
      "INT. A - DAY\n\n!One.\n\nINT. B - DAY\n\n!Two.",
    );
    const [a, b] = file.scenes;
    if (!a || !b) throw new Error("Fixture missing scene");
    const updated = sceneFile(
      file.path,
      moveScene(file, b, file, a, "before")[0]?.after ?? "",
    );
    expect(updated.scenes.map((scene) => scene.heading)).toEqual([
      b.heading,
      a.heading,
    ]);
    expect(updated.scenes[0]?.text).toContain("!Two.");
  });
  it("moves across parts destination-first without moving part metadata", () => {
    const first = sceneFile("One.md", source);
    const second = sceneFile(
      "Two.md",
      "---\ntitle: Part Two\n---\n\nEXT. ROAD - DAY\n\n!Wait.",
    );
    const scene = first.scenes[0];
    if (!scene) throw new Error("Fixture missing scene");
    const changes = moveScene(first, scene, second, null);
    expect(changes.map((change) => change.path)).toEqual(["Two.md", "One.md"]);
    expect(changes[0]?.after).toContain(scene.text);
    expect(changes[0]?.after.startsWith(second.source)).toBe(true);
    expect(changes[1]?.after).toContain("title: Night");
    expect(changes[1]?.after).not.toContain(scene.text);
  });
  it("preserves CRLF when creating and editing synopses", () => {
    const file = sceneFile("Film.md", source.replaceAll("\n", "\r\n"));
    const scene = file.scenes[0];
    if (!scene) throw new Error("Fixture missing scene");
    expect(
      createScene(
        file,
        "INT. ROOM - DAY",
        "New.",
        null,
        "after",
      ).after.replaceAll("\r\n", ""),
    ).not.toContain("\n");
    expect(
      editSynopsis(file, scene, "Updated.").after.replaceAll("\r\n", ""),
    ).not.toContain("\n");
  });
  it("rejects stale scene ranges and a scene as its own destination", () => {
    const file = sceneFile("Film.md", source);
    const scene = file.scenes[0];
    if (!scene) throw new Error("Fixture missing scene");
    expect(() =>
      moveScene(
        sceneFile(file.path, source.replace("Hello.", "Changed.")),
        scene,
        file,
        null,
      ),
    ).toThrow("scene changed");
    expect(() => moveScene(file, scene, file, scene)).toThrow(
      "different destination",
    );
  });
  it.each([
    "# Act One\nINT. ROOM - DAY",
    "/*\nINT. FAKE - DAY\n*/\nINT. REAL - DAY",
    "[[\nINT. FAKE - DAY\n]]\nINT. REAL - DAY",
    "```\nINT. FAKE - DAY\n```\nINT. REAL - DAY",
    "INT. ROOM - DAY\n\nALEX ^\nHello.",
  ])("disables writes for unsupported boundaries: %s", (text) => {
    const file = sceneFile("Film.md", text);
    expect(file.issue).toBeTruthy();
    expect(file.scenes.some((scene) => scene.heading.includes("FAKE"))).toBe(
      false,
    );
    expect(() =>
      createScene(file, "INT. ROOM - NIGHT", "", null, "after"),
    ).toThrow();
  });
  it("rejects unclosed frontmatter", () =>
    expect(
      sceneFile("Film.md", "---\ntitle: Night\nINT. ROOM - DAY").issue,
    ).toBeTruthy());
});
