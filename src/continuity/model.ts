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

import {
  verifyCharacterPages,
  type VerifiableCharacterPage,
} from "../characters/verification";
import { normalizeCharacterName } from "../characters/catalogue";
import { parseSceneHeadingParts } from "../screenplay/indexer";
import { parseFountain } from "../screenplay/parser";
import type { SceneFile } from "../scenes/model";

export interface Evidence {
  path: string;
  line: number;
  text: string;
  source: string;
}
export interface Finding {
  rule: string;
  kind: "problem" | "advice";
  message: string;
  evidence: Evidence[];
  dossierPath?: string;
}
export interface ContinuityReport {
  files: SceneFile[];
  incomplete: string[];
  findings: Finding[];
}

export function inspectContinuity(
  files: SceneFile[],
  pages: readonly VerifiableCharacterPage[],
  scopeIssues: readonly string[] = [],
): ContinuityReport {
  const incomplete = [...scopeIssues];
  const findings: Finding[] = [];
  const cues = new Map<string, Evidence[]>();
  for (const file of files) {
    if (file.issue) {
      incomplete.push(`${file.path}: ${file.issue}`);
      continue;
    }
    for (const scene of file.scenes) {
      const evidence = {
        path: file.path,
        line: scene.line,
        text: scene.heading,
        source: file.source,
      };
      const document = parseFountain(scene.text);
      for (const element of document.elements.filter(
        (item) => item.type === "character",
      )) {
        const name = normalizeCharacterName(element.text);
        const occurrences = cues.get(name) ?? [];
        occurrences.push({
          path: file.path,
          line: scene.line + element.line - 1,
          text:
            scene.text.split("\n")[element.line - 1]?.replace(/\r$/u, "") ??
            element.text,
          source: file.source,
        });
        cues.set(name, occurrences);
      }
      if (
        !document.elements.some(
          (item) => item.type === "action" || item.type === "dialogue",
        )
      )
        findings.push({
          rule: "Empty scene",
          kind: "advice",
          message:
            "No action or dialogue was found in this scene. This may be an intentional outline placeholder.",
          evidence: [evidence],
        });
      const parts = parseSceneHeadingParts(scene.heading);
      if (parts && !parts.timeOfDay)
        findings.push({
          rule: "Missing time of day",
          kind: "advice",
          message:
            "This heading has no time-of-day label. This may be intentional; review whether it needs one.",
          evidence: [evidence],
        });
    }
    // Cues outside a scene cannot be located reliably by this scene-based inspector.
    const total = parseFountain(file.source).elements.filter(
      (item) => item.type === "character",
    ).length;
    const located = [...cues.values()]
      .flat()
      .filter((item) => item.path === file.path).length;
    if (total !== located)
      incomplete.push(
        `${file.path}: Some character cues are outside recognised scenes and were not checked.`,
      );
  }
  // An incomplete screenplay must not produce misleading unused-dossier advice.
  const issues = verifyCharacterPages([...cues.keys()], pages);
  for (const issue of issues) {
    if (incomplete.length && issue.code === "unused-page") continue;
    const relevant = (issue.characterNames ?? []).flatMap(
      (name) => cues.get(normalizeCharacterName(name)) ?? [],
    );
    const labels: Record<typeof issue.code, string> = {
      "ambiguous-alias": "Ambiguous character alias",
      "duplicate-character": "Duplicate character identity",
      "missing-page": "Optional character page",
      "possible-variant": "Possible character spelling variant",
      "unresolved-relationship": "Unresolved character relationship",
      "unused-page": "Unused character page",
    };
    findings.push({
      rule: labels[issue.code],
      kind:
        issue.severity === "observation" || issue.code === "missing-page"
          ? "advice"
          : "problem",
      message:
        issue.code === "missing-page"
          ? `${issue.message} Character pages are optional.`
          : issue.message,
      evidence: relevant,
      dossierPath: issue.path,
    });
  }
  return {
    files,
    incomplete: [...new Set(incomplete)],
    findings: findings.sort((a, b) => a.rule.localeCompare(b.rule)),
  };
}
