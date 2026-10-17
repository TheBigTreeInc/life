# ADR-0074 — Running bundle version and mobile About

The game menu exposes the version embedded at HTML build time. The version must not be taken from a remote deployment status or cached ZipRunner state. The player can inspect the mode and copy redacted diagnostics (version, ruleset, week, online role, language, page path); credentials and invite codes are excluded. The compact phone board and End Week/Work/Done controls remain unchanged.

On-device verification is required for visual layout, dialog focus behavior and clipboard permissions.
