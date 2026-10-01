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

import LineBreaker from "linebreak";

/** Unicode break opportunities, with grapheme-safe emergency word wrapping. */
export function wrapMeasuredText(
  text: string,
  maximumWidth: number,
  measure: (text: string) => number,
): string[] {
  const value = text.trim();
  if (!value) return [""];
  const breaker = new LineBreaker(value);
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const lines: string[] = [];
  let current = "";
  let offset = 0;
  let boundary = breaker.nextBreak();
  const fits = (value: string) =>
    measure(value.trimEnd()) <= maximumWidth + 0.001;
  const flush = () => {
    if (current.trim()) lines.push(current.trimEnd());
    current = "";
  };
  while (boundary) {
    // Prefer Korean word boundaries (keep-all) over breaks within a Hangul
    // word. Oversized words still use the grapheme-safe emergency path below.
    if (
      !boundary.required &&
      /^[\p{Script=Hangul}]{2}$/u.test(
        value.slice(boundary.position - 1, boundary.position + 1),
      )
    ) {
      boundary = breaker.nextBreak();
      continue;
    }
    let token = value.slice(offset, boundary.position);
    if (!fits(current + token)) flush();
    if (!current) token = token.trimStart();
    if (fits(token)) current += token;
    else {
      // Long Latin/Korean words have no legal boundary; never split a surrogate
      // pair, combining accent or composed Hangul syllable in the emergency path.
      const clusters = Array.from(
        segmenter.segment(token),
        (item) => item.segment,
      );
      for (let index = 0; index < clusters.length; index++) {
        let unit = clusters[index] ?? "";
        // Keep common CJK brackets/quotes and closing punctuation attached even
        // when an oversized word must use emergency grapheme boundaries.
        while (
          index + 1 < clusters.length &&
          (/[（「『【《〈(]$/u.test(unit) ||
            /^[，。、！？：；）」』】》〉!?;:,.)]/u.test(
              clusters[index + 1] ?? "",
            ))
        ) {
          unit += clusters[++index];
        }
        if (current && !fits(current + unit)) flush();
        current += unit;
      }
    }
    if (boundary.required) flush();
    offset = boundary.position;
    boundary = breaker.nextBreak();
  }
  flush();
  return lines.length ? lines : [""];
}
