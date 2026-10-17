// quizfree app: terminal-style UI. All sets live in this browser's localStorage.
const KEY = 'quizfree.sets';
const $ = sel => document.querySelector(sel);
const screen = $('#screen'), out = $('#out'), cmdInput = $('#cmd-input');

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'set';
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const SIDE = { term: 'term', def: 'definition' };
const other = side => (side === 'term' ? 'def' : 'term');
const TEST_NAMES = { match: 'matching', choice: 'multiple choice', written: 'written' };
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
// web pages can't open file:// links, so a local copy gets a bookmark that downloads instead
const APP_URL = /^https?:$/.test(location.protocol) ? location.origin + location.pathname : null;
const BOOKMARKLET = 'javascript:' + encodeURIComponent(`(${quizletToQuizfree})(${JSON.stringify(APP_URL)})`);

const SAMPLE = {
  name: 'spanish basics',
  cards: [['hola', 'hello'], ['adiós', 'goodbye'], ['gracias', 'thank you'], ['por favor', 'please'], ['perro', 'dog'], ['gato', 'cat']]
    .map(([term, def]) => ({ term, def })),
};

// Trust boundary: everything from storage or an imported file goes through here.
function cleanSet(raw, id) {
  if (!raw || typeof raw.name !== 'string' || !Array.isArray(raw.cards)) return null;
  const text = v => (typeof v === 'string' ? v.trim().slice(0, 2000) : '');
  const cards = raw.cards.map(c => ({ term: text(c && c.term), def: text(c && c.def) })).filter(c => c.term && c.def);
  return { id: typeof id === 'string' && id ? id : uid(), name: text(raw.name).slice(0, 120) || 'untitled', cards };
}

function load() {
  let raw;
  try { raw = localStorage.getItem(KEY); } catch { return [cleanSet(SAMPLE)]; }
  if (raw === null) return [cleanSet(SAMPLE)];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.map(s => cleanSet(s, s && s.id)).filter(Boolean) : [];
  } catch {
    try { localStorage.setItem(KEY + '.corrupt', raw); } catch {} // keep a copy instead of overwriting it
    return [];
  }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(sets)); }
  catch { say('could not save: browser storage is full or blocked. export your sets to keep them.', 'err'); }
}

let sets = load();
let view = 'home', setId = null;
let flash = null; // { order, i, flipped }
let learn = null; // { session, ask, options, feedback, wrong }
let test = null; // { types, count, ask, questions, answers, result }; questions null = setup screen
let quizletLink = '';
let selected = new Set(); // set ids picked on the set list (shift+number / shift+click) for exporting together

const cur = () => sets.find(s => s.id === setId);
const picked = () => sets.filter(s => selected.has(s.id));
const say = (msg, cls = '') => { out.className = cls; out.textContent = msg; };
const btn = (key, label, act) => `<button type="button" data-act="${act}"><span class="k">[${key}]</span> ${label}</button>`;
const bar = (n, total, w = 20) => { const f = total ? Math.round((n / total) * w) : 0; return `[${'#'.repeat(f)}${'.'.repeat(w - f)}]`; };

const cardRow = (c = {}) => `
  <div class="pair">
    <p class="pair-head"><span class="num"></span><button type="button" data-act="rmRow" aria-label="delete card">[x]</button></p>
    <div class="sides">
      <textarea name="term" rows="1" spellcheck="false" placeholder="term" aria-label="term">${esc(c.term || '')}</textarea>
      <div class="split" role="separator" tabindex="0" aria-orientation="vertical" aria-label="resize term and definition" aria-valuemin="15" aria-valuemax="85" aria-valuenow="40"></div>
      <textarea name="def" rows="1" spellcheck="false" placeholder="definition" aria-label="definition">${esc(c.def || '')}</textarea>
    </div>
  </div>`;

const views = {
  home: () => `
    <p class="dim">quizfree — free flashcards for you and your friends. click anything, or type <span class="k">help</span> below.</p>
    <p><span class="ps">$</span> ls ~/sets</p>
    ${sets.length
      ? `<ol class="list">${sets.map((s, i) => `<li><button type="button" class="row${selected.has(s.id) ? ' sel' : ''}" data-act="open" data-id="${esc(s.id)}">
          <span class="k">[${i + 1}]</span><span class="mark" aria-hidden="true">${selected.has(s.id) ? '*' : ' '}</span><span>${esc(s.name)}${selected.has(s.id) ? '<span class="sr-only"> (selected)</span>' : ''}</span><span class="leader"></span><span class="dim">${plural(s.cards.length, 'card')}</span>
        </button></li>`).join('')}</ol>`
      : '<p class="dim">(empty) — make your first set with [n]</p>'}
    <p>${btn('n', 'new set', 'new')} ${btn('q', 'from quizlet', 'quizlet')} ${btn('i', 'import', 'import')}
      ${!sets.length ? '' : picked().length ? `${btn('e', `export ${picked().length} selected`, 'exportSel')} ${btn('esc', 'clear selection', 'back')}` : btn('e', 'export all', 'exportAll')}</p>
    ${sets.length > 1 ? '<p class="dim">shift + a number (or shift + click) selects sets to export together.</p>' : ''}
    <p class="blink"><span class="ps">$</span></p>`,

  set: s => `
    <p><span class="ps">$</span> cat ${esc(slug(s.name))}.set</p>
    <h1>${esc(s.name)}</h1>
    <p class="dim">${plural(s.cards.length, 'card')}</p>
    <p>${btn('f', 'flashcards', 'cards')} ${btn('l', 'learn', 'learn')} ${btn('t', 'test', 'test')} ${btn('e', 'edit', 'edit')} ${btn('x', 'export', 'export')} ${btn('d', 'delete', 'rm')} ${btn('esc', 'back', 'back')}</p>
    <table class="terms">${s.cards.map(c => `<tr><td>${esc(c.term)}</td><td>→</td><td>${esc(c.def)}</td></tr>`).join('')}</table>`,

  edit: s => `
    <p><span class="ps">$</span> nano ${s ? esc(slug(s.name)) : 'new'}.set</p>
    <form data-act="save" class="edit">
      <label for="title">name</label>
      <input id="title" name="title" maxlength="120" value="${s ? esc(s.name) : ''}" ${s ? '' : 'autofocus'}>
      <p class="dim">cards — drag the bar between term and definition to resize. pasting tab-separated lines from quizlet or a spreadsheet adds them as cards.</p>
      <div id="rows">${(s ? s.cards : [{}, {}]).map(cardRow).join('')}</div>
      <p>${btn('+', 'add card', 'addRow')}</p>
      <p class="err" role="alert"></p>
      <p><button type="submit"><span class="k">[ctrl+s]</span> save</button> ${btn('esc', 'cancel', 'back')}</p>
    </form>`,

  cards: s => {
    const c = s.cards[flash.order[flash.i]];
    if (!c) return `<p class="dim">this set has no cards.</p><p>${btn('esc', 'back', 'back')}</p>`;
    return `
      <p class="dim">card ${flash.i + 1}/${flash.order.length} ${bar(flash.i + 1, flash.order.length)}</p>
      <button type="button" class="card" data-act="flip" aria-label="flip card"><span class="label">${flash.flipped ? 'definition' : 'term'}</span>${esc(flash.flipped ? c.def : c.term)}</button>
      <p>${btn('space', 'flip', 'flip')} ${btn('←', 'prev', 'prev')} ${btn('→', 'next', 'next')} ${btn('s', 'shuffle', 'shuffle')} ${btn('l', 'learn', 'learn')} ${btn('esc', 'back', 'back')}</p>`;
  },

  learn: s => {
    const L = learn, S = L.session, fb = L.feedback, item = Core.current(S);
    const head = `<p class="dim">learn · mastered ${S.done}/${S.total} ${bar(S.done, S.total)} · answer with ${SIDE[answerSide()]}</p>`;
    if (!item) return head + `
      <p class="ok">✓ session complete — ${plural(S.total, 'card')} mastered, ${plural(L.wrong, 'mistake')}.</p>
      <p>${btn('r', 'learn again', 'restart')} ${btn('f', 'flashcards', 'cards')} ${btn('esc', 'back', 'back')}</p>`;

    const correct = item.card[answerSide()];
    let body;
    if (item.stage === 0) {
      L.options ||= Core.choices(s.cards, item.card, answerSide());
      body = `<p class="dim">choose the answer:</p><div class="options">${L.options.map((o, i) => {
        const cls = !fb ? '' : o === correct ? 'right' : i === fb.pick ? 'wrong' : '';
        return `<button type="button" data-act="pick" data-i="${i}" class="${cls}" ${fb ? 'disabled' : ''}><span class="k">[${i + 1}]</span> ${esc(o)}</button>`;
      }).join('')}</div>`;
    } else {
      body = `<form data-act="type">
        <label class="dim" for="answer">now type the answer:</label>
        <div class="typeline"><span class="ps">&gt;</span><input id="answer" spellcheck="false" autocomplete="off" autocapitalize="off" ${fb ? `readonly value="${esc(fb.given)}"` : 'autofocus'}></div>
      </form>`;
    }

    const feedback = !fb ? '' : fb.ok
      ? '<p class="ok" role="status">✓ correct</p>'
      : `<p class="err" role="status">✗ not quite. answer: <span class="hi">${esc(correct)}</span></p>
         <p>${btn('enter', 'continue', 'next')} ${item.stage === 1 ? btn('o', 'override: i was right', 'override') : ''}</p>`;

    return head + `
      <div class="card small"><span class="label">${SIDE[L.ask]} · ${item.stage ? 'write' : 'choose'}</span>${esc(item.card[L.ask])}</div>
      ${body}${feedback}
      <p class="dim">${btn('t', 'swap sides', 'swap')} ${btn('esc', 'back', 'back')}</p>`;
  },

  quizlet: () => `
    <p><span class="ps">$</span> quizfree import --from quizlet</p>
    <p class="dim">quizlet won't let other sites read its pages, so a bookmark does the copying from inside your own browser.</p>
    <p><span class="k">once:</span> drag this to your bookmarks bar → <a class="bookmarklet" href="${esc(BOOKMARKLET)}">→ quizfree</a>
      <span class="dim">(no bar? ctrl+shift+b, or ⌘+shift+b on a mac)</span></p>
    <form data-act="quizlet" class="edit">
      <label for="qlink"><span class="k">1.</span> paste a quizlet set link</label>
      <div class="typeline"><span class="ps">&gt;</span><input id="qlink" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="https://quizlet.com/..." value="${esc(quizletLink)}" autofocus></div>
      <p class="err" role="alert"></p>
      <p><button type="submit"><span class="k">[enter]</span> open it in a new tab</button> ${btn('esc', 'back', 'back')}</p>
    </form>
    <p><span class="k">2.</span> on the quizlet page, click the <span class="hi">→ quizfree</span> bookmark.</p>
    ${APP_URL
      ? '<p><span class="k">3.</span> quizfree opens in a new tab with the set already added.</p>'
      : `<p><span class="k">3.</span> the bookmark downloads the set as a .json. come back here and press <span class="k">[i]</span> to import it.</p>
         <p class="dim">this copy of quizfree is opened as a local file, which web pages aren't allowed to open, so the set can't be added for you automatically. the online version can do that.</p>`}`,

  test: s => {
    const T = test;
    if (!T.questions) return `
      <p><span class="ps">$</span> quizfree test ${esc(slug(s.name))}</p>
      <form data-act="testStart" class="setup">
        <fieldset><legend>question types</legend>
          ${Object.entries(TEST_NAMES).map(([t, label]) => `<label><input type="checkbox" name="types" value="${t}" ${T.types.includes(t) ? 'checked' : ''}> ${label}</label>`).join('')}
        </fieldset>
        <fieldset><legend>direction</legend>
          ${['term', 'def'].map(a => `<label><input type="radio" name="ask" value="${a}" ${T.ask === a ? 'checked' : ''}> shown ${SIDE[a]}, answer with ${SIDE[other(a)]}</label>`).join('')}
        </fieldset>
        <label>questions <input type="number" name="count" min="1" max="${s.cards.length}" value="${Math.min(T.count, s.cards.length)}" autofocus> <span class="dim">of ${s.cards.length}</span></label>
        <p class="err" role="alert"></p>
        <p><button type="submit"><span class="k">[enter]</span> start test</button> ${btn('esc', 'back', 'back')}</p>
      </form>`;

    const R = T.result, A = T.answers || [], dis = R ? 'disabled' : '';
    const mark = ok => (!R ? '' : ok ? ' <span class="ok">✓</span>' : ' <span class="err">✗</span>');
    const fix = (ok, answer) => (R && !ok ? `<span class="fix">→ ${esc(answer)}</span>` : '');
    let num = 0, last = '';
    const body = T.questions.map((q, i) => {
      const head = q.type === last ? '' : `<h2>── ${TEST_NAMES[(last = q.type)]} ──</h2>`;
      const ok = R ? R.results[i] : [];
      if (q.type === 'match') return head + `<div class="q">
        <ul class="match-opts">${q.options.map((o, k) => `<li><span class="k">${LETTERS[k]})</span> ${esc(o)}</li>`).join('')}</ul>
        ${q.items.map((it, j) => {
          const picked = A[i] ? q.options.indexOf(A[i][j]) : -1;
          return `<div class="match-row">
            <select name="q${i}-${j}" aria-label="letter for ${esc(it.prompt)}" ${dis}><option value="">-</option>${q.options.map((_, k) => `<option value="${k}" ${picked === k ? 'selected' : ''}>${LETTERS[k]}</option>`).join('')}</select>
            <span><span class="qn">${++num}.</span> ${esc(it.prompt)}${mark(ok[j])}${fix(ok[j], it.answer)}</span>
          </div>`;
        }).join('')}
      </div>`;
      if (q.type === 'choice') return head + `<fieldset class="q"><legend><span class="qn">${++num}.</span> ${esc(q.prompt)}${mark(ok[0])}</legend>
        ${q.options.map((o, k) => `<label class="opt"><input type="radio" name="q${i}" value="${k}" ${A[i] === o ? 'checked' : ''} ${dis}> ${esc(o)}</label>`).join('')}
        ${fix(ok[0], q.answer)}
      </fieldset>`;
      return head + `<div class="q"><label for="q${i}"><span class="qn">${++num}.</span> ${esc(q.prompt)}${mark(ok[0])}</label>
        <div class="typeline"><span class="ps">&gt;</span><input id="q${i}" name="q${i}" spellcheck="false" autocomplete="off" autocapitalize="off" value="${esc(A[i] || '')}" ${dis}></div>
        ${fix(ok[0], q.answer)}
      </div>`;
    }).join('');

    const score = R ? `<p class="${R.score === R.total ? 'ok' : 'hi'}">score: ${R.score}/${R.total} (${Math.round((R.score / R.total) * 100)}%) ${bar(R.score, R.total)}${R.blank ? ` · ${R.blank} unanswered` : ''}</p>` : '';
    const nav = R
      ? `${btn('r', 'retake', 'retest')} ${btn('n', 'new test', 'testSetup')}`
      : `<button type="button" data-act="grade"><span class="k">[ctrl+enter]</span> submit</button> ${btn('n', 'start over', 'testSetup')}`;
    return `<p class="dim">test · ${plural(num, 'question')} · shown ${SIDE[T.ask]}, answer with ${SIDE[other(T.ask)]}</p>
      ${score}<form data-act="test">${body}</form>
      <p>${nav} ${btn('esc', 'back', 'back')}</p>`;
  },
};

function render() {
  const set = cur();
  if (!set && !['home', 'edit', 'quizlet'].includes(view)) view = 'home';
  const path = '~/sets' + (set ? '/' + slug(set.name) : view === 'edit' ? '/new' : '') + ({ cards: '/cards', learn: '/learn', test: '/test', edit: '/edit', quizlet: '/quizlet' }[view] || '');
  $('#title').textContent = 'quizfree — ' + path;
  $('#prompt').textContent = `guest@quizfree:${path}$`;
  screen.innerHTML = views[view](set);
  screen.querySelectorAll('.pair textarea').forEach(grow);
  screen.querySelector('[autofocus]')?.focus();
  saveProgress();
}

const go = v => { view = v; render(); };
const home = () => { setId = null; go('home'); };
function back() {
  if (view === 'home' && selected.size) { selected.clear(); return render(); }
  view === 'set' || view === 'home' || view === 'quizlet' || (view === 'edit' && !setId) ? home() : go('set');
}

function toggleSelected(s) {
  if (!s) return;
  selected.has(s.id) ? selected.delete(s.id) : selected.add(s.id);
  render();
}

// --- saved progress: the screen you were on, plus each set's flashcard / learn / test state ---
// Progress is tied to a fingerprint of the set's cards, so editing a set starts it fresh.
const PROGRESS_KEY = 'quizfree.progress';
const fingerprint = cards => { let h = 0; for (const ch of JSON.stringify(cards)) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h; };

// always read fresh: another open quizfree tab may have saved progress for a different set
function loadProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    if (p && typeof p === 'object' && p.sets && typeof p.sets === 'object') return p;
  } catch {}
  return { view: 'home', setId: null, sets: {} };
}
function writeProgress(p) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch {} // progress is a nicety; sets are saved separately
}

const snapshot = {
  cards: () => ({ order: flash.order, i: flash.i, flipped: flash.flipped }),
  learn: s => ({ queue: learn.session.queue.map(q => [s.cards.indexOf(q.card), q.stage]), done: learn.session.done, ask: learn.ask, wrong: learn.wrong }),
  test: () => ({ types: test.types, count: test.count, ask: test.ask, questions: test.questions, answers: test.answers, result: test.result }),
};

function saveProgress() {
  const p = loadProgress(), s = cur();
  if (s && snapshot[view]) {
    const fp = fingerprint(s.cards);
    const entry = p.sets[s.id] && p.sets[s.id].fp === fp ? p.sets[s.id] : { fp };
    entry[view] = snapshot[view](s);
    p.sets[s.id] = entry;
  }
  p.view = view;
  p.setId = setId;
  writeProgress(p);
}

function savedProgress(s, mode) {
  const entry = loadProgress().sets[s.id];
  return entry && entry.fp === fingerprint(s.cards) && entry[mode] && typeof entry[mode] === 'object' ? entry[mode] : null;
}

const isStr = v => typeof v === 'string';
const validQuestion = q => !!q && (
  q.type === 'match' ? Array.isArray(q.items) && q.items.length > 0 && q.items.every(it => it && isStr(it.prompt) && isStr(it.answer)) && Array.isArray(q.options) && q.options.every(isStr)
    : q.type === 'choice' ? isStr(q.prompt) && isStr(q.answer) && Array.isArray(q.options) && q.options.every(isStr)
      : q.type === 'written' && isStr(q.prompt) && isStr(q.answer));

// on page load: go back to the set and study mode you were in
function resume() {
  const p = loadProgress(), s = sets.find(x => x.id === p.setId);
  if (!s) return render();
  setId = s.id;
  const start = { cards: startCards, learn: startLearn, test: startTest }[p.view];
  if (start) start();
  if (view === 'home') go('set'); // not a study mode, or it couldn't start (e.g. too few cards)
  else say('picked up where you left off');
}

function openSet(arg) {
  const a = String(arg).trim().toLowerCase();
  const s = /^\d+$/.test(a) ? sets[a - 1] : sets.find(x => x.name.toLowerCase() === a || slug(x.name) === slug(a));
  if (!s) return say(`no such set: ${arg}`, 'err');
  setId = s.id;
  go('set');
}

// --- flashcards ---
function startCards() {
  const s = cur();
  if (!s) return;
  const p = savedProgress(s, 'cards'), n = s.cards.length;
  const ok = p && Array.isArray(p.order) && p.order.length === n && new Set(p.order).size === n && p.order.every(i => Number.isInteger(i) && i >= 0 && i < n);
  flash = ok
    ? { order: p.order, i: Math.min(Math.max(0, p.i | 0), n - 1), flipped: !!p.flipped }
    : { order: s.cards.map((_, i) => i), i: 0, flipped: false };
  go('cards');
}
function step(d) {
  const n = flash.order.length;
  if (!n) return;
  flash.i = (flash.i + d + n) % n;
  flash.flipped = false;
  render();
}

// --- learn ---
const answerSide = () => other(learn.ask);

// fresh === true skips resuming (learn again / swap sides); clicks pass an element, so check strictly
function startLearn(fresh) {
  const s = cur();
  if (!s) return;
  if (s.cards.length < 2) return say('learn needs at least 2 cards in the set', 'err');
  const p = fresh === true ? null : savedProgress(s, 'learn'), n = s.cards.length;
  // a finished session (empty queue) starts over instead of resuming
  const ok = p && Array.isArray(p.queue) && p.queue.length > 0 && p.queue.length + p.done === n
    && new Set(p.queue.map(q => q && q[0])).size === p.queue.length
    && p.queue.every(q => Array.isArray(q) && Number.isInteger(q[0]) && q[0] >= 0 && q[0] < n && (q[1] === 0 || q[1] === 1));
  learn = ok
    ? { session: { queue: p.queue.map(([i, stage]) => ({ card: s.cards[i], stage })), done: p.done, total: n }, ask: p.ask === 'def' ? 'def' : 'term', options: null, feedback: null, wrong: Math.max(0, p.wrong | 0) }
    : { session: Core.createSession(s.cards), ask: learn ? learn.ask : 'term', options: null, feedback: null, wrong: 0 };
  go('learn');
}

function grade(ok, extra) {
  const L = learn;
  if (!ok) L.wrong++;
  const fb = (L.feedback = { ok, ...extra });
  render();
  if (ok) setTimeout(() => { if (learn === L && L.feedback === fb) learnNext(); }, 700);
}

function learnNext() {
  if (!learn || !learn.feedback) return;
  Core.answer(learn.session, learn.feedback.ok);
  learn.feedback = learn.options = null;
  render();
}

function learnPick(i) {
  const item = learn && Core.current(learn.session);
  if (!item || learn.feedback || item.stage !== 0 || learn.options?.[i] === undefined) return;
  grade(learn.options[i] === item.card[answerSide()], { pick: i });
}

function learnType(form) {
  if (learn.feedback) return learnNext();
  const given = form.querySelector('input').value;
  if (!given.trim()) return;
  grade(Core.isCorrect(given, Core.current(learn.session).card[answerSide()]), { given });
}

// --- test ---
function startTest() {
  const s = cur();
  if (!s) return;
  if (s.cards.length < 2) return say('test needs at least 2 cards in the set', 'err');
  const p = savedProgress(s, 'test'), last = p || test || {};
  const types = Array.isArray(last.types) ? last.types.filter(t => t in TEST_NAMES) : [];
  test = {
    types: types.length ? types : Object.keys(TEST_NAMES),
    count: Number.isInteger(last.count) && last.count > 0 ? last.count : 20,
    ask: last.ask === 'def' ? 'def' : 'term',
    questions: null,
  };
  // resume an unfinished test with its answers; a finished one goes back to the setup screen
  if (p && !p.result && Array.isArray(p.questions) && p.questions.length && p.questions.every(validQuestion))
    Object.assign(test, { questions: p.questions, answers: Array.isArray(p.answers) ? p.answers : null, result: null });
  go('test');
}

function testStart(form) {
  const f = new FormData(form);
  const types = f.getAll('types'), count = parseInt(f.get('count'), 10);
  if (!types.length) return (form.querySelector('.err').textContent = 'pick at least one question type');
  if (!(count >= 1)) return (form.querySelector('.err').textContent = 'ask at least 1 question');
  Object.assign(test, { types, count, ask: f.get('ask') === 'def' ? 'def' : 'term' });
  runTest();
}

function runTest() {
  Object.assign(test, Core.createTest(cur().cards, test), { answers: null, result: null });
  go('test');
  scrollTo(0, 0);
}

function readAnswers(form) {
  const f = new FormData(form);
  const opt = (q, v) => (v ? q.options[v] : null);
  return test.questions.map((q, i) =>
    q.type === 'match' ? q.items.map((_, j) => opt(q, f.get(`q${i}-${j}`)))
      : q.type === 'choice' ? opt(q, f.get(`q${i}`))
        : f.get(`q${i}`) || '');
}

// keep answers as they're typed/picked, so leaving mid-test doesn't lose them
const keepAnswers = e => {
  const form = e.target.form;
  if (view !== 'test' || !form || form.dataset.act !== 'test' || test.result) return;
  test.answers = readAnswers(form);
  saveProgress();
};
screen.addEventListener('input', keepAnswers);
screen.addEventListener('change', keepAnswers);

function submitTest() {
  const form = screen.querySelector('form[data-act="test"]');
  if (!form || test.result) return;
  test.answers = readAnswers(form);
  test.result = Core.gradeTest(test, test.answers);
  render();
  scrollTo(0, 0);
}

// --- edit / delete / import / export ---
function saveEdit(form) {
  const err = form.querySelector('.err');
  const name = form.elements.title.value.trim();
  const rows = [...form.querySelectorAll('.pair')].map(p => ({ term: p.querySelector('[name=term]').value.trim(), def: p.querySelector('[name=def]').value.trim() }));
  const bad = rows.findIndex(c => !c.term !== !c.def);
  if (!name) return (err.textContent = 'give the set a name');
  if (bad >= 0) return (err.textContent = `card ${bad + 1}: needs both a term and a definition`);
  const cards = rows.filter(c => c.term);
  if (!cards.length) return (err.textContent = 'add at least one card');
  const s = cur();
  if (s) Object.assign(s, { name, cards });
  else { setId = uid(); sets.push({ id: setId, name, cards }); }
  save();
  say(`saved ${name} (${plural(cards.length, 'card')})`);
  go('set');
}

function removeSet() {
  const s = cur();
  if (!s || !confirm(`delete "${s.name}"? this can't be undone.`)) return;
  sets = sets.filter(x => x !== s);
  const p = loadProgress();
  delete p.sets[s.id];
  writeProgress(p);
  save();
  say(`deleted ${s.name}`);
  home();
}

function exportSets(list) {
  const data = { quizfree: 1, sets: list.map(({ name, cards }) => ({ name, cards })) };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = (list.length === 1 ? slug(list[0].name) : 'quizfree-sets') + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  say(`exported ${plural(list.length, 'set')} → ${a.download}`);
}

function addSets(list) {
  sets.push(...list);
  save();
  say(`imported ${list.map(s => `${s.name} (${plural(s.cards.length, 'card')})`).join(', ')}`);
}

// --- quizlet import: the bookmark on the quizlet page opens quizfree with the set in #import= ---
function openQuizlet(link) {
  quizletLink = link.trim();
  setId = null;
  go('quizlet');
  const err = screen.querySelector('.err');
  const url = Core.quizletUrl(link);
  if (!url) return (err.textContent = "that isn't a quizlet.com link");
  const win = window.open(url, '_blank');
  if (!win) return (err.textContent = 'your browser blocked the new tab. allow pop-ups for this page and try again.');
  win.opener = null;
}

function importFromHash() {
  if (!location.hash.startsWith('#import=')) return false;
  const raw = location.hash.slice(8);
  history.replaceState(null, '', location.pathname + location.search); // so a reload doesn't import twice
  let data;
  try { data = raw.length < 5e6 && JSON.parse(decodeURIComponent(raw)); } catch {}
  const list = (data && Array.isArray(data.sets) ? data.sets : []).map(s => cleanSet(s)).filter(s => s && s.cards.length);
  if (!list.length) { say('that import link had no flashcards in it', 'err'); return false; }
  const s = list[0];
  // clicking the bookmark again (e.g. after "see more") should update the set, not duplicate it
  const same = sets.find(x => x.name === s.name);
  if (same && confirm(`you already have "${same.name}". replace its ${plural(same.cards.length, 'card')} with these ${s.cards.length}? (cancel keeps both)`)) {
    same.cards = s.cards;
    save();
    say(`updated ${same.name} (${plural(s.cards.length, 'card')})`);
    setId = same.id;
  } else {
    addSets([s]);
    setId = s.id;
  }
  view = 'set';
  return true;
}
addEventListener('hashchange', () => importFromHash() && render());

// another quizfree tab changed the sets (e.g. a quizlet import opened in a new tab)
addEventListener('storage', e => {
  if (e.key !== KEY) return;
  sets = load();
  if (view === 'home' || (view !== 'edit' && !cur())) home(); // never yank someone out of the editor
});

$('#import-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (file.size > 5e6) return say('file too big (max 5 MB)', 'err');
  let data;
  try { data = JSON.parse(await file.text()); } catch { return say('that is not a valid quizfree .json file', 'err'); }
  const raw = Array.isArray(data) ? data : data && Array.isArray(data.sets) ? data.sets : [data];
  const list = raw.map(s => cleanSet(s)).filter(s => s && s.cards.length);
  if (!list.length) return say('no sets found in that file', 'err');
  addSets(list);
  home();
});

// --- input: clicks, keys, command line ---
const actions = {
  open: (el, e) => {
    if (e && e.shiftKey) return toggleSelected(sets.find(s => s.id === el.dataset.id));
    setId = el.dataset.id;
    go('set');
  },
  new: () => { setId = null; go('edit'); },
  quizlet: () => { setId = null; go('quizlet'); },
  edit: () => go('edit'),
  addRow: () => addRows([{}], $('#rows').lastElementChild, true),
  rmRow: el => { el.closest('.pair').remove(); if (!$('#rows').children.length) actions.addRow(); },
  back,
  cards: startCards,
  learn: startLearn,
  restart: () => startLearn(true),
  test: startTest,
  grade: submitTest,
  retest: runTest,
  testSetup: () => {
    const answered = !test.result && (test.answers || []).flat().some(a => a && String(a).trim());
    if (answered && !confirm('start over? your answers on this test will be cleared.')) return;
    test.questions = null;
    render();
  },
  flip: () => { flash.flipped = !flash.flipped; render(); },
  next: () => (view === 'learn' ? learnNext() : step(1)),
  prev: () => step(-1),
  shuffle: () => { flash.order = Core.shuffle(flash.order); flash.i = 0; flash.flipped = false; render(); },
  pick: el => learnPick(+el.dataset.i),
  override: () => { if (learn.feedback && !learn.feedback.ok) { learn.feedback.ok = true; learn.wrong--; learnNext(); } },
  swap: () => { learn.ask = answerSide(); startLearn(true); },
  rm: removeSet,
  export: () => exportSets([cur()]),
  exportAll: () => exportSets(sets),
  exportSel: () => { exportSets(picked()); selected.clear(); render(); },
  import: () => $('#import-file').click(),
};

screen.addEventListener('click', e => {
  if (e.target.closest('a.bookmarklet')) {
    e.preventDefault();
    return say('drag that link to your bookmarks bar, then click it while you are on a quizlet set page', 'err');
  }
  const el = e.target.closest('button[data-act]');
  if (el && !el.disabled) actions[el.dataset.act](el, e);
});
screen.addEventListener('submit', e => {
  e.preventDefault();
  // the test form is graded only by its submit button / ctrl+enter, never by enter in a field
  ({ type: learnType, save: saveEdit, testStart, quizlet: f => openQuizlet(f.querySelector('input').value) })[e.target.dataset.act]?.(e.target);
});

// --- editor cards: auto-growing fields, a draggable term/definition divider, multi-line paste ---
function grow(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }

function addRows(cards, after, focus) {
  const box = document.createElement('div');
  box.innerHTML = cards.map(cardRow).join('');
  const added = [...box.children];
  after ? after.after(...added) : $('#rows').append(...added);
  added.forEach(p => p.querySelectorAll('textarea').forEach(grow));
  if (focus) added[0].querySelector('textarea').focus();
}

function setSplit(sides, pct) {
  pct = Math.round(Math.min(85, Math.max(15, pct)));
  sides.style.setProperty('--split', pct + '%');
  sides.querySelector('.split').setAttribute('aria-valuenow', pct);
  sides.querySelectorAll('textarea').forEach(grow);
}

screen.addEventListener('input', e => e.target.matches('.pair textarea') && grow(e.target));
screen.addEventListener('pointerdown', e => {
  const bar = e.target.closest('.split');
  if (!bar) return;
  e.preventDefault();
  bar.setPointerCapture(e.pointerId);
  const sides = bar.parentElement;
  const move = ev => { const r = sides.getBoundingClientRect(); setSplit(sides, ((ev.clientX - r.left) / r.width) * 100); };
  bar.addEventListener('pointermove', move);
  bar.addEventListener('lostpointercapture', () => bar.removeEventListener('pointermove', move), { once: true });
});
screen.addEventListener('keydown', e => {
  const step = { ArrowLeft: -5, ArrowRight: 5 }[e.key];
  if (!step || !e.target.matches('.split')) return;
  e.preventDefault();
  setSplit(e.target.parentElement, +e.target.getAttribute('aria-valuenow') + step);
});
// a paste of whole "term<TAB>def" lines (quizlet, a spreadsheet) becomes cards instead of text in one field
screen.addEventListener('paste', e => {
  const t = e.target, text = e.clipboardData.getData('text');
  if (!t.matches('.pair textarea') || !/[\n\t]/.test(text.trim())) return;
  const { cards, bad } = Core.parseCards(text);
  if (!cards.length || bad.length) return;
  e.preventDefault();
  const pair = t.closest('.pair'), [term, def] = pair.querySelectorAll('textarea');
  if (!term.value.trim() && !def.value.trim()) { term.value = cards[0].term; def.value = cards[0].def; grow(term); grow(def); cards.shift(); }
  if (cards.length) addRows(cards, pair);
});

const keys = {
  home: { n: actions.new, q: actions.quizlet, i: actions.import, e: () => sets.length && (picked().length ? actions.exportSel() : actions.exportAll()) },
  set: { f: startCards, l: startLearn, t: startTest, e: actions.edit, x: actions.export, d: removeSet },
  test: { r: () => test.result && runTest(), n: () => test.questions && actions.testSetup() },
  edit: {},
  quizlet: {},
  cards: { ' ': actions.flip, Enter: actions.flip, ArrowRight: () => step(1), ArrowLeft: () => step(-1), s: actions.shuffle, l: startLearn },
  learn: { Enter: learnNext, o: actions.override, t: actions.swap, f: () => !Core.current(learn.session) && startCards(), r: () => !Core.current(learn.session) && startLearn() },
};

document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) {
    if (view === 'edit' && e.key.toLowerCase() === 's') { e.preventDefault(); screen.querySelector('form').requestSubmit(); }
    if (view === 'test' && e.key === 'Enter') { e.preventDefault(); submitTest(); }
    return;
  }
  const t = e.target;
  if (t.matches('input, textarea, select')) {
    if (e.key === 'Escape') { t.blur(); if (t.id === 'answer') back(); } // esc in the editor only blurs, so edits aren't lost
    if (e.key === 'Enter' && t.form?.dataset.act === 'test' && t.matches('input:not([type])')) {
      // enter in a written answer jumps to the next field
      e.preventDefault();
      const fields = [...t.form.elements].filter(el => el.matches('input:not([type]), select'));
      fields[fields.indexOf(t) + 1]?.focus();
    }
    return;
  }
  if (t.matches('button') && (e.key === 'Enter' || e.key === ' ')) return; // let the focused button handle it
  if (e.key === 'Escape') return back();
  if (e.key === ':' || e.key === '/') { e.preventDefault(); return cmdInput.focus(); }
  // shift+1-9 marks sets for export; e.code because shift turns e.key into "!", "@", ...
  if (view === 'home' && e.shiftKey && /^Digit[1-9]$/.test(e.code)) { e.preventDefault(); return toggleSelected(sets[e.code.slice(5) - 1]); }
  if (/^[1-9]$/.test(e.key)) {
    if (view === 'home') openSet(e.key);
    else if (view === 'learn') learnPick(e.key - 1);
    return;
  }
  const fn = keys[view][e.key];
  if (fn) { e.preventDefault(); fn(); }
});

const HELP = `commands:
  ls               list your sets
  cd <n|name>      open a set (cd .. goes back)
  new              create a set
  quizlet [link]   copy a set from a quizlet link
  edit | rm        edit / delete the open set
  cards | learn | test   study the open set
  import | export  import a .json file / export the open set (or the selected sets, or all)
  clear            clear this output
keys: [:] jump to this prompt · [esc] back · the [keys] shown on screen work anywhere`;

$('#cmd').addEventListener('submit', e => {
  e.preventDefault();
  const [name = '', ...rest] = cmdInput.value.trim().split(/\s+/);
  const arg = rest.join(' ');
  cmdInput.value = '';
  if (!name) return;
  const needSet = fn => () => (cur() ? fn() : say('open a set first: cd <n>', 'err'));
  const run = {
    help: () => say(HELP),
    ls: home,
    clear: () => say(''),
    cd: () => (arg === '..' ? back() : arg && arg !== '~' ? openSet(arg) : home()),
    open: () => openSet(arg),
    new: actions.new,
    quizlet: () => (arg ? openQuizlet(arg) : actions.quizlet()),
    import: actions.import,
    export: () => (cur() ? actions.export() : picked().length ? actions.exportSel() : actions.exportAll()),
    edit: needSet(actions.edit),
    rm: needSet(removeSet),
    cards: needSet(startCards),
    learn: needSet(startLearn),
    test: needSet(startTest),
  }[name.toLowerCase()];
  run ? run() : say(`command not found: ${name} — try 'help'`, 'err');
  if (view !== 'edit' && !screen.querySelector('[autofocus]')) cmdInput.focus();
});

if (importFromHash()) render();
else resume();
