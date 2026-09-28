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

import type {
  PageEstimate,
  PageEstimationOptions,
  PageEstimator,
  PageSize,
  ScreenplayDocument,
  ScreenplayElementType,
} from "./model";

interface PageMetrics {
  linesPerPage: number;
  widths: Record<ScreenplayElementType, number>;
}

const PAGE_METRICS: Record<PageSize, PageMetrics> = {
  "us-letter": {
    linesPerPage: 55,
    widths: {
      "scene-heading": 59,
      action: 61,
      character: 38,
      dialogue: 35,
      parenthetical: 26,
      transition: 50,
    },
  },
  a4: {
    linesPerPage: 58,
    widths: {
      "scene-heading": 57,
      action: 59,
      character: 37,
      dialogue: 34,
      parenthetical: 25,
      transition: 48,
    },
  },
};

function roundedPageCount(value: number): number {
  if (value === 0) return 0;
  return Math.max(0.1, Math.round(value * 10) / 10);
}

export function wrappedLineCount(text: string, width: number): number {
  const words = text.trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return 0;

  let lines = 1;
  let currentLength = 0;

  for (const word of words) {
    const wordLength = word.length;
    if (currentLength === 0) {
      lines += Math.max(0, Math.ceil(wordLength / width) - 1);
      currentLength = wordLength % width;
      if (currentLength === 0) currentLength = width;
      continue;
    }

    if (currentLength + 1 + wordLength <= width) {
      currentLength += 1 + wordLength;
      continue;
    }

    lines += 1;
    lines += Math.max(0, Math.ceil(wordLength / width) - 1);
    currentLength = wordLength % width;
    if (currentLength === 0) currentLength = width;
  }

  return lines;
}

export const screenplayPageEstimator: PageEstimator = {
  estimate(
    document: ScreenplayDocument,
    options: PageEstimationOptions,
  ): PageEstimate {
    const metrics = PAGE_METRICS[options.pageSize];
    const contentLines = document.elements.reduce(
      (total, element) =>
        total + wrappedLineCount(element.text, metrics.widths[element.type]),
      0,
    );
    const formattedLines = contentLines + document.blankLines;

    return {
      formattedLines,
      pages: roundedPageCount(formattedLines / metrics.linesPerPage),
    };
  },
};

export function estimateScreenplayPages(
  document: ScreenplayDocument,
  pageSize: PageSize = "us-letter",
): PageEstimate {
  return screenplayPageEstimator.estimate(document, { pageSize });
}
