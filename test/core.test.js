const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../core.js');

const cards = [['hola', 'hello'], ['adiós', 'goodbye'], ['gracias', 'thank you'], ['perro', 'dog'], ['gato', 'cat']]
  .map(([term, def]) => ({ term, def }));

test('isCorrect ignores case, accents, punctuation and spacing', () => {
  assert.ok(Core.isCorrect('  Adios! ', 'adiós'));
  assert.ok(Core.isCorrect('thank-you', 'Thank you'));
  assert.ok(Core.isCorrect('+', '+'));
  assert.ok(!Core.isCorrect('', 'hello'));
  assert.ok(!Core.isCorrect('hell', 'hello'));
  assert.ok(!Core.isCorrect('-', '+'));
});

test('choices gives 4 distinct options including the answer', () => {
  for (let i = 0; i < 50; i++) {
    const o = Core.choices(cards, cards[0], 'def');
    assert.equal(o.length, 4);
    assert.ok(o.includes('hello'));
    assert.equal(new Set(o).size, 4);
  }
  assert.deepEqual(Core.choices(cards.slice(0, 2), cards[0], 'def').sort(), ['goodbye', 'hello']);
});

test('parseCards accepts tab or " - " and reports bad lines', () => {
  const { cards: c, bad } = Core.parseCards('a\tb\nc - d - e\n\nnope\n');
  assert.deepEqual(c, [{ term: 'a', def: 'b' }, { term: 'c', def: 'd - e' }]);
  assert.deepEqual(bad, [4]);
});

test('learn: every card is chosen first, typed later, then mastered', () => {
  const s = Core.createSession(cards);
  const stages = new Map();
  let steps = 0, item;
  while ((item = Core.current(s))) {
    stages.set(item.card, [...(stages.get(item.card) || []), item.stage]);
    Core.answer(s, true);
    steps++;
  }
  assert.equal(s.done, cards.length);
  assert.equal(steps, cards.length * 2);
  for (const st of stages.values()) assert.deepEqual(st, [0, 1]);
});

test('learn: right answer goes to the back, wrong answer retries soon at the same stage', () => {
  const s = Core.createSession(cards);
  const a = Core.current(s).card;
  Core.answer(s, true);
  assert.equal(s.queue.at(-1).card, a);

  const b = Core.current(s).card;
  Core.answer(s, false);
  const pos = s.queue.findIndex(i => i.card === b);
  assert.equal(pos, 3);
  assert.equal(s.queue[pos].stage, 0);
  assert.equal(s.done, 0);
});

test('createTest splits cards evenly across types; matching groups hold 2-6 items', () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ term: 't' + i, def: 'd' + i }));
  const t = Core.createTest(many, { count: 20 });
  const by = type => t.questions.filter(q => q.type === type);
  const matchItems = by('match').flatMap(q => q.items);
  assert.deepEqual([matchItems.length, by('choice').length, by('written').length], [7, 7, 6]);
  for (const q of by('match')) {
    assert.ok(q.items.length >= 2 && q.items.length <= 6);
    assert.deepEqual([...q.options].sort(), q.items.map(i => i.answer).sort());
  }
  for (const q of by('choice')) {
    assert.equal(q.options.length, 4);
    assert.ok(q.options.includes(q.answer));
  }
  const prompts = [...matchItems, ...by('choice'), ...by('written')].map(q => q.prompt);
  assert.equal(new Set(prompts).size, 20);
  assert.ok(prompts.every(p => p.startsWith('t')));
});

test('createTest respects type choice, side and count, and avoids 1-item matching', () => {
  const onlyWritten = Core.createTest(cards, { count: 3, types: ['written'], ask: 'def' });
  assert.equal(onlyWritten.questions.length, 3);
  assert.ok(onlyWritten.questions.every(q => q.type === 'written' && cards.some(c => c.def === q.prompt && c.term === q.answer)));

  const two = Core.createTest(cards.slice(0, 2), { count: 2 }); // would be 1 match + 1 choice
  assert.deepEqual(two.questions.map(q => q.type), ['choice', 'choice']);
  assert.equal(Core.createTest(cards, { count: 99 }).questions.flatMap(q => q.items || [q]).length, cards.length);
});

test('gradeTest scores each matching item, choice and written answer; blanks count wrong', () => {
  const t = { questions: [
    { type: 'match', items: [{ prompt: 'a', answer: 'A' }, { prompt: 'b', answer: 'B' }], options: ['B', 'A'] },
    { type: 'choice', prompt: 'c', answer: 'C', options: ['C', 'D'] },
    { type: 'written', prompt: 'd', answer: 'thank you' },
    { type: 'written', prompt: 'e', answer: 'E' },
    { type: 'choice', prompt: 'f', answer: 'F', options: ['F', 'G'] },
  ] };
  const r = Core.gradeTest(t, [['A', 'A'], 'C', 'Thank-you!', '', null]);
  assert.deepEqual(r.results, [[true, false], [true], [true], [false], [false]]);
  assert.deepEqual([r.score, r.total, r.blank], [3, 6, 2]);
});
