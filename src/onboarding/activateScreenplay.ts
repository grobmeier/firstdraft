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

import { isCharacterFrontmatter } from "../characters/catalogue";
import { isScreenplayProjectFrontmatter } from "../projects/model";

export interface ActivationFile {
  extension: string;
}

export interface ActivationContext<T extends ActivationFile> {
  activeFile(): T | null;
  activationEnabled(): boolean;
  isProtected(file: T): boolean;
  processFrontMatter(
    file: T,
    update: (frontmatter: Record<string, unknown>) => void,
  ): Promise<void>;
}

export type ActivationResult =
  "activated" | "already-active" | "unavailable" | "disabled" | "busy";

const pending = new WeakSet<ActivationFile>();

export async function activateScreenplay<T extends ActivationFile>(
  context: ActivationContext<T>,
  file: T,
): Promise<ActivationResult> {
  const availability = (): "unavailable" | "disabled" | null => {
    if (
      context.activeFile() !== file ||
      file.extension !== "md" ||
      context.isProtected(file)
    )
      return "unavailable";
    if (!context.activationEnabled()) return "disabled";
    return null;
  };
  const unavailable = availability();
  if (unavailable !== null) return unavailable;
  if (pending.has(file)) return "busy";

  pending.add(file);
  try {
    let result: ActivationResult = "unavailable";
    await context.processFrontMatter(file, (frontmatter) => {
      const unavailable = availability();
      if (unavailable !== null) {
        result = unavailable;
        return;
      }
      if (
        isCharacterFrontmatter(frontmatter) ||
        isScreenplayProjectFrontmatter(frontmatter)
      )
        return;
      if (frontmatter.screenplay === true) {
        result = "already-active";
        return;
      }
      frontmatter.screenplay = true;
      result = "activated";
    });
    return result;
  } finally {
    pending.delete(file);
  }
}
