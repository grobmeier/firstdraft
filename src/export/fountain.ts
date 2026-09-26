export function stripObsidianFrontmatter(source: string): string {
  const normalized = source.replaceAll("\r\n", "\n");
  const lines = normalized.split("\n");
  if (lines[0]?.replace(/^\uFEFF/u, "").trim() !== "---") return source;

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---",
  );
  if (closingIndex === -1) return source;

  return lines
    .slice(closingIndex + 1)
    .join("\n")
    .replace(/^\n+/u, "");
}

export function fountainExportPath(
  sourcePath: string,
  existingPaths: ReadonlySet<string>,
): string {
  const slash = sourcePath.lastIndexOf("/");
  const directory = slash === -1 ? "" : sourcePath.slice(0, slash + 1);
  const filename = slash === -1 ? sourcePath : sourcePath.slice(slash + 1);
  const dot = filename.lastIndexOf(".");
  const basename = dot === -1 ? filename : filename.slice(0, dot);
  const extension = dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
  const exportBase = extension === "fountain" ? `${basename}-export` : basename;

  let candidate = `${directory}${exportBase}.fountain`;
  let suffix = 2;
  while (existingPaths.has(candidate)) {
    candidate = `${directory}${exportBase}-${suffix}.fountain`;
    suffix += 1;
  }
  return candidate;
}
