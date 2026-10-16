# quizfree

Free flashcards for you and your friends, with a terminal-style UI. No account, no server, no build step. It's three static files you can open in a browser.

## Features

- **Multiple study sets.** Create, edit, delete, and switch between as many sets as you want.
- **Flashcards.** Flip, step through, and shuffle.
- **Learn mode** (like Quizlet / Anki):
  1. You see one side of a card and pick the right answer out of **4 choices**.
  2. Once you get it right, the card goes to the back of the line. Later you have to **type the answer out**.
  3. Get the typed version right and the card is **mastered**. Wrong answers come back a few cards later.
  - Typed answers ignore case, accents, punctuation, and extra spaces (`adios` matches `adiós`). Press **[o]** to override when you were right anyway.
  - Press **[t]** to swap sides, so you're shown the definition and answer with the term.
- **Test mode** (like Quizlet's Test). One page of questions, graded when you submit:
  - Pick the question types: **matching**, **multiple choice**, and **written** (short answer). Also pick the number of questions and which side you're shown.
  - You get a score and percentage, with a ✓/✗ on every question and the right answer shown under each miss.
  - **[r]** retakes with new questions; **[n]** changes the settings.
- **Terminal UI.** Everything is clickable, but you can also drive it from the keyboard or the command line at the bottom.
- **Share sets.** Export a set as `.json`, send it to a friend, and they import it. To export several sets as one file, select them on the set list with **shift + number** (or shift + click), then press **[e]**.
- **Picks up where you left off.** Close the tab mid-flashcards, mid-learn or mid-test, and reopening quizfree returns you to the same card, learn progress or test answers. Each set keeps its own progress. Editing a set's cards starts its progress over.
- **Copy sets from Quizlet links.** Press **[q]** (or type `quizlet <link>`) and follow the steps on screen:
  1. One time: drag the **→ quizfree** button to your bookmarks bar.
  2. Paste a Quizlet set link. quizfree opens it in a new tab.
  3. Click the **→ quizfree** bookmark on the Quizlet page. On the online version, the set is added to quizfree automatically. On a copy opened from your disk, the bookmark downloads a `.json` instead; press **[i]** to import it.
  - Why a bookmark? Quizlet blocks other sites from reading its pages, so the copying has to happen inside your own browser, on the page you already have open. Click the bookmark again after "See more" to pick up the rest of a long set.
- **Quizlet/spreadsheet paste.** When editing a set, paste tab-separated `term⇥definition` lines directly.

## Run it

**Online:** https://3tanley.github.io/quizfree/. Share this link with friends; each person's sets stay in their own browser.

**Offline:** open `index.html` in a browser. Everything works except one-click Quizlet adding (see below). Sets saved in the online and offline copies are separate; use export/import to move them.

## Using it

| Where | Keys |
|---|---|
| anywhere | `:` jump to command line · `esc` back |
| set list | `1`–`9` open set · `shift`+`1`–`9` select · `n` new · `q` from quizlet · `i` import · `e` export selected (or all) · `esc` clear selection |
| a set | `f` flashcards · `l` learn · `t` test · `e` edit · `x` export · `d` delete |
| flashcards | `space` flip · `←` `→` prev/next · `s` shuffle |
| learn | `1`–`4` pick · type + `enter` · `enter` continue · `o` override · `t` swap sides |
| test | `enter` next field · `ctrl+enter` / `⌘enter` submit · `n` start over / new test · `r` retake |
| editor | `ctrl+s` / `⌘s` save |

Command line: `help`, `ls`, `cd <n|name>`, `cd ..`, `new`, `quizlet [link]`, `edit`, `rm`, `cards`, `learn`, `test`, `import`, `export`, `clear`.

Card format in the editor is one card per line:

```
hola - hello
perro	dog        ← a tab works too
```

## Your data

Sets and study progress are saved in your browser's `localStorage`, so they stay on that one browser on that one device. Clearing site data deletes them, so **use export to back up** or move sets to another device. Imported files are validated: unknown fields are dropped, text is length-capped, and files must be under 5 MB.

## Development

```
core.js            study logic (learn session, test builder + grading, answer matching, card parsing)
app.js             UI: views, keyboard shortcuts, command line, storage, import/export
style.css          terminal look
index.html         page shell
bookmarklet.js     the → quizfree bookmark (runs on quizlet.com set pages, not in the app)
test/core.test.js  tests for core.js
graphify-out/      knowledge graph of this codebase (open graph.html)
```

Run the tests (Node 18+, no install needed):

```
node --test
```

## License

See [LICENSE](LICENSE).
