# Graph Report - quizfree  (2026-10-15)

## Corpus Check
- Corpus is ~2,751 words - fits in a single context window. You may not need a graph.

## Summary
- 63 nodes · 103 edges · 6 communities
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.82)
- Token cost: 47,914 input · 0 output

## Community Hubs (Navigation)
- Navigation & Set Actions
- App Shell & UI State
- Study Core & Tests
- Page Markup & DOM
- Learn Mode Flow
- Storage Loading

## God Nodes (most connected - your core abstractions)
1. `go()` - 8 edges
2. `app.js script include` - 8 edges
3. `say()` - 7 edges
4. `render()` - 7 edges
5. `saveEdit()` - 7 edges
6. `cur()` - 6 edges
7. `grade()` - 5 edges
8. `removeSet()` - 5 edges
9. `quizfree Terminal Page (index.html)` - 5 edges
10. `slug()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `saveEdit()` --calls--> `uid()`  [EXTRACTED]
  app.js → app.js  _Bridges community 5 → community 0_
- `render()` --calls--> `slug()`  [EXTRACTED]
  app.js → app.js  _Bridges community 0 → community 4_

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Terminal shell DOM (prompt, input, output, screen)** — index_screen, index_out, index_cmd, index_cmd_input, index_prompt [EXTRACTED 1.00]

## Communities (6 total, 0 thin omitted)

### Community 0 - "Navigation & Set Actions"
Cohesion: 0.26
Nodes (14): back(), cur(), exportSets(), go(), home(), openSet(), plural(), removeSet() (+6 more)

### Community 1 - "App Shell & UI State"
Cohesion: 0.15
Nodes (9): actions, cmdInput, keys, out, SAMPLE, screen, sets, SIDE (+1 more)

### Community 2 - "Study Core & Tests"
Cohesion: 0.17
Nodes (6): choices(), shuffle(), assert, cards, Core, test

### Community 3 - "Page Markup & DOM"
Cohesion: 0.19
Nodes (12): app.js script include, #cmd command form, #cmd-input command input, core.js script include, IBM Plex Mono (Google Fonts), #import-file JSON deck import input, #out status output, #prompt label (guest@quizfree:~$) (+4 more)

### Community 4 - "Learn Mode Flow"
Cohesion: 0.43
Nodes (7): answerSide(), grade(), learnNext(), learnPick(), learnType(), render(), step()

### Community 5 - "Storage Loading"
Cohesion: 0.67
Nodes (3): cleanSet(), load(), uid()

## Knowledge Gaps
- **5 isolated node(s):** `#screen main view`, `#out status output`, `#title header`, `#import-file JSON deck import input`, `style.css stylesheet include`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 26 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `go()` connect `Navigation & Set Actions` to `App Shell & UI State`, `Learn Mode Flow`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `app.js script include` (e.g. with `#cmd command form` and `core.js script include`) actually correct?**
  _`app.js script include` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `#screen main view`, `#out status output`, `#title header` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._