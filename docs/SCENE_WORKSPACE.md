# Scene workspace

Open a screenplay or its project note, then click **Scenes** in the First Draft
palette. Alternatively, use Cmd/Ctrl+P and search **Open scene workspace**.
**Writing actions** takes you back to the existing tools.

Each card shows its source heading and part, synopsis, characters and approximate
page position. Click its heading to open the original note. Search headings and
synopses, or filter by part, character, location and time. Page positions are
estimates, not exact PDF pagination. Project order comes from `parts`; the plugin
does not scan your vault or create new chapter files.

## Create and describe

**New scene** lets you choose a part, destination and before/after position, or
the end of the part. Suggestions reuse preferred scene types/times and existing
locations; the full heading remains editable. Saving inserts only your heading
and optional synopsis, then places the cursor below them for writing.

**Synopsis** edits contiguous Fountain synopsis lines immediately beneath the
heading:

```fountain
INT. STATION - DAY
= Two strangers meet before the last train.

A clock ticks.
```

Synopses stay in Fountain source/export but are omitted from statistics, preview
and PDF. Other source text is preserved.

## Rearrange safely

**Up/Down** moves a complete scene within its part. Clear filters first; otherwise
use **Move…** with an explicit destination. Destination choices include scene
numbers to distinguish repeated headings. A scene includes all text up to the
next heading or end of file; frontmatter, title metadata and pre-scene text stay
in place. Single-file changes use an editor transaction and normal undo.

Across parts, **Confirm move** requires both notes to be saved, unique resolved
project membership and an unchanged source/destination. A recovery copy is saved
before writing the destination and then removing the source block. A failed write
attempts rollback only where content still matches this operation; outside edits
are never overwritten. Cross-file writes are not atomic and are not a single
editor-undo action.

**Restore last move** previews the affected pre-move files and asks for
confirmation. It stops if either file has later edits, is missing or was renamed.
For a conflict, manually reconcile using the retained recovery copy; do not
discard later writing to force a restore. Each confirmed cross-file move replaces
the previous copy. It contains full before/after text in the plugin configuration
folder; see [Privacy](../PRIVACY.md) for retention and sync implications.

Navigation is available for unsupported boundary syntax, but mutations are
disabled with an explanation for sections, dual dialogue, boneyards, multiline
notes and code fences. Cross-file recovery rejects hidden or traversal paths.
Refresh a stale workspace before retrying.

## Desktop acceptance checklist

Use only the isolated **First Draft Test Vault**. Reload the plugin after installing
a new build. Open `Scene Workspace Demo/Project`, then open the scene workspace.

1. Confirm four scenes in part order. Click each heading; check its original
   source, including the repeated station heading and Japanese heading.
2. Search `train`, then try each filter and Clear filters. Narrow the sidebar;
   confirm headings, buttons and controls remain readable and keyboard-accessible.
3. Edit a synopsis. Check `= ...` source lines; confirm synopsis text is absent
   from preview, exported PDF and statistics.
4. Create a scene before an existing scene and at the end of the other part.
   Immediately type action: it should not replace the heading. Undo in the editor.
5. Move a scene Up/Down, then undo. Check complete dialogue and comments travel
   with it; metadata and `FADE IN:` stay in place.
6. Save both parts. Use Move… to place a scene in the other part, then Restore
   last move. Check both original contents are restored.
7. Move again, edit either affected file, and attempt restore: it must stop and
   preserve your edit. The recovery preview must remain available for reconciliation.
8. Open a move dialog, edit its source in another editor, then confirm: stale
   data must stop the move. Reload the plugin and confirm navigation/recovery
   still work. Add a section (`# Act`) in a disposable part: editing must disable
   with an explanation while navigation remains available.

Automated model, failure-recovery and Obsidian-adapter tests cover the source
safety paths. Live desktop acceptance is still required; this is not proof of
physical phone layout, undo, memory use or performance. Mobile testing remains
deferred until a device is available.
