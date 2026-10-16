// quizfree core: pure study logic, shared by the app (window.Core) and the tests (require).
(function (root) {
  // Lenient answer matching: case, accents, punctuation and extra spaces don't count.
  const normalize = s => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

  function isCorrect(input, answer) {
    const a = normalize(answer);
    // answers made only of symbols (e.g. "+") normalize to '', so compare them as typed
    return a ? normalize(input) === a : String(input).trim() === String(answer).trim();
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Up to n options: the right answer plus distinct wrong answers from the same set.
  function choices(cards, card, side, n = 4) {
    const key = v => normalize(v) || v;
    const seen = new Set([key(card[side])]), wrong = [];
    for (const c of shuffle(cards)) {
      const k = key(c[side]);
      if (!seen.has(k)) { seen.add(k); wrong.push(c[side]); }
    }
    return shuffle([card[side], ...wrong.slice(0, n - 1)]);
  }

  // Learn session. Each card goes stage 0 (multiple choice) -> 1 (type it) -> 2 (mastered).
  const createSession = cards => ({ queue: shuffle(cards).map(card => ({ card, stage: 0 })), done: 0, total: cards.length });
  const current = s => s.queue[0] || null;

  function answer(s, correct) {
    const item = s.queue.shift();
    if (correct) item.stage++;
    if (item.stage >= 2) { s.done++; return; }
    // right: back of the line, so other cards come before its typed round; wrong: retry soon
    s.queue.splice(correct ? s.queue.length : Math.min(3, s.queue.length), 0, item);
  }

  // One card per line, "term<TAB>definition" (Quizlet/Sheets paste) or "term - definition".
  function parseCards(text) {
    const cards = [], bad = [];
    text.split('\n').forEach((line, i) => {
      if (!line.trim()) return;
      let at = line.indexOf('\t'), len = 1;
      if (at < 0) { at = line.indexOf(' - '); len = 3; }
      const term = at < 0 ? '' : line.slice(0, at).trim();
      const def = at < 0 ? '' : line.slice(at + len).trim();
      if (term && def) cards.push({ term, def }); else bad.push(i + 1);
    });
    return { cards, bad };
  }

  const Core = { normalize, isCorrect, shuffle, choices, createSession, current, answer, parseCards };
  if (typeof module === 'object' && module.exports) module.exports = Core; else root.Core = Core;
})(this);
