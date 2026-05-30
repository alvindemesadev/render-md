export const NOTE_TEMPLATES = [
  {
    name: 'Meeting Notes',
    content: `# Meeting Notes

**Date:** YYYY-MM-DD
**Attendees:**
**Topic:**

## Agenda

1.

## Discussion Notes

-

## Action Items

- [ ] @person
- [ ] @person

## Next Meeting

`,
  },
  {
    name: 'Todo List',
    content: `# Todo List

## Today

- [ ]

## This Week

- [ ]

## Backlog

- [ ]

`,
  },
  {
    name: 'Bug Report',
    content: `# Bug Report

**Severity:**
**Environment:**
**Reproducible:** Always / Sometimes / Rarely

## Description

## Steps to Reproduce

1.
2.
3.

## Expected Behavior

## Actual Behavior

## Screenshots / Logs

`,
  },
  {
    name: 'Changelog',
    content: `# Changelog

## [Unreleased]

### Added

-

### Changed

-

### Fixed

-

### Removed

-


## [1.0.0] - YYYY-MM-DD

### Added

- Initial release
`,
  },
  {
    name: 'Project Plan',
    content: `# Project Plan

## Overview

## Goals

1.
2.
3.

## Timeline

| Milestone | Date | Status |
|-----------|------|--------|
|           |      |        |
|           |      |        |
|           |      |        |

## Resources

## Risks

`,
  },
  {
    name: 'Mermaid Flowchart',
    content: `# Mermaid Flowchart

Below is a sample flowchart. You can customize the nodes and connections.

\`\`\`mermaid
flowchart TD
    Start --> Process[Research & Plan]
    Process --> Design{Approvals?}
    Design -- Yes --> Code[Build Features]
    Design -- No --> Process
    Code --> End([Release App])
\`\`\`
`,
  },
  {
    name: 'Mermaid Sequence Diagram',
    content: `# Mermaid Sequence Diagram

Below is a sample sequence diagram showing client-server interaction.

\`\`\`mermaid
sequenceDiagram
    autonumber
    Actor User as Writer
    participant App as RenderMD Client
    participant Local as LocalStorage

    User->>App: Type note content
    App->>App: Wait for 300ms (debounce)
    App->>Local: Save note snapshot
    Local-->>App: Acknowledge write success
    App-->>User: Show "Saved" status
\`\`\`
`,
  },
  {
    name: 'Mermaid Mindmap',
    content: `# Mermaid Mindmap

Below is a sample mindmap organizing application concepts.

\`\`\`mermaid
mindmap
  root((RenderMD))
    Editor
      CodeMirror 6
      Prose themes
      Vim keybindings
    Preview
      Markdown parser
      Syntax highlighting
      Mermaid diagrams
    Storage
      LocalStorage
      Version history
      Gist sync
\`\`\`
`,
  },
  {
    name: 'Mermaid Gantt Chart',
    content: `# Mermaid Gantt Chart

Below is a sample project timeline using a Gantt chart.

\`\`\`mermaid
gantt
    title RenderMD Project Timeline
    dateFormat  YYYY-MM-DD
    section Design
    Research & Planning :a1, 2026-05-30, 2d
    section Development
    Performance Tweaks  :after a1, 3d
    Custom Sepia Theme  :after a1, 4d
    Tagging Editor UI   :5d
    section Launch
    Testing & Review    :2d
    Deploy Production   :1d
\`\`\`
`,
  },
]
