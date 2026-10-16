// quizfree app: terminal-style UI. All sets live in this browser's localStorage.
const KEY = 'quizfree.sets';
const $ = sel => document.querySelector(sel);
const screen = $('#screen'), out = $('#out'), cmdInput = $('#cmd-input');

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'set';
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const SIDE = { term: 'term', def: 'definition' };

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

const cur = () => sets.find(s => s.id === setId);
const say = (msg, cls = '') => { out.className = cls; out.textContent = msg; };
const btn = (key, label, act) => `<button type="button" data-act="${act}"><span class="k">[${key}]</span> ${label}</button>`;
const bar = (n, total, w = 20) => { const f = total ? Math.round((n / total) * w) : 0; return `[${'#'.repeat(f)}${'.'.repeat(w - f)}]`; };

const views = {
  home: () => `
    <p class="dim">quizfree — free flashcards for you and your friends. click anything, or type <span class="k">help</span> below.</p>
    <p><span class="ps">$</span> ls ~/sets</p>
    ${sets.length
      ? `<ol class="list">${sets.map((s, i) => `<li><button type="button" class="row" data-act="open" data-id="${esc(s.id)}">
          <span class="k">[${i + 1}]</span><span>${esc(s.name)}</span><span class="leader"></span><span class="dim">${plural(s.cards.length, 'card')}</span>
        </button></li>`).join('')}</ol>`
      : '<p class="dim">(empty) — make your first set with [n]</p>'}
    <p>${btn('n', 'new set', 'new')} ${btn('i', 'import', 'import')} ${sets.length ? btn('e', 'export all', 'exportAll') : ''}</p>
    <p class="blink"><span class="ps">$</span></p>`,

  set: s => `
    <p><span class="ps">$</span> cat ${esc(slug(s.name))}.set</p>
    <h1>${esc(s.name)}</h1>
    <p class="dim">${plural(s.cards.length, 'card')}</p>
    <p>${btn('f', 'flashcards', 'cards')} ${btn('l', 'learn', 'learn')} ${btn('e', 'edit', 'edit')} ${btn('x', 'export', 'export')} ${btn('d', 'delete', 'rm')} ${btn('esc', 'back', 'back')}</p>
    <table class="terms">${s.cards.map(c => `<tr><td>${esc(c.term)}</td><td>→</td><td>${esc(c.def)}</td></tr>`).join('')}</table>`,

  edit: s => `
    <p><span class="ps">$</span> nano ${s ? esc(slug(s.name)) : 'new'}.set</p>
    <form data-act="save" class="edit">
      <label for="title">name</label>
      <input id="title" name="title" maxlength="120" value="${s ? esc(s.name) : ''}" ${s ? '' : 'autofocus'}>
      <label for="body">cards — one per line: <span class="k">term - definition</span> <span class="dim">(tab-separated paste from quizlet or a spreadsheet works too)</span></label>
      <textarea id="body" name="body" rows="14" spellcheck="false" placeholder="hola - hello&#10;perro - dog">${s ? esc(s.cards.map(c => c.term + '\t' + c.def).join('\n')) : ''}</textarea>
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
};

function render() {
  const set = cur();
  if (!set && view !== 'home' && view !== 'edit') view = 'home';
  const path = '~/sets' + (set ? '/' + slug(set.name) : view === 'edit' ? '/new' : '') + ({ cards: '/cards', learn: '/learn', edit: '/edit' }[view] || '');
  $('#title').textContent = 'quizfree — ' + path;
  $('#prompt').textContent = `guest@quizfree:${path}$`;
  screen.innerHTML = views[view](set);
  screen.querySelector('[autofocus]')?.focus();
}

const go = v => { view = v; render(); };
const home = () => { setId = null; go('home'); };
const back = () => (view === 'set' || view === 'home' || (view === 'edit' && !setId) ? home() : go('set'));

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
  flash = { order: s.cards.map((_, i) => i), i: 0, flipped: false };
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
const answerSide = () => (learn.ask === 'term' ? 'def' : 'term');

function startLearn() {
  const s = cur();
  if (!s) return;
  if (s.cards.length < 2) return say('learn needs at least 2 cards in the set', 'err');
  learn = { session: Core.createSession(s.cards), ask: learn ? learn.ask : 'term', options: null, feedback: null, wrong: 0 };
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

// --- edit / delete / import / export ---
function saveEdit(form) {
  const err = form.querySelector('.err');
  const name = form.elements.title.value.trim();
  const { cards, bad } = Core.parseCards(form.elements.body.value);
  if (!name) return (err.textContent = 'give the set a name');
  if (bad.length) return (err.textContent = `line ${bad.join(', ')}: needs "term - definition" (or a tab between them)`);
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
  sets.push(...list);
  save();
  say(`imported ${plural(list.length, 'set')}`);
  home();
});

// --- input: clicks, keys, command line ---
const actions = {
  open: el => { setId = el.dataset.id; go('set'); },
  new: () => { setId = null; go('edit'); },
  edit: () => go('edit'),
  back,
  cards: startCards,
  learn: startLearn,
  restart: startLearn,
  flip: () => { flash.flipped = !flash.flipped; render(); },
  next: () => (view === 'learn' ? learnNext() : step(1)),
  prev: () => step(-1),
  shuffle: () => { flash.order = Core.shuffle(flash.order); flash.i = 0; flash.flipped = false; render(); },
  pick: el => learnPick(+el.dataset.i),
  override: () => { if (learn.feedback && !learn.feedback.ok) { learn.feedback.ok = true; learn.wrong--; learnNext(); } },
  swap: () => { learn.ask = answerSide(); startLearn(); },
  rm: removeSet,
  export: () => exportSets([cur()]),
  exportAll: () => exportSets(sets),
  import: () => $('#import-file').click(),
};

screen.addEventListener('click', e => {
  const el = e.target.closest('button[data-act]');
  if (el && !el.disabled) actions[el.dataset.act](el);
});
screen.addEventListener('submit', e => {
  e.preventDefault();
  ({ type: learnType, save: saveEdit })[e.target.dataset.act]?.(e.target);
});

const keys = {
  home: { n: actions.new, i: actions.import, e: () => sets.length && actions.exportAll() },
  set: { f: startCards, l: startLearn, e: actions.edit, x: actions.export, d: removeSet },
  edit: {},
  cards: { ' ': actions.flip, Enter: actions.flip, ArrowRight: () => step(1), ArrowLeft: () => step(-1), s: actions.shuffle, l: startLearn },
  learn: { Enter: learnNext, o: actions.override, t: actions.swap, f: () => !Core.current(learn.session) && startCards(), r: () => !Core.current(learn.session) && startLearn() },
};

document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) {
    if (view === 'edit' && e.key.toLowerCase() === 's') { e.preventDefault(); screen.querySelector('form').requestSubmit(); }
    return;
  }
  const t = e.target;
  if (t.matches('input, textarea')) {
    if (e.key === 'Escape') { t.blur(); if (t.id === 'answer') back(); } // esc in the editor only blurs, so edits aren't lost
    return;
  }
  if (t.matches('button') && (e.key === 'Enter' || e.key === ' ')) return; // let the focused button handle it
  if (e.key === 'Escape') return back();
  if (e.key === ':' || e.key === '/') { e.preventDefault(); return cmdInput.focus(); }
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
  edit | rm        edit / delete the open set
  cards | learn    study the open set
  import | export  import a .json file / export the open set (or all sets)
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
    import: actions.import,
    export: () => (cur() ? actions.export() : actions.exportAll()),
    edit: needSet(actions.edit),
    rm: needSet(removeSet),
    cards: needSet(startCards),
    learn: needSet(startLearn),
  }[name.toLowerCase()];
  run ? run() : say(`command not found: ${name} — try 'help'`, 'err');
  if (view !== 'edit' && !screen.querySelector('[autofocus]')) cmdInput.focus();
});

render();
