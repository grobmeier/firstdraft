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

import type { SceneChange } from "./model";

export interface SceneRecovery {
  version: 1;
  createdAt: string;
  changes: SceneChange[];
}
export interface SceneWritePort {
  read(this: void, path: string): Promise<string>;
  write(this: void, change: SceneChange): Promise<void>;
  saveRecovery(this: void, record: SceneRecovery): Promise<void>;
}

/** Destination first. Every write must compare-and-swap against the expected text. */
export async function applySceneMove(
  port: SceneWritePort,
  changes: SceneChange[],
): Promise<void> {
  for (const change of changes)
    if ((await port.read(change.path)) !== change.before)
      throw new Error(
        "A file changed since this move was planned. Refresh and try again.",
      );
  await port.saveRecovery({
    version: 1,
    createdAt: new Date().toISOString(),
    changes,
  });
  try {
    for (const change of changes) {
      await port.write(change);
    }
  } catch {
    let conflict = false;
    for (const change of [...changes].reverse()) {
      try {
        const current = await port.read(change.path);
        if (current === change.after)
          await port.write({
            path: change.path,
            before: change.after,
            after: change.before,
          });
        else if (current !== change.before) conflict = true;
      } catch {
        conflict = true;
      }
    }
    throw new Error(
      conflict
        ? "Move interrupted by another edit. The recovery copy is preserved; reconcile the affected files before restoring."
        : "Move failed. Completed writes were restored; the recovery copy is preserved.",
    );
  }
}

export async function restoreSceneMove(
  port: SceneWritePort,
  record: SceneRecovery,
): Promise<void> {
  const current = await Promise.all(
    record.changes.map((change) => port.read(change.path)),
  );
  if (
    record.changes.some(
      (change, index) =>
        current[index] !== change.before && current[index] !== change.after,
    )
  )
    throw new Error(
      "A file has changed since the move. Automatic restore stopped; your recovery copy is preserved.",
    );
  const changes = record.changes
    .filter((change, index) => current[index] === change.after)
    .map((change) => ({
      path: change.path,
      before: change.after,
      after: change.before,
    }));
  // Reuse rollback safeguards without replacing the original recovery snapshot.
  await applySceneMove({ ...port, saveRecovery: async () => {} }, changes);
}

export function isSceneRecovery(value: unknown): value is SceneRecovery {
  if (
    typeof value !== "object" ||
    value === null ||
    !("version" in value) ||
    value.version !== 1 ||
    !("createdAt" in value) ||
    typeof value.createdAt !== "string" ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    !("changes" in value) ||
    !Array.isArray(value.changes) ||
    value.changes.length < 1 ||
    value.changes.length > 2
  )
    return false;
  const paths = new Set<string>();
  return value.changes.every((change: unknown) => {
    if (
      typeof change !== "object" ||
      change === null ||
      !("path" in change) ||
      typeof change.path !== "string" ||
      !("before" in change) ||
      typeof change.before !== "string" ||
      !("after" in change) ||
      typeof change.after !== "string"
    )
      return false;
    if (
      !/\.(md|fountain)$/iu.test(change.path) ||
      change.path.startsWith(".") ||
      change.path.startsWith("/") ||
      change.path
        .split("/")
        .some((part) => !part || part === ".." || part.startsWith(".")) ||
      paths.has(change.path)
    )
      return false;
    paths.add(change.path);
    return true;
  });
}
