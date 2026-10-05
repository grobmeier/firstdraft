# Privacy

First Draft processes screenplay text locally inside Obsidian.

- It does not include telemetry or analytics.
- It does not send screenplay text or usage data over the network.
- It does not require an account or cloud service.
- Optional CJK PDF font installation reads only the two files explicitly selected
  in the device file picker. Their official hashes are verified before storage
  in the plugin configuration directory as six chunks of at most 4 MB. PDF
  export reads only those known paths and verifies their hashes again. Fonts
  are never automatically downloaded; the user may obtain the official files
  separately through their browser. Auxiliary plugin-file sync is not assumed.
- It reconstructs screenplay statistics from the current document rather than
  maintaining an external character database.
- It does not enumerate every file in the vault. Project discovery is limited
  to the active note's explicit project link and its ancestor folders; character
  discovery is limited to the configured project-local character folder.
- It reads note contents only for the current screenplay and its explicitly
  ordered project parts, the project note and character pages selected from the
  configured character folder. The inspector reads these pages to capture
  source snapshots and reject stale navigation.
- Continuity findings stay in memory, are regenerated on Refresh and are not
  written into notes or a diagnostic database. There is no remote analysis or
  automatic correction of screenplay or character text.
- It does not read or write the system clipboard. Cheat-sheet examples are
  selectable text that users can copy with their normal system shortcut.
- A confirmed cross-file scene move stores both files' complete before/after
  text in `scene-recovery.json` inside this plugin's vault configuration folder
  (normally `.obsidian/plugins/firstdraft`). The next confirmed cross-file move
  replaces this single recovery copy; restoring does not delete it. It is plain
  text, not encrypted, and may be included in vault backups or configuration
  sync. After recovery is no longer needed, users can remove that file manually.
  Single-file scene edits do not create a recovery copy.

Obsidian, installed third-party plugins, sync providers, and the operating
system are outside First Draft's control and have their own privacy behaviour.
