// quizfree core: pure study logic, shared by the app (window.Core) and the tests (require).
(function (root) {
  // Lenient answer matching: case, accents, punctuation and extra spaces don't count.
  const normalize = s => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

  // comparison key for answers; symbol-only answers (e.g. "+") normalize to '', so keep them as-is
  const key = v => normalize(v) || v;

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

  // Test: a one-shot quiz. Picked cards are split evenly across the chosen types,
  // and matching comes in groups of 2-6 so the dropdowns stay short.
  const TEST_TYPES = ['match', 'choice', 'written'];

  function createTest(cards, { count = 20, types = TEST_TYPES, ask = 'term' } = {}) {
    const side = ask === 'term' ? 'def' : 'term';
    const picked = shuffle(cards).slice(0, Math.max(0, Math.min(count, cards.length)));
    const order = TEST_TYPES.filter(t => types.includes(t));
    const sizes = order.map((_, i) => Math.floor(picked.length / order.length) + (i < picked.length % order.length ? 1 : 0));
    // a 1-item matching question is free points; hand that card to the next type
    if (order[0] === 'match' && sizes[0] === 1 && order.length > 1) { sizes[0] = 0; sizes[1]++; }

    const questions = [];
    let at = 0;
    order.forEach((type, i) => {
      const block = picked.slice(at, (at += sizes[i]));
      if (type === 'match') {
        const groups = Math.ceil(block.length / 6);
        for (let g = 0; g < groups; g++) {
          const items = block.filter((_, j) => j % groups === g).map(c => ({ prompt: c[ask], answer: c[side] }));
          questions.push({ type, items, options: shuffle(items.map(it => it.answer)) });
        }
      } else {
        for (const c of block) questions.push({ type, prompt: c[ask], answer: c[side], ...(type === 'choice' && { options: choices(cards, c, side) }) });
      }
    });
    return { questions, ask };
  }

  // answers[i]: match -> array of picked option texts, choice -> picked option text, written -> typed text.
  // One point per matching item, choice and written question; null or '' counts as blank (and wrong).
  function gradeTest(test, answers) {
    const results = test.questions.map((q, i) => {
      const a = answers[i];
      if (q.type === 'match') return q.items.map((it, j) => a?.[j] != null && key(a[j]) === key(it.answer));
      if (q.type === 'choice') return [a != null && key(a) === key(q.answer)];
      return [isCorrect(a || '', q.answer)];
    });
    const flat = results.flat();
    const blank = answers.flat().filter(a => a == null || !String(a).trim()).length;
    return { results, score: flat.filter(Boolean).length, total: flat.length, blank };
  }

  // Only https quizlet.com links get opened from the quizlet command.
  function quizletUrl(input) {
    try {
      const u = new URL(String(input).trim());
      return u.protocol === 'https:' && /(^|\.)quizlet\.com$/.test(u.hostname) ? u.href : null;
    } catch { return null; }
  }

  const Core = { normalize, isCorrect, shuffle, choices, createSession, current, answer, parseCards, createTest, gradeTest, quizletUrl };
  if (typeof module === 'object' && module.exports) module.exports = Core; else root.Core = Core;
})(this);
