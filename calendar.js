boot('calendar', async () => {
  let d = new Date(); d.setDate(1); let ev = [], editing = null;
  const f = $('#f'), p = n => String(n).padStart(2, '0');
  const draw = async () => {
    const y = d.getFullYear(), m = d.getMonth(), key = `${y}-${p(m + 1)}`, last = new Date(y, m + 1, 0).getDate();
    ev = await sb('events', `select=*&event_date=gte.${key}-01&event_date=lte.${key}-${p(last)}&order=event_date.asc,event_time.asc`);
    $('#mon').textContent = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    let h = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ').map(x => `<div class="h">${x}</div>`).join('') + '<div></div>'.repeat(new Date(y, m, 1).getDay());
    for (let i = 1; i <= last; i++) { const ds = `${key}-${p(i)}`; h += `<div class="${ds === today() ? 't' : ''}">${i}${ev.filter(e => e.event_date === ds).map(e => `<span class="e ${esc(e.type)}" data-edit="${e.id}" title="${esc(e.title)}${isAdmin() ? ' (click to edit)' : ''}">${esc(e.title)}</span>`).join('')}</div>`; }
    $('#grid').innerHTML = `<div class="cal">${h}</div>`;
    $('#list').innerHTML = tbl([['Date', x => fmt(x.event_date)], ['Time', x => esc(x.event_time?.slice(0, 5) || '–')], ['Event', x => `<b>${esc(x.title)}</b>`], ['Type', x => badge(x.type)], ['Place', x => esc(x.location)],
      ['Actions', x => `<button class="sm sec" data-edit="${x.id}">Edit</button> <button class="sm danger" data-del="${x.id}">Delete</button>`, 'adm']], ev, 'No events this month.');
  };
  const setMode = v => {
    editing = v; f.reset();
    $('#mode').hidden = $('#cancel').hidden = !v;
    $('#mode').textContent = v ? `Editing: ${v.title}` : '';
    $('#go').textContent = v ? 'Save changes' : 'Add event';
    if (v) for (const k of ['title', 'type', 'event_date', 'location']) f[k].value = v[k] || '';
    if (v) f.event_time.value = v.event_time ? v.event_time.slice(0, 5) : '';
  };
  $('#cancel').onclick = () => setMode(null);
  $('#prev').onclick = () => { d.setMonth(d.getMonth() - 1); run(draw); };
  $('#next').onclick = () => { d.setMonth(d.getMonth() + 1); run(draw); };

  f.onsubmit = e => { e.preventDefault(); if (!isAdmin()) return toast('Only admins can change events.', true); run(async () => {
    const x = Object.fromEntries(new FormData(f)); const was = editing;
    if (was) { x.event_time = x.event_time || null; await sb('events', `id=eq.${was.id}`, 'PATCH', x); }
    else { if (!x.event_time) delete x.event_time; await sb('events', '', 'POST', x); }
    const [y, mo] = x.event_date.split('-').map(Number); d = new Date(y, mo - 1, 1);
    setMode(null); await draw();
  }, editing ? 'Event updated' : 'Event added'); };

  const onAct = e => {
    if (!isAdmin()) return;
    const b = e.target.closest('[data-edit],[data-del]'); if (!b) return;
    if (b.dataset.edit) { const v = ev.find(x => x.id == b.dataset.edit); if (v) { setMode(v); f.scrollIntoView({ behavior: 'smooth' }); } return; }
    const v = ev.find(x => x.id == b.dataset.del);
    if (v && confirm(`Delete "${v.title}" on ${fmt(v.event_date)}? This cannot be undone.`)) run(async () => { await sb('events', `id=eq.${v.id}`, 'DELETE'); if (editing?.id === v.id) setMode(null); await draw(); }, 'Event deleted');
  };
  $('#grid').onclick = $('#list').onclick = onAct;
  await draw();
});
