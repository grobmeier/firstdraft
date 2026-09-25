import { DEFAULT_TIMES_OF_DAY, SCENE_TYPE_SOURCE } from "./fountain";
import type { ScreenplayDocument, ScreenplayIndex, Usage } from "./model";

const SCENE_PARTS = new RegExp(`^\\.?(${SCENE_TYPE_SOURCE})\\s+(.+)$`, "iu");
const SCENE_NUMBER = /\s+#[\p{L}\p{N}.-]+#\s*$/u;

function addUsage(
  usages: Map<string, Usage>,
  value: string,
  position: number,
): void {
  const normalized = value.trim();
  if (!normalized) return;

  const key = normalized.toLocaleUpperCase();
  const existing = usages.get(key);
  if (existing) {
    existing.count += 1;
    existing.lastUsedPosition = Math.max(existing.lastUsedPosition, position);
  } else {
    usages.set(key, {
      value: normalized,
      count: 1,
      lastUsedPosition: position,
    });
  }
}

export interface SceneHeadingParts {
  type: string;
  location: string;
  timeOfDay: string | null;
}

export function parseSceneHeadingParts(text: string): SceneHeadingParts | null {
  const withoutNumber = text.trim().replace(SCENE_NUMBER, "");
  const match = SCENE_PARTS.exec(withoutNumber);
  if (!match) return null;

  const type = match[1]?.toLocaleUpperCase() ?? "";
  const remainder = match[2]?.trim() ?? "";
  const parts = remainder.split(/\s+-\s+/u);
  if (parts.length < 2) {
    return { type, location: remainder, timeOfDay: null };
  }

  const timeOfDay = parts.pop()?.trim() ?? null;
  return {
    type,
    location: parts.join(" - ").trim(),
    timeOfDay,
  };
}

export function buildScreenplayIndex(
  document: ScreenplayDocument,
): ScreenplayIndex {
  const characters = new Map<string, Usage>();
  const locations = new Map<string, Usage>();
  const timesOfDay = new Map<string, Usage>();

  for (const element of document.elements) {
    if (element.type === "character") {
      addUsage(characters, element.text, element.line);
    }
    if (element.type === "scene-heading") {
      const parts = parseSceneHeadingParts(element.text);
      if (!parts) continue;
      addUsage(locations, parts.location, element.line);
      if (parts.timeOfDay) {
        addUsage(timesOfDay, parts.timeOfDay, element.line);
      }
    }
  }

  return {
    characters: [...characters.values()],
    locations: [...locations.values()],
    timesOfDay: [...timesOfDay.values()],
  };
}

export function rankUsages(
  usages: readonly Usage[],
  query: string,
  recentWeight: number,
  limit: number,
): Usage[] {
  const normalizedQuery = query.trim().toLocaleUpperCase();
  const maxCount = Math.max(1, ...usages.map((usage) => usage.count));
  const maxPosition = Math.max(
    1,
    ...usages.map((usage) => usage.lastUsedPosition),
  );
  const recency = Math.min(1, Math.max(0, recentWeight));

  return usages
    .filter((usage) =>
      usage.value.toLocaleUpperCase().startsWith(normalizedQuery),
    )
    .map((usage) => ({
      usage,
      score:
        (usage.count / maxCount) * (1 - recency) +
        (usage.lastUsedPosition / maxPosition) * recency,
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.usage.count - left.usage.count ||
        left.usage.value.localeCompare(right.usage.value),
    )
    .slice(0, Math.max(1, limit))
    .map(({ usage }) => usage);
}

export function preferredAndRecentTimes(
  index: ScreenplayIndex,
  preferred: readonly string[] = DEFAULT_TIMES_OF_DAY,
): Usage[] {
  const combined = new Map<string, Usage>();
  const maximumPosition = Math.max(
    0,
    ...index.timesOfDay.map((usage) => usage.lastUsedPosition),
  );

  for (const [offset, value] of preferred.entries()) {
    addUsage(combined, value, maximumPosition - preferred.length + offset);
  }
  for (const usage of index.timesOfDay) {
    const existing = combined.get(usage.value.toLocaleUpperCase());
    if (existing) {
      existing.count += usage.count;
      existing.lastUsedPosition = Math.max(
        existing.lastUsedPosition,
        usage.lastUsedPosition,
      );
    } else {
      combined.set(usage.value.toLocaleUpperCase(), { ...usage });
    }
  }

  return [...combined.values()];
}
