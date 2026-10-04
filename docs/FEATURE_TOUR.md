# First Draft feature tour

First Draft keeps Fountain or Markdown as the source of truth and adds a
screenplay-aware workspace around it. Everything shown below runs locally in
Obsidian.

The screenshots and short video show the published **0.12.0** workflow. The scene
workspace and continuity inspector below are on `main`, ready for the next release;
they are not in 0.12.0. Their dedicated screenshots are still to be captured.

## Write with the quick-access palette

The dockable First Draft palette keeps context-sensitive writing commands,
character pages, project navigation, recent characters, locations,
parentheticals, and transitions beside the editor.

![Screenplay editor and First Draft palette](images/quick-access-palette.png)

Autocomplete and keyboard-first commands cover scene headings, known
locations, times of day, character cues, character extensions,
parentheticals, and transitions. Statistics in the status bar update while the
source remains ordinary portable text.

## Combine a screenplay from several files

A project note owns the explicit reading order. Parts can live in different
folders, and the `parts` property stays readable one link per line.

![Multi-file screenplay project](images/multi-file-project.png)

Project statistics, checks, recent items, preview, and Fountain, FDX, and PDF
exports operate on the combined screenplay. Previous/next actions move between
parts without the command palette.

## Plan and navigate scenes

Choose **Scenes** in the palette or run **Open scene workspace** with Cmd/Ctrl+P.
Scene cards show headings, source parts, characters, portable `= Synopsis` notes
and approximate page positions. Search or filter by part, character, location or
time; click a heading to return to the original text.

Create scenes, edit synopses and rearrange complete scene blocks. Cross-part moves
require confirmation and saved, unchanged notes; **Restore last move** retains a
local recovery copy and refuses to overwrite later writing. Unsupported syntax
disables editing with an explanation. See the [scene workspace guide](SCENE_WORKSPACE.md)
for safety boundaries and the remaining desktop acceptance checks.

## Preview and export a readable PDF

Preview renders the active screenplay or whole project as paper-like pages.
The toolbar exports the same deterministic layout to a new PDF without
changing or overwriting the source.

![Screenplay preview](images/screenplay-preview.png)

The configured US Letter or A4 size controls both preview and PDF. See
[PDF compatibility](PDF_COMPATIBILITY.md) for the supported screenplay
elements and intentional production-pagination boundary.

## Keep character context in normal Markdown

Character dossiers hold background, wants, voice, relationships, and
continuity notes. First Draft derives appearances and dialogue usage from the
screenplay and offers the normal Obsidian Local Graph for relationships.

![Character dossier and derived screenplay context](images/character-workspace.png)

Deterministic checks report missing pages, duplicate identities, ambiguous
aliases, broken relationships, unused pages, and likely spelling variants.
They do not generate or rewrite story material.

## Review source-linked continuity signals

Run **Inspect continuity** from Cmd/Ctrl+P, the palette or the scene workspace.
It combines character identity, alias, relationship and spelling checks with
advice about optional dossiers, empty scenes and missing time-of-day labels.
Evidence opens the original cue, heading or character page; changed sources
require **Refresh** before navigation.

Only the current screenplay/project parts and configured character folder are
checked. **Checks incomplete** explicitly discloses unsupported or unresolved
scope. This is not an assessment of story logic, chronology, props or inferred
character presence, and it never rewrites your text. See the
[continuity inspector guide](CONTINUITY_INSPECTOR.md).

## Keep the terminology close

The offline cheat sheet explains screenplay terms, Fountain syntax, and First
Draft project concepts. Its examples are selectable and use the normal system
copy shortcut; the plugin itself does not access the clipboard.

![Offline screenplay cheat sheet](images/cheat-sheet.png)

## Try it safely

Run **Create example screenplay** from the First Draft palette or command
palette. It creates a self-contained tour with a project, parts, and character
dossiers. Existing vault content is never overwritten.

The 13-second [preview and PDF demo](images/firstdraft-demo.mp4) is also
available as a compact video.
