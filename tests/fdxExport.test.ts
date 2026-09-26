import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  DOMParser,
  onErrorStopParsing,
  type Document as XmlDocument,
} from "@xmldom/xmldom";
import { describe, expect, it } from "vitest";
import { escapeXmlText, fdxExportPath, serializeFdx } from "../src/export/fdx";
import { parseFountain } from "../src/screenplay/parser";

function fixture(name: string): string {
  return readFileSync(
    fileURLToPath(new URL(`fixtures/${name}`, import.meta.url)),
    "utf8",
  );
}

function parseXml(xml: string): XmlDocument {
  return new DOMParser({ onError: onErrorStopParsing }).parseFromString(
    xml,
    "application/xml",
  );
}

function paragraphTypes(document: XmlDocument): string[] {
  return Array.from(document.getElementsByTagName("Paragraph"), (paragraph) =>
    paragraph.getAttribute("Type"),
  ).filter((type): type is string => type !== null);
}

describe("Final Draft FDX export", () => {
  it("generates well-formed FDX with the standard document envelope", () => {
    const exported = parseXml(
      serializeFdx(parseFountain(fixture("milestone-five.fountain"))),
    );
    const root = exported.documentElement;
    if (root === null) throw new Error("FDX export has no document element");

    expect(root.tagName).toBe("FinalDraft");
    expect(root.getAttribute("DocumentType")).toBe("Script");
    expect(root.getAttribute("Template")).toBe("No");
    expect(root.getElementsByTagName("Content")).toHaveLength(1);
  });

  it("matches the paragraph structure used by the compatibility fixture", () => {
    const reference = parseXml(fixture("fdx-compatibility-reference.fdx"));
    const exported = parseXml(
      serializeFdx(parseFountain(fixture("milestone-five.fountain"))),
    );

    expect(paragraphTypes(exported)).toEqual(paragraphTypes(reference));
  });

  it("escapes XML text and removes Fountain-only force markers", () => {
    const xml = serializeFdx(parseFountain(fixture("milestone-five.fountain")));
    const exported = parseXml(xml);
    const texts = Array.from(
      exported.getElementsByTagName("Text"),
      (element) => element.textContent,
    );

    expect(xml).toContain(
      "A monitor reads: 2 &lt; 3, then &quot;READY&quot; &gt; &apos;WAIT&apos;.",
    );
    expect(texts).toContain(`A monitor reads: 2 < 3, then "READY" > 'WAIT'.`);
    expect(texts).toContain("INT. RESEARCH & DEVELOPMENT LAB - NIGHT");
    expect(texts).toContain("MEMORY CUT TO:");
  });

  it("replaces characters XML 1.0 cannot represent", () => {
    expect(escapeXmlText("safe\u0000text")).toBe("safe�text");
  });

  it("chooses a collision-safe sibling path", () => {
    expect(
      fdxExportPath(
        "Scripts/Draft.md",
        new Set(["Scripts/Draft.fdx", "Scripts/Draft-2.fdx"]),
      ),
    ).toBe("Scripts/Draft-3.fdx");
  });

  it("does not overwrite an existing FDX source", () => {
    expect(fdxExportPath("Draft.fdx", new Set(["Draft-export.fdx"]))).toBe(
      "Draft-export-2.fdx",
    );
  });
});
