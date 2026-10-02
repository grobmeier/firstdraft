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

import { isSceneHeading, parseFountain } from "../screenplay/parser";
import { parseSceneHeadingParts } from "../screenplay/indexer";
import { calculateStatistics } from "../screenplay/statistics";
import type { PageSize } from "../screenplay/model";
import { extractFountainTitlePage } from "../screenplay/titlePage";

export interface Scene {
  path: string;
  start: number;
  end: number;
  line: number;
  heading: string;
  text: string;
  synopsis: string;
  characters: string[];
  location: string;
  time: string;
  page: number;
}
export interface SceneFile {
  path: string;
  source: string;
  scenes: Scene[];
  issue: string | null;
  pages: number;
}
export interface SceneFilters {
  query: string;
  part: string;
  character: string;
  location: string;
  time: string;
}
export const EMPTY_SCENE_FILTERS: SceneFilters = {
  query: "",
  part: "",
  character: "",
  location: "",
  time: "",
};

export function sceneFile(
  path: string,
  source: string,
  pageSize: PageSize = "us-letter",
  pageOffset = 0,
): SceneFile {
  // Offsets always refer to the unmodified source, including CRLF and frontmatter.
  const raw = source.split("\n");
  let bodyStart = 0;
  if (raw[0]?.replace(/^\uFEFF/u, "").trim() === "---") {
    const closing = raw.findIndex(
      (line, index) => index > 0 && line.trim() === "---",
    );
    if (closing < 0)
      return {
        path,
        source,
        scenes: [],
        pages: 0,
        issue: "Unclosed frontmatter: scene changes are disabled.",
      };
    bodyStart = closing + 1;
  }
  const body = extractFountainTitlePage(
    raw
      .slice(bodyStart)
      .map((line) => line.replace(/^\uFEFF/u, "").replace(/\r$/u, "")),
  ).lines;
  const starts: { start: number; line: number; heading: string }[] = [];
  let offset = 0;
  let comment = false;
  let note = false;
  let fence = false;
  let issue: string | null = null;
  for (const [index, line] of raw.entries()) {
    const text = (body[index - bodyStart] ?? "").trim();
    if (index >= bodyStart) {
      if (
        text.includes("/*") ||
        text.includes("*/") ||
        (text.includes("[[") && !text.includes("]]")) ||
        note
      ) {
        issue =
          "Multiline notes or boneyards are present; scene changes are disabled to preserve their boundaries.";
      }
      if (/^#/u.test(text) || /\^\s*$/u.test(text))
        issue =
          "Sections or dual dialogue are present; scene changes are disabled to preserve their boundaries.";
      if (text.includes("/*")) comment = true;
      if (text.includes("[[") && !text.includes("]]")) note = true;
      if (/^(?:```|~~~)/u.test(text)) {
        fence = !fence;
        issue =
          "Fenced code is present; scene changes are disabled to preserve its boundaries.";
      }
      if (!comment && !note && !fence && isSceneHeading(text))
        starts.push({ start: offset, line: index, heading: text });
      if (text.includes("*/")) comment = false;
      if (text.includes("]]")) note = false;
    }
    offset += line.length + (index < raw.length - 1 ? 1 : 0);
  }
  let page = pageOffset + 1;
  const scenes = starts.map((item, index): Scene => {
    const end = starts[index + 1]?.start ?? source.length;
    const text = source.slice(item.start, end);
    const lines = text.split("\n");
    const synopsis: string[] = [];
    for (const line of lines.slice(1)) {
      if (/^\s*=(?!=)/u.test(line)) synopsis.push(line.trim().slice(1).trim());
      else break;
    }
    const document = parseFountain(text);
    const parts = parseSceneHeadingParts(item.heading);
    const result: Scene = {
      ...item,
      path,
      end,
      text,
      synopsis: synopsis.join("\n"),
      characters: [
        ...new Set(
          document.elements
            .filter((element) => element.type === "character")
            .map((element) => element.text),
        ),
      ],
      location: parts?.location ?? "",
      time: parts?.timeOfDay ?? "",
      page,
    };
    page += calculateStatistics(document, {
      pageSize,
      minutesPerPage: 1,
    }).estimatedPages;
    return result;
  });
  return {
    path,
    source,
    scenes,
    issue,
    pages: calculateStatistics(parseFountain(source), {
      pageSize,
      minutesPerPage: 1,
    }).estimatedPages,
  };
}

export function filterScenes(
  scenes: readonly Scene[],
  filters: SceneFilters,
): Scene[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return scenes.filter(
    (scene) =>
      (!query ||
        `${scene.heading}\n${scene.synopsis}`
          .toLocaleLowerCase()
          .includes(query)) &&
      (!filters.part || scene.path === filters.part) &&
      (!filters.character || scene.characters.includes(filters.character)) &&
      (!filters.location || scene.location === filters.location) &&
      (!filters.time || scene.time === filters.time),
  );
}

export function assertScene(file: SceneFile, scene: Scene): void {
  if (file.issue) throw new Error(file.issue);
  if (
    file.path !== scene.path ||
    file.source.slice(scene.start, scene.end) !== scene.text ||
    !file.scenes.some(
      (current) =>
        current.start === scene.start &&
        current.end === scene.end &&
        current.heading === scene.heading,
    )
  ) {
    throw new Error(
      "The scene changed. Refresh the scene workspace and try again.",
    );
  }
}

function insertBlock(source: string, offset: number, block: string): string {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const before = source.slice(0, offset);
  const after = source.slice(offset);
  const prefix =
    before && !before.endsWith(`${eol}${eol}`)
      ? before.endsWith(eol)
        ? eol
        : `${eol}${eol}`
      : "";
  const suffix =
    after && !block.endsWith(`${eol}${eol}`)
      ? block.endsWith(eol)
        ? eol
        : `${eol}${eol}`
      : "";
  return before + prefix + block + suffix + after;
}

export interface SceneChange {
  path: string;
  before: string;
  after: string;
  focus?: number;
}
export function moveScene(
  source: SceneFile,
  scene: Scene,
  destination: SceneFile,
  target: Scene | null,
  position: "before" | "after" = "before",
): SceneChange[] {
  assertScene(source, scene);
  if (destination.issue) throw new Error(destination.issue);
  if (target) assertScene(destination, target);
  if (source.path === destination.path && target?.start === scene.start)
    throw new Error("Choose a different destination scene.");
  let insertion = target
    ? position === "before"
      ? target.start
      : target.end
    : destination.source.length;
  const removed =
    source.source.slice(0, scene.start) + source.source.slice(scene.end);
  if (source.path === destination.path) {
    if (source.source !== destination.source)
      throw new Error("The destination changed. Refresh and try again.");
    if (insertion > scene.start) insertion -= scene.end - scene.start;
    return [
      {
        path: source.path,
        before: source.source,
        after: insertBlock(removed, insertion, scene.text),
      },
    ];
  }
  return [
    {
      path: destination.path,
      before: destination.source,
      after: insertBlock(destination.source, insertion, scene.text),
    },
    { path: source.path, before: source.source, after: removed },
  ];
}

export function createScene(
  file: SceneFile,
  heading: string,
  synopsis: string,
  target: Scene | null,
  position: "before" | "after",
): SceneChange {
  if (file.issue) throw new Error(file.issue);
  if (!isSceneHeading(heading.trim()) || /[\r\n]/u.test(heading))
    throw new Error(
      "Enter one valid scene heading, for example INT. OFFICE - DAY.",
    );
  if (target) assertScene(file, target);
  const eol = file.source.includes("\r\n") ? "\r\n" : "\n";
  const block =
    heading.trim() +
    eol +
    (synopsis.trim()
      ? synopsis
          .trim()
          .split(/\r?\n/u)
          .map((line) => `= ${line}`)
          .join(eol) + eol
      : "") +
    eol;
  const insertion = target
    ? position === "before"
      ? target.start
      : target.end
    : file.source.length;
  const after = insertBlock(file.source, insertion, block);
  return {
    path: file.path,
    before: file.source,
    after,
    focus: after.indexOf(heading.trim(), insertion),
  };
}

export function editSynopsis(
  file: SceneFile,
  scene: Scene,
  synopsis: string,
): SceneChange {
  assertScene(file, scene);
  const eol = scene.text.includes("\r\n") ? "\r\n" : "\n";
  const lines = scene.text.split("\n");
  let end = 1;
  // Only replace contiguous synopsis lines immediately beneath the heading.
  while (/^\s*=(?!=)/u.test(lines[end] ?? "")) end++;
  const replacement = synopsis.trim()
    ? synopsis
        .trim()
        .split(/\r?\n/u)
        .map((line) => `= ${line}${eol}`)
        .join("")
    : "";
  const headingEnd = scene.text.indexOf("\n");
  const bodyOffset = lines
    .slice(0, end)
    .reduce((sum, line) => sum + line.length + 1, 0);
  const text =
    headingEnd < 0
      ? scene.text + eol + replacement
      : scene.text.slice(0, headingEnd + 1) +
        replacement +
        scene.text.slice(Math.min(bodyOffset, scene.text.length));
  return {
    path: file.path,
    before: file.source,
    after:
      file.source.slice(0, scene.start) + text + file.source.slice(scene.end),
  };
}
