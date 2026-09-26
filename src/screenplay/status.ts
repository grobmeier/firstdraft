import type { ScreenplayStatistics } from "./model";

export interface StatusBarFields {
  estimatedPages: boolean;
  estimatedRuntime: boolean;
  words: boolean;
  scenes: boolean;
}

export function formatEstimatedPages(pages: number): string {
  return Number.isInteger(pages) ? pages.toFixed(0) : pages.toFixed(1);
}

export function formatEstimatedRuntime(minutes: number): string {
  const rounded =
    minutes < 10 ? Math.round(minutes * 10) / 10 : Math.round(minutes);
  return rounded.toString();
}

export function formatScreenplayStatus(
  statistics: ScreenplayStatistics,
  fields: StatusBarFields,
): string {
  const parts = ["Screenplay"];

  if (fields.estimatedPages) {
    parts.push(`~${formatEstimatedPages(statistics.estimatedPages)} pages`);
  }
  if (fields.estimatedRuntime) {
    parts.push(
      `~${formatEstimatedRuntime(statistics.estimatedRuntimeMinutes)} min`,
    );
  }
  if (fields.words) {
    parts.push(`${statistics.words.toLocaleString()} words`);
  }
  if (fields.scenes) {
    parts.push(`${statistics.scenes} scenes`);
  }

  return parts.join(" · ");
}
