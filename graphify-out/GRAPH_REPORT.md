# Graph Report - quizfree  (2026-10-16)

## Corpus Check
- Corpus is ~5,760 words - fits in a single context window. You may not need a graph.

## Summary
- 85 nodes · 144 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.83)
- Token cost: 47,914 input · 0 output

## Community Hubs (Navigation)
- Navigation & Mode Entry
- App Shell & UI State
- Learn Mode Flow
- Storage, Import & Export
- README & Escaping
- Study Logic (core.js)
- Rendering & Test Grading
- Page Markup & DOM
- Core Tests

## God Nodes (most connected - your core abstractions)
1. `go()` - 11 edges
2. `say()` - 10 edges
3. `cur()` - 8 edges
4. `render()` - 8 edges
5. `app.js script include` - 8 edges
6. `saveEdit()` - 7 edges
7. `quizfree` - 7 edges
8. `importFromHash()` - 6 edges
9. `save()` - 6 edges
10. `grade()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `esc()` --references--> `Using it`  [INFERRED]
  app.js → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Terminal shell DOM (prompt, input, output, screen)** — index_screen, index_out, index_cmd, index_cmd_input, index_prompt [EXTRACTED 1.00]

## Communities (10 total, 1 thin omitted)

### Community 0 - "Navigation & Mode Entry"
Cohesion: 0.29
Nodes (10): back(), cur(), go(), home(), openQuizlet(), runTest(), startCards(), startLearn() (+2 more)

### Community 1 - "App Shell & UI State"
Cohesion: 0.15
Nodes (10): actions, cmdInput, keys, out, SAMPLE, screen, sets, SIDE (+2 more)

### Community 4 - "Learn Mode Flow"
Cohesion: 0.47
Nodes (6): answerSide(), grade(), learnNext(), learnPick(), learnType(), other()

### Community 5 - "Storage, Import & Export"
Cohesion: 0.35
Nodes (11): addSets(), cleanSet(), exportSets(), importFromHash(), load(), plural(), removeSet(), save() (+3 more)

### Community 6 - "README & Escaping"
Cohesion: 0.22
Nodes (8): esc(), Development, Features, License, quizfree, Run it, Using it, Your data

### Community 7 - "Study Logic (core.js)"
Cohesion: 0.33
Nodes (5): choices(), createTest(), gradeTest(), isCorrect(), shuffle()

### Community 8 - "Rendering & Test Grading"
Cohesion: 0.40
Nodes (5): openSet(), render(), slug(), step(), submitTest()

### Community 3 - "Page Markup & DOM"
Cohesion: 0.19
Nodes (12): app.js script include, #cmd command form, #cmd-input command input, core.js script include, #import-file JSON deck import input, #out status output, #prompt label (guest@quizfree:~$), quizfree Terminal Page (index.html) (+4 more)

### Community 2 - "Core Tests"
Cohesion: 0.29
Nodes (4): assert, cards, Core, test

## Knowledge Gaps
- **5 isolated node(s):** `#import-file JSON deck import input`, `#out status output`, `#screen main view`, `style.css stylesheet include`, `#title header`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 34 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `esc()` connect `README & Escaping` to `App Shell & UI State`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `app.js script include` (e.g. with `#title header` and `#prompt label (guest@quizfree:~$)`) actually correct?**
  _`app.js script include` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `#import-file JSON deck import input`, `#out status output`, `#screen main view` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._