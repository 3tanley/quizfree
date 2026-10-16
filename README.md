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
- **Terminal UI.** Everything is clickable, but you can also drive it from the keyboard or the command line at the bottom.
- **Share sets.** Export a set as `.json`, send it to a friend, and they import it.
- **Quizlet/spreadsheet paste.** When editing a set, paste tab-separated `term⇥definition` lines directly.

## Run it

Open `index.html` in a browser. That's it.

To give friends a link, turn on GitHub Pages: repo **Settings → Pages → Deploy from branch → `main` / root**. Then share `https://3tanley.github.io/quizfree/`.

## Using it

| Where | Keys |
|---|---|
| anywhere | `:` jump to command line · `esc` back |
| set list | `1`–`9` open set · `n` new · `i` import · `e` export all |
| a set | `f` flashcards · `l` learn · `e` edit · `x` export · `d` delete |
| flashcards | `space` flip · `←` `→` prev/next · `s` shuffle |
| learn | `1`–`4` pick · type + `enter` · `enter` continue · `o` override · `t` swap sides |
| editor | `ctrl+s` / `⌘s` save |

Command line: `help`, `ls`, `cd <n|name>`, `cd ..`, `new`, `edit`, `rm`, `cards`, `learn`, `import`, `export`, `clear`.

Card format in the editor is one card per line:

```
hola - hello
perro	dog        ← a tab works too
```

## Your data

Sets are saved in your browser's `localStorage`, so they stay on that one browser on that one device. Clearing site data deletes them, so **use export to back up** or move sets to another device. Imported files are validated: unknown fields are dropped, text is length-capped, and files must be under 5 MB.

## Development

```
core.js            study logic (learn session, answer matching, multiple choice, card parsing)
app.js             UI: views, keyboard shortcuts, command line, storage, import/export
style.css          terminal look
index.html         page shell
test/core.test.js  tests for core.js
graphify-out/      knowledge graph of this codebase (open graph.html)
```

Run the tests (Node 18+, no install needed):

```
node --test
```

## License

See [LICENSE](LICENSE).
