# Graph Report - quizfree  (2026-10-16)

## Corpus Check
- Corpus is ~6,740 words - fits in a single context window. You may not need a graph.

## Summary
- 99 nodes · 184 edges · 9 communities (8 shown, 1 thin omitted)
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.84)
- Token cost: 47,914 input · 0 output

## Community Hubs (Navigation)
- Navigation & Resume
- App Shell & UI State
- Learn Mode Flow
- Storage, Import & Export
- README & Escaping
- Study Logic & Tests
- Rendering, Progress & Test Answers
- Page Markup & DOM

## God Nodes (most connected - your core abstractions)
1. `go()` - 12 edges
2. `render()` - 12 edges
3. `say()` - 11 edges
4. `cur()` - 9 edges
5. `resume()` - 8 edges
6. `app.js script include` - 8 edges
7. `startTest()` - 7 edges
8. `removeSet()` - 7 edges
9. `saveEdit()` - 7 edges
10. `saveProgress()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `esc()` --references--> `Using it`  [INFERRED]
  app.js → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Terminal shell DOM (prompt, input, output, screen)** — index_screen, index_out, index_cmd, index_cmd_input, index_prompt [EXTRACTED 1.00]

## Communities (9 total, 1 thin omitted)

### Community 0 - "Navigation & Resume"
Cohesion: 0.28
Nodes (13): back(), cur(), go(), home(), loadProgress(), openQuizlet(), resume(), runTest() (+5 more)

### Community 1 - "App Shell & UI State"
Cohesion: 0.12
Nodes (14): isStr(), validQuestion(), actions, cmdInput, keys, out, SAMPLE, screen (+6 more)

### Community 4 - "Learn Mode Flow"
Cohesion: 0.47
Nodes (6): answerSide(), grade(), learnNext(), learnPick(), learnType(), other()

### Community 5 - "Storage, Import & Export"
Cohesion: 0.28
Nodes (13): addSets(), cleanSet(), exportSets(), importFromHash(), load(), openSet(), plural(), removeSet() (+5 more)

### Community 6 - "README & Escaping"
Cohesion: 0.22
Nodes (8): esc(), Development, Features, License, quizfree, Run it, Using it, Your data

### Community 7 - "Study Logic & Tests"
Cohesion: 0.16
Nodes (9): choices(), createTest(), gradeTest(), isCorrect(), shuffle(), assert, cards, Core (+1 more)

### Community 8 - "Rendering, Progress & Test Answers"
Cohesion: 0.25
Nodes (9): fingerprint(), keepAnswers(), readAnswers(), render(), saveProgress(), step(), submitTest(), toggleSelected() (+1 more)

### Community 3 - "Page Markup & DOM"
Cohesion: 0.19
Nodes (12): app.js script include, #cmd command form, #cmd-input command input, core.js script include, #import-file JSON deck import input, #out status output, #prompt label (guest@quizfree:~$), quizfree Terminal Page (index.html) (+4 more)

## Knowledge Gaps
- **5 isolated node(s):** `#import-file JSON deck import input`, `#out status output`, `#screen main view`, `style.css stylesheet include`, `#title header`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 37 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `esc()` connect `README & Escaping` to `App Shell & UI State`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `resume()` (e.g. with `startCards()` and `startLearn()`) actually correct?**
  _`resume()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `#import-file JSON deck import input`, `#out status output`, `#screen main view` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Shell & UI State` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._