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
import { inspectContinuity } from "../src/continuity/model";
import { sceneFile } from "../src/scenes/model";
import type { VerifiableCharacterPage } from "../src/characters/verification";

const page = (
  character: string,
  path = `${character}.md`,
  aliases: string[] = [],
): VerifiableCharacterPage => ({
  character,
  path,
  aliases,
  screenplays: [],
  related: [],
  linkedToScreenplay: true,
  unresolvedRelated: [],
});
describe("read-only continuity inspector", () => {
  it("finds only advisory empty/missing-time issues and preserves source", () => {
    const source =
      "---\nscreenplay: true\n---\n\nTitle: Example\nAuthor: Example\n\nINT. ROOM\n= Outline only.\n";
    const file = sceneFile("Part.md", source);
    const result = inspectContinuity([file], []);
    expect(result.findings.map((finding) => finding.rule)).toEqual([
      "Empty scene",
      "Missing time of day",
    ]);
    expect(result.findings.every((finding) => finding.kind === "advice")).toBe(
      true,
    );
    expect(result.findings[0]?.evidence[0]).toMatchObject({
      path: "Part.md",
      line: 7,
      text: "INT. ROOM",
      source,
    });
    expect(file.source).toBe(source);
  });
  it("locates forced CJK cues with frontmatter and title offsets", () => {
    const file = sceneFile(
      "日本語.md",
      "---\nscreenplay: true\n---\n\nTitle: 例\nAuthor: Writer\n\n.INT. 駅 - NIGHT\n\n@サム\n出発します。\n",
    );
    const result = inspectContinuity([file], []);
    const finding = result.findings.find(
      (item) => item.rule === "Optional character page",
    );
    expect(finding).toMatchObject({
      kind: "advice",
      evidence: [
        { path: file.path, line: 9, text: "@サム", source: file.source },
      ],
    });
  });
  it("accepts aliases, accented cues and extensions", () => {
    const file = sceneFile(
      "One.md",
      "INT. ROOM - DAY\n\n@ÉLISE (V.O.)\nHello.\n",
    );
    expect(
      inspectContinuity([file], [page("ELISE", "Elise.md", ["ÉLISE"])])
        .findings,
    ).toEqual([]);
  });
  it("links spelling advice to the exact cue and candidate dossier", () => {
    const file = sceneFile("One.md", "INT. ROOM - DAY\n\nMILER\nHello.\n");
    const result = inspectContinuity([file], [page("MILLER", "Miller.md")]);
    expect(
      result.findings.find(
        (item) => item.rule === "Possible character spelling variant",
      ),
    ).toMatchObject({
      kind: "advice",
      dossierPath: "Miller.md",
      evidence: [{ text: "MILER", line: 2 }],
    });
  });
  it("does not flag intentional repeated headings or time transitions", () => {
    const file = sceneFile(
      "One.md",
      "INT. ROOM - DAY\n\n!A clock ticks.\n\nINT. ROOM - NIGHT\n\n!A clock stops.\n\nINT. ROOM - DAY\n\n!Dawn.\n",
    );
    expect(inspectContinuity([file], []).findings).toEqual([]);
  });
  it("links duplicate identities and ambiguous aliases to exact cues", () => {
    const file = sceneFile(
      "One.md",
      "INT. ROOM - DAY\n\nALEX\nHello.\n\nALEX SMITH\nGoodbye.\n",
    );
    const result = inspectContinuity(
      [file],
      [
        page("ALEX", "Alex.md"),
        page("ALEX", "Alex2.md"),
        page("ALEX SMITH", "Smith.md"),
      ],
    );
    const duplicate = result.findings.find(
      (finding) => finding.rule === "Duplicate character identity",
    );
    expect(duplicate?.kind).toBe("problem");
    expect(duplicate?.evidence.map((evidence) => evidence.text)).toEqual([
      "ALEX",
    ]);
    expect(duplicate?.dossierPath).toBe("Alex.md");
    const aliases = inspectContinuity(
      [file],
      [page("ONE", "One.md", ["ALEX"]), page("TWO", "Two.md", ["ALEX"])],
    );
    expect(
      aliases.findings.some(
        (finding) => finding.rule === "Ambiguous character alias",
      ),
    ).toBe(true);
  });
  it("preserves part order in repeated cue evidence", () => {
    const files = [
      sceneFile("Two.md", "INT. ROOM - DAY\n\nALEX\nHello."),
      sceneFile("One.md", "EXT. ROAD - DAY\n\nALEX\nHello."),
    ];
    const result = inspectContinuity(files, []);
    expect(
      result.findings[0]?.evidence.map((evidence) => evidence.path),
    ).toEqual(["Two.md", "One.md"]);
  });
  it("reports unsupported/incomplete scope rather than clean continuity", () => {
    const files = [sceneFile("One.md", "# Act\n\nINT. ROOM - DAY\n\n!Action.")];
    const result = inspectContinuity(
      files,
      [page("ALEX")],
      ["Unresolved part: Missing"],
    );
    expect(result.incomplete).toHaveLength(2);
    expect(result.findings).toEqual([]);
  });
  it("reports cues outside scenes as unchecked and suppresses unused advice", () => {
    const result = inspectContinuity(
      [sceneFile("One.md", "ALEX\nHello.\n\nINT. ROOM - DAY\n\n!Action.")],
      [page("ALEX")],
    );
    expect(result.incomplete[0]).toContain("outside recognised scenes");
    expect(result.findings).toEqual([]);
  });
  it("retains relationship evidence and optional unused-page advice", () => {
    const dossier = { ...page("ALEX"), unresolvedRelated: ["Missing"] };
    const result = inspectContinuity(
      [sceneFile("One.md", "INT. ROOM - DAY\n\n!Action.")],
      [dossier],
    );
    expect(result.findings.map((finding) => finding.rule)).toEqual([
      "Unresolved character relationship",
      "Unused character page",
    ]);
    expect(
      result.findings.every((finding) => finding.dossierPath === "ALEX.md"),
    ).toBe(true);
  });
});
