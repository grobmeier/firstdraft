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

import fontkit from "@pdf-lib/fontkit";
import type { PDFDocument } from "pdf-lib";
import regularData from "../../assets/fonts/liberation-mono/LiberationMono-Regular.ttf?inline";
import boldData from "../../assets/fonts/liberation-mono/LiberationMono-Bold.ttf?inline";

export function fontBytes(data: string): Uint8Array {
  const base64 = data.slice(data.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  // A direct copy avoids the huge intermediate character array created by
  // Uint8Array.from(string, mapper) for the bundled CJK fonts.
  for (let index = 0; index < binary.length; index++)
    bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export async function embedScreenplayFonts(pdf: PDFDocument) {
  pdf.registerFontkit(fontkit);
  const [regular, bold] = await Promise.all([
    pdf.embedFont(fontBytes(regularData), { subset: true }),
    pdf.embedFont(fontBytes(boldData), { subset: true }),
  ]);
  return { regular, bold };
}
