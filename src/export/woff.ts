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

import { inflate } from "pako";

/** Reconstruct the bundled WOFF's ordinary sfnt tables once per export.
 * fontkit's WOFF reader reinflates large glyph tables for every glyph lookup.
 * This preserves the source outlines and keeps all runtime work browser-only.
 */
export async function decodeWoff(bytes: Uint8Array): Promise<Uint8Array> {
  const input = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 44 || input.getUint32(0) !== 0x774f4646)
    throw new Error("Invalid bundled WOFF font");
  const count = input.getUint16(12);
  const size = input.getUint32(16);
  if (
    !count ||
    44 + count * 20 > bytes.length ||
    size > 64 * 1024 * 1024 ||
    size < 12 + count * 16
  )
    throw new Error("Invalid bundled font directory");
  const output = new Uint8Array(size);
  const header = new DataView(output.buffer);
  header.setUint32(0, input.getUint32(4));
  header.setUint16(4, count);
  const selector = Math.floor(Math.log2(count));
  const searchRange = 16 * 2 ** selector;
  header.setUint16(6, searchRange);
  header.setUint16(8, selector);
  header.setUint16(10, count * 16 - searchRange);
  let offset = 12 + count * 16;
  for (let index = 0; index < count; index++) {
    const record = 44 + index * 20;
    const start = input.getUint32(record + 4);
    const compressedLength = input.getUint32(record + 8);
    const length = input.getUint32(record + 12);
    if (
      start + compressedLength > bytes.length ||
      compressedLength > length ||
      offset + length > output.length
    )
      throw new Error("Invalid bundled font table");
    const data = bytes.subarray(start, start + compressedLength);
    const table =
      compressedLength < length
        ? typeof DecompressionStream === "undefined"
          ? inflate(data)
          : new Uint8Array(
              await new Response(
                new Blob([Uint8Array.from(data)])
                  .stream()
                  .pipeThrough(new DecompressionStream("deflate")),
              ).arrayBuffer(),
            )
        : data;
    if (table.length !== length)
      throw new Error("Invalid decoded font table length");
    const target = 12 + index * 16;
    header.setUint32(target, input.getUint32(record));
    header.setUint32(target + 4, input.getUint32(record + 16));
    header.setUint32(target + 8, offset);
    header.setUint32(target + 12, length);
    output.set(table, offset);
    offset = (offset + length + 3) & ~3;
  }
  return output;
}
