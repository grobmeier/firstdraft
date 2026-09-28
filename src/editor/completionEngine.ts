import {
  CHARACTER_EXTENSIONS,
  DEFAULT_TIMES_OF_DAY,
  SCENE_TYPE_SOURCE,
} from "../screenplay/fountain";
import {
  buildScreenplayIndex,
  preferredAndRecentTimes,
  rankUsages,
} from "../screenplay/indexer";
import { parseFountain } from "../screenplay/parser";
import type { ScreenplayDocument } from "../screenplay/model";

export type ScreenplayCompletionKind =
  "character" | "character-extension" | "scene-location" | "scene-time";

export interface CompletionCandidate {
  label: string;
  applyText: string;
  detail: string;
}

export interface ScreenplayCompletionPlan {
  kind: ScreenplayCompletionKind;
  from: number;
  to: number;
  candidates: CompletionCandidate[];
}

export interface CompletionPreferences {
  recentItemsWeighting: number;
  maximumSuggestions: number;
  preferredTimesOfDay: readonly string[];
}

const SCENE_LINE = new RegExp(`^(${SCENE_TYPE_SOURCE})\\s+(.+)$`, "iu");
const POSSIBLE_CHARACTER = /^[\p{Lu}\p{N} ._'’-]+$/u;

function lineContext(
  source: string,
  cursorOffset: number,
): {
  before: string;
  from: number;
  indexSource: string;
  previousLine: string;
} {
  const from = source.lastIndexOf("\n", Math.max(0, cursorOffset - 1)) + 1;
  const nextBreak = source.indexOf("\n", cursorOffset);
  const lineEnd = nextBreak === -1 ? source.length : nextBreak;
  const previousBreak = source.lastIndexOf("\n", Math.max(0, from - 2));
  const previousLine = source.slice(previousBreak + 1, Math.max(0, from - 1));
  return {
    before: source.slice(from, cursorOffset),
    from,
    indexSource: `${source.slice(0, from)}${source.slice(lineEnd)}`,
    previousLine,
  };
}

function extensionPlan(
  before: string,
  lineFrom: number,
  cursorOffset: number,
  characters: readonly string[],
): ScreenplayCompletionPlan | null {
  const match = /^(.+?)\s+\(([^)]*)$/u.exec(before);
  if (!match) return null;
  const character = match[1]?.replace(/^@/u, "").trim().toLocaleUpperCase();
  if (!character || !characters.includes(character)) return null;

  const query = match[2]?.toLocaleUpperCase() ?? "";
  const openParenthesis = before.lastIndexOf("(");
  const candidates = CHARACTER_EXTENSIONS.filter((extension) =>
    extension.slice(1).toLocaleUpperCase().startsWith(query),
  ).map((extension) => ({
    label: extension,
    applyText: extension,
    detail: "Character extension",
  }));

  return candidates.length === 0
    ? null
    : {
        kind: "character-extension",
        from: lineFrom + openParenthesis,
        to: cursorOffset,
        candidates,
      };
}

function scenePlan(
  before: string,
  lineFrom: number,
  cursorOffset: number,
  index: ReturnType<typeof buildScreenplayIndex>,
  preferences: CompletionPreferences,
): ScreenplayCompletionPlan | null {
  const match = SCENE_LINE.exec(before);
  if (!match) return null;
  const sceneType = match[1] ?? "";
  const value = match[2] ?? "";
  const valueFrom = lineFrom + sceneType.length + 1;
  const normalizedValue = value.toLocaleUpperCase();
  const canContinueLocation = index.locations.some((usage) =>
    usage.value.toLocaleUpperCase().startsWith(normalizedValue),
  );

  if (canContinueLocation || !value.includes(" - ")) {
    const candidates = rankUsages(
      index.locations,
      value,
      preferences.recentItemsWeighting,
      preferences.maximumSuggestions,
    ).map((usage) => ({
      label: usage.value,
      applyText: `${usage.value} - `,
      detail: "Location",
    }));
    return candidates.length === 0
      ? null
      : {
          kind: "scene-location",
          from: valueFrom,
          to: cursorOffset,
          candidates,
        };
  }

  const delimiter = value.lastIndexOf(" - ");
  const query = value.slice(delimiter + 3);
  const candidates = rankUsages(
    preferredAndRecentTimes(index, preferences.preferredTimesOfDay),
    query,
    preferences.recentItemsWeighting,
    preferences.maximumSuggestions,
  ).map((usage) => ({
    label: usage.value,
    applyText: usage.value,
    detail: "Time",
  }));

  return candidates.length === 0
    ? null
    : {
        kind: "scene-time",
        from: valueFrom + delimiter + 3,
        to: cursorOffset,
        candidates,
      };
}

export function getScreenplayCompletionPlan(
  source: string,
  cursorOffset: number,
  preferences: CompletionPreferences,
  explicit = false,
  projectDocument?: ScreenplayDocument,
): ScreenplayCompletionPlan | null {
  const { before, from, indexSource, previousLine } = lineContext(
    source,
    cursorOffset,
  );
  const index = buildScreenplayIndex(
    projectDocument ?? parseFountain(indexSource),
  );
  const characterNames = index.characters.map((usage) =>
    usage.value.toLocaleUpperCase(),
  );

  const extensions = extensionPlan(before, from, cursorOffset, characterNames);
  if (extensions) return extensions;

  const scene = scenePlan(before, from, cursorOffset, index, preferences);
  if (scene) return scene;

  const query = before.trimStart();
  const leadingWhitespace = before.length - query.length;
  const plausiblePosition = from === 0 || previousLine.trim() === "";
  if (
    !plausiblePosition ||
    (!explicit && query.length === 0) ||
    (query.length > 0 && !POSSIBLE_CHARACTER.test(query))
  ) {
    return null;
  }

  const candidates = rankUsages(
    index.characters,
    query,
    preferences.recentItemsWeighting,
    preferences.maximumSuggestions,
  ).map((usage) => ({
    label: usage.value,
    applyText: `${usage.value}\n`,
    detail: `${usage.count} dialogue ${usage.count === 1 ? "block" : "blocks"}`,
  }));

  return candidates.length === 0
    ? null
    : {
        kind: "character",
        from: from + leadingWhitespace,
        to: cursorOffset,
        candidates,
      };
}

export const DEFAULT_COMPLETION_PREFERENCES: CompletionPreferences = {
  recentItemsWeighting: 0.65,
  maximumSuggestions: 8,
  preferredTimesOfDay: DEFAULT_TIMES_OF_DAY,
};
