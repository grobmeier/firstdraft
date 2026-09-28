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
