# Continuity inspector

Open a screenplay or project and use **Inspect continuity** in Cmd/Ctrl+P,
the writing palette, or the scene workspace. The report is read-only and stays
in memory. **Refresh** reruns it against the current scope; click evidence to
select its original cue or heading. A changed source or dossier stops stale
navigation and asks for Refresh.

The first version checks character identities/aliases/relationship links and
offers advice about optional dossiers, likely spelling variants, unused dossiers,
empty scenes and missing time-of-day labels. Missing dossiers are not errors;
outline placeholders and omitted times may be intentional. Repeated headings
and DAY/NIGHT transitions are not errors. These rules do not assess story logic,
chronology, travel, clothing, props, injuries or characters inferred from prose.

Scope is only the current script or explicit project parts and its configured
character folder. Unsupported syntax, unresolved/ambiguous parts and unsaved
character metadata produce **Checks incomplete**, not a claim of clean continuity.
Unsupported files are skipped for scene/cue analysis. Character pages use their
existing Markdown metadata; save them before refreshing the report.

## Desktop test

Use **First Draft Test Vault**, open `Continuity Inspector Demo/Project` and run
**Inspect continuity**. Confirm optional-page advice, an empty scene, a missing
time label and a spelling variant. Character pages remain optional.

1. Click the Japanese cue and the empty-scene heading: each selects the original
   line. The accented ÉLISE cue matches the ELISE page's alias and is not flagged.
2. Refresh, then edit a part in another editor and click old evidence: navigation
   must stop until the report is refreshed.
3. Create a repeated heading with action/dialogue: repetition alone is not flagged.
4. In a disposable part, add a section or an unresolved project link: check that
   incomplete coverage is clearly disclosed, not presented as a clean report.
5. Compare source before/after checking and navigation: no note content changes.
6. Try the palette button and command; narrow the window and check evidence wraps.

Physical mobile layout/performance remains unverified. No automatic fixes, remote
analysis, clipboard access, stored findings or exported reports are included.

Desktop verification on Obsidian 1.13.7 (2026-10-03): project scope and aliases,
empty/missing-time advice, spelling advice, Japanese cue selection, Refresh and
rejection of evidence after another project part changed all passed. The scene
demo's original contents were preserved. These checks do not replace physical
mobile acceptance or the remaining scene-workspace interaction checklist.
