# Gate reports — p-options-lab-create-edit-dialog

Delta files one report per phase: `W0-G.md`, `DLG0-G.md`, `DLG1-G.md`, `DLG2-G.md`, `DLG3-G.md`,
`DLG4-G.md`, `DLGZ-G.md`.

Every report contains:

1. Verdict: **PASS** / **FAIL** / **BLOCKED**.
2. The fifteen-row AT-DLG-1…15 table, each **PASS / FAIL / BLOCKED**, with evidence.
3. Files touched vs the seed allowlist. Extra file = FAIL.
4. Spec laws covering **every file the phase touched**, not only named ATs.
5. Echo / Tango sign when the phase seats them.

AT-DLG-4 and AT-DLG-15 are greps. Commands are in plan §7.

Screenshots for visual ATs land in a per-phase subdirectory (`dlg1/`, `dlg2/`, `dlgz/`).
