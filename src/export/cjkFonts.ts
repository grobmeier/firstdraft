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
import type { Font } from "@pdf-lib/fontkit";
import type { PDFDocument } from "pdf-lib";
import regularData from "../../assets/fonts/noto-cjk/NotoSansCJK-Regular.woff?inline";
import boldData from "../../assets/fonts/noto-cjk/NotoSansCJK-Bold.woff?inline";
import { fontBytes } from "./pdfFonts";
import type { PdfLanguage } from "./pdfLanguage";
import { decodeWoff } from "./woff";

const LANGUAGE_TAGS: Record<PdfLanguage, string> = {
  "zh-Hans": "ZHS ",
  "zh-Hant": "ZHT ",
  ja: "JAN ",
  ko: "KOR ",
};

// The installed fontkit declarations omit its documented script/language args.
// Bind per font/document: simultaneous exports must not share locale state.
export function localizeFont(font: Font, language: PdfLanguage): Font {
  const layout: (
    ...args: [...Parameters<Font["layout"]>, script?: string, language?: string]
  ) => ReturnType<Font["layout"]> = font.layout.bind(font);
  font.layout = (text, features) =>
    layout(text.normalize("NFC"), features, undefined, LANGUAGE_TAGS[language]);
  return font;
}

export async function embedCjkFonts(pdf: PDFDocument, language: PdfLanguage) {
  pdf.registerFontkit({
    create: (bytes) => localizeFont(fontkit.create(bytes), language),
  });
  const regular = await pdf.embedFont(
    await decodeWoff(fontBytes(regularData)),
    {
      subset: true,
    },
  );
  const bold = await pdf.embedFont(await decodeWoff(fontBytes(boldData)), {
    subset: true,
  });
  return { regular, bold };
}
