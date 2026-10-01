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

import type { ScreenplayTitlePage } from "./model";

const FIELDS: Record<string, keyof ScreenplayTitlePage> = {
  title: "title",
  credit: "credit",
  author: "author",
  authors: "author",
  source: "source",
  "draft date": "draftDate",
  contact: "contact",
};

export function titlePageFromFrontmatter(
  properties: Record<string, unknown> | undefined,
): ScreenplayTitlePage | undefined {
  const title = properties?.title;
  if (typeof title !== "string" || !title.trim()) return undefined;
  const result: ScreenplayTitlePage = { title: title.trim() };
  for (const [key, field] of Object.entries(FIELDS)) {
    const value = properties?.[key === "draft date" ? "draft-date" : key];
    if (typeof value === "string" && value.trim()) result[field] = value.trim();
  }
  return result;
}

/** Strip only a leading, recognised title block, retaining source line positions. */
export function extractFountainTitlePage(lines: string[]): {
  lines: string[];
  titlePage?: ScreenplayTitlePage;
} {
  let start = lines.findIndex((line) => line.trim() !== "");
  if (start < 0) start = 0;
  const values: Partial<ScreenplayTitlePage> = {};
  let field: keyof ScreenplayTitlePage | undefined;
  let end = start;
  for (; end < lines.length; end++) {
    const line = lines[end] ?? "";
    const match = /^([A-Za-z ]+):\s*(.*)$/u.exec(line);
    const key = match?.[1]?.trim().toLowerCase();
    if (key && Object.hasOwn(FIELDS, key)) {
      field = FIELDS[key];
      values[field] = match?.[2]?.trim() ?? "";
    } else if (field && /^\s+\S/u.test(line)) {
      values[field] = [values[field], line.trim()].filter(Boolean).join("\n");
    } else break;
  }
  if (!values.title?.trim()) return { lines };
  const titlePage: ScreenplayTitlePage = {
    ...values,
    title: values.title.trim(),
  };
  return {
    lines: lines.map((line, index) =>
      index >= start && index < end ? "" : line,
    ),
    titlePage,
  };
}
