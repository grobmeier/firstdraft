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
import regularData from "../../assets/fonts/liberation-mono/LiberationMono-Regular.ttf?bytes";
import boldData from "../../assets/fonts/liberation-mono/LiberationMono-Bold.ttf?bytes";

export async function embedScreenplayFonts(pdf: PDFDocument) {
  pdf.registerFontkit(fontkit);
  const [regular, bold] = await Promise.all([
    pdf.embedFont(regularData, { subset: true }),
    pdf.embedFont(boldData, { subset: true }),
  ]);
  return { regular, bold };
}
