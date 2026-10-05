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

/** Keep context only while our own palette owns focus, never across note switches. */
export class NoteContext<File, View extends { file: File | null }> {
  private target: File | null = null;
  private pending = false;

  opened(file: File | null): void {
    if (file !== null) {
      this.target = file;
      this.pending = true;
    }
  }

  resolve(
    direct: View | null,
    activeFile: File | null,
    views: View[],
    paletteFocused: boolean,
  ): View | null {
    if (direct !== null) {
      if (this.pending && direct.file !== this.target) return null;
      this.target = direct.file;
      this.pending = false;
      return direct;
    }
    const file = this.pending
      ? this.target
      : (activeFile ?? (paletteFocused ? this.target : null));
    const matching =
      file === null ? null : views.find((view) => view.file === file);
    if (matching) {
      this.target = matching.file;
      this.pending = false;
      return matching;
    }
    if (!paletteFocused && !this.pending) this.target = null;
    return null;
  }
}

export type NoteProperties =
  | { state: "loading" }
  | { state: "ready"; frontmatter: Record<string, unknown> | undefined };

export function resolveNoteProperties(
  source: string | null,
  cacheReady: boolean,
  cached: Record<string, unknown> | undefined,
  parse: (source: string) => Record<string, unknown> | undefined,
): NoteProperties {
  if (source !== null) {
    try {
      return { state: "ready", frontmatter: parse(source) };
    } catch {
      // An unfinished/invalid property block must not become an activation prompt.
      return { state: "loading" };
    }
  }
  return cacheReady
    ? { state: "ready", frontmatter: cached }
    : { state: "loading" };
}
