boot('calendar', async () => {
  let d = new Date(); d.setDate(1); let ev = [];
  const draw = async () => {
    const y = d.getFullYear(), m = d.getMonth(), p = n => String(n).padStart(2, '0'), key = `${y}-${p(m + 1)}`;
    ev = await sb('events', `select=*&event_date=gte.${key}-01&event_date=lte.${key}-31&order=event_date.asc,event_time.asc`);
    $('#mon').textContent = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    let h = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ').map(x => `<div class="h">${x}</div>`).join('') + '<div></div>'.repeat(new Date(y, m, 1).getDay());
    for (let i = 1; i <= new Date(y, m + 1, 0).getDate(); i++) { const ds = `${key}-${p(i)}`; h += `<div class="${ds === today() ? 't' : ''}">${i}${ev.filter(e => e.event_date === ds).map(e => `<span class="e ${esc(e.type)}" title="${esc(e.title)}">${esc(e.title)}</span>`).join('')}</div>`; }
    $('#grid').innerHTML = `<div class="cal">${h}</div>`;
    $('#list').innerHTML = tbl([['Date', x => fmt(x.event_date)], ['Time', x => esc(x.event_time?.slice(0, 5) || '–')], ['Event', x => `<b>${esc(x.title)}</b>`], ['Type', x => badge(x.type)], ['Place', x => esc(x.location)]], ev, 'No events this month.');
  };
  $('#prev').onclick = () => { d.setMonth(d.getMonth() - 1); run(draw); };
  $('#next').onclick = () => { d.setMonth(d.getMonth() + 1); run(draw); };
  $('#f').onsubmit = e => { e.preventDefault(); run(async () => { const f = Object.fromEntries(new FormData(e.target)); if (!f.event_time) delete f.event_time; await sb('events', '', 'POST', f); e.target.reset(); await draw(); }, 'Event added'); };
  await draw();
});
