// The "→ quizfree" bookmark. app.js turns this function's source into a javascript: link, passing
// the address quizfree is served from (or null when it's opened as a local file). It runs on a
// quizlet.com set page, never inside quizfree: it reads the cards the page already shows, then
// opens quizfree with them in the #hash (which never leaves the browser), or downloads a .json.
function quizletToQuizfree(app) {
  const txt = el => el.innerText.trim().replace(/\s*\n\s*/g, ' / ');
  const seen = new Set(), keys = new Set(), cards = [];
  for (const el of document.querySelectorAll('.TermText')) {
    if (seen.has(el)) continue;
    // a card row is the nearest ancestor holding its term + definition; rows missing a side are skipped
    let row = el.parentElement;
    while (row && row.querySelectorAll('.TermText').length < 2) row = row.parentElement;
    const pair = row ? [...row.querySelectorAll('.TermText')] : [];
    if (pair.length !== 2 || pair[0] !== el) continue;
    seen.add(pair[1]);
    const card = { term: txt(pair[0]), def: txt(pair[1]) }, key = card.term + '\u0000' + card.def;
    if (card.term && card.def && !keys.has(key)) { keys.add(key); cards.push(card); }
  }
  if (!cards.length) return alert('quizfree: no flashcards found. Open a Quizlet set page and click the bookmark again.');

  const name = ((document.querySelector('h1') || {}).innerText || document.title).trim().slice(0, 120);
  const total = +(document.body.innerText.match(/Terms in this set \((\d+)\)/) || [])[1];
  const partial = total > cards.length ? `\n\nOnly ${cards.length} of ${total} cards were on the page. Scroll down (or click "See more") and click the bookmark again to get them all.` : '';
  const json = JSON.stringify({ quizfree: 1, sets: [{ name, cards }] });

  if (app && window.open(app + '#import=' + encodeURIComponent(json), '_blank')) {
    if (partial) alert('quizfree:' + partial);
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'quizlet-set') + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  alert(`quizfree: downloaded ${a.download} (${cards.length} cards). In quizfree, press [i] and pick that file.${partial}`);
}
