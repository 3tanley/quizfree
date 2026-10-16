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
