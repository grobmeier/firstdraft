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

import { describe, expect, it } from "vitest";
import {
  applySceneMove,
  restoreSceneMove,
  isSceneRecovery,
  type SceneRecovery,
  type SceneWritePort,
} from "../src/scenes/transactions";
import type { SceneChange } from "../src/scenes/model";

const changes: SceneChange[] = [
  { path: "Two.md", before: "Destination", after: "Destination + Scene" },
  { path: "One.md", before: "Source + Scene", after: "Source" },
];
function fixture() {
  const files = new Map(changes.map((change) => [change.path, change.before]));
  const events: string[] = [];
  let recovery: SceneRecovery | null = null;
  const port: SceneWritePort = {
    read: async (path) => {
      const value = files.get(path);
      if (value === undefined) throw new Error("Missing file");
      return value;
    },
    write: async (change) => {
      events.push(change.path);
      if (files.get(change.path) !== change.before) throw new Error("Conflict");
      files.set(change.path, change.after);
    },
    saveRecovery: async (record) => {
      events.push("recovery");
      recovery = record;
    },
  };
  return {
    files,
    events,
    port,
    getRecovery: () => {
      if (!recovery) throw new Error("Missing recovery");
      return recovery;
    },
  };
}
describe("scene move recovery", () => {
  it("persists before writing, writes destination before source and restores both", async () => {
    const f = fixture();
    await applySceneMove(f.port, changes);
    expect(f.events).toEqual(["recovery", "Two.md", "One.md"]);
    expect(isSceneRecovery(f.getRecovery())).toBe(true);
    await restoreSceneMove(f.port, f.getRecovery());
    expect([...f.files.values()]).toEqual(
      changes.map((change) => change.before),
    );
    expect(f.events.filter((event) => event === "recovery")).toHaveLength(1);
  });
  it("aborts stale plans before replacing recovery or writing", async () => {
    const f = fixture();
    f.files.set("One.md", "Later edit");
    await expect(applySceneMove(f.port, changes)).rejects.toThrow("changed");
    expect(f.events).toEqual([]);
  });
  it("does not write if recovery persistence fails", async () => {
    const f = fixture();
    f.port.saveRecovery = async () => {
      throw new Error("Disk full");
    };
    await expect(applySceneMove(f.port, changes)).rejects.toThrow("Disk full");
    expect(f.events).toEqual([]);
  });
  it("rolls back destination if source write fails", async () => {
    const f = fixture();
    const write = f.port.write;
    f.port.write = async (change) => {
      if (change.path === "One.md") throw new Error("Cannot write");
      await write(change);
    };
    await expect(applySceneMove(f.port, changes)).rejects.toThrow(
      "Completed writes were restored",
    );
    expect([...f.files.values()]).toEqual(
      changes.map((change) => change.before),
    );
    expect(f.getRecovery().changes).toEqual(changes);
  });
  it("also recovers a write that reports failure after changing a file", async () => {
    const f = fixture();
    const write = f.port.write;
    let once = true;
    f.port.write = async (change) => {
      await write(change);
      if (once) {
        once = false;
        throw new Error("Unknown write outcome");
      }
    };
    await expect(applySceneMove(f.port, changes)).rejects.toThrow(
      "Completed writes were restored",
    );
    expect([...f.files.values()]).toEqual(
      changes.map((change) => change.before),
    );
  });
  it("never rolls back over an external edit", async () => {
    const f = fixture();
    const write = f.port.write;
    f.port.write = async (change) => {
      if (change.path === "One.md") {
        f.files.set("Two.md", "External edit");
        throw new Error("Cannot write");
      }
      await write(change);
    };
    await expect(applySceneMove(f.port, changes)).rejects.toThrow("reconcile");
    expect(f.files.get("Two.md")).toBe("External edit");
  });
  it("rejects restore if either file has later edits, without any writes", async () => {
    const f = fixture();
    await applySceneMove(f.port, changes);
    f.events.length = 0;
    f.files.set("One.md", "Later edit");
    await expect(restoreSceneMove(f.port, f.getRecovery())).rejects.toThrow(
      "Automatic restore stopped",
    );
    expect(f.events).toEqual([]);
  });
  it("handles mixed before/after states after an interrupted operation", async () => {
    const f = fixture();
    await f.port.saveRecovery({
      version: 1,
      createdAt: new Date().toISOString(),
      changes,
    });
    f.files.set("Two.md", changes[0]?.after ?? "");
    await restoreSceneMove(f.port, f.getRecovery());
    expect([...f.files.values()]).toEqual(
      changes.map((change) => change.before),
    );
  });
  it("rolls back a partially failed restore while preserving the original recovery", async () => {
    const f = fixture();
    await applySceneMove(f.port, changes);
    const record = f.getRecovery();
    const write = f.port.write;
    f.port.write = async (change) => {
      if (change.path === "One.md") throw new Error("Restore failed");
      await write(change);
    };
    await expect(restoreSceneMove(f.port, record)).rejects.toThrow("restored");
    expect([...f.files.values()]).toEqual(
      changes.map((change) => change.after),
    );
    expect(f.getRecovery()).toBe(record);
  });
  it.each([
    "../Film.md",
    "/Film.md",
    ".obsidian/settings.md",
    "Film/../Other.md",
    "Film/.hidden/Other.md",
    "Film.txt",
  ])("rejects unsafe recovery paths: %s", (path) =>
    expect(
      isSceneRecovery({
        version: 1,
        createdAt: new Date().toISOString(),
        changes: [{ path, before: "A", after: "B" }],
      }),
    ).toBe(false),
  );
  it("rejects duplicates, invalid versions and malformed records", () => {
    expect(
      isSceneRecovery({
        version: 1,
        createdAt: new Date().toISOString(),
        changes: [changes[0], changes[0]],
      }),
    ).toBe(false);
    expect(isSceneRecovery({ version: 2, changes })).toBe(false);
    expect(isSceneRecovery({ version: 1, createdAt: "invalid", changes })).toBe(
      false,
    );
    expect(isSceneRecovery(null)).toBe(false);
  });
});
