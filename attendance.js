boot('attendance', async () => {
  const u = me(); let vols = [], att = [];
  const P = 'Present', A = 'Absent', L = 'Leave', cls = { Present: 'ok', Absent: 'bad', Leave: 'warn' };
  const nm = c => (vols.find(x => x.code === c) || {}).name || c;
  const opts = (el, keep) => { el.innerHTML = vols.map(x => `<option value="${esc(x.code)}">${esc(x.code)} · ${esc(x.name)}</option>`).join(''); if (keep) el.value = keep; };
  const month = () => $('#vm').value, who = () => isAdmin() ? $('#vf').value : u.code;
  $('#vm').value = today().slice(0, 7); $('#ad').value = today();
  const checked = () => [...$('#pick').querySelectorAll('input:checked')].map(i => i.value);
  const count = () => { const n = checked().length; $('#cnt').textContent = n + ' selected'; $('#sa').checked = !!vols.length && n === vols.length; };
  // Checklist of fellows; shows any status already marked on the chosen date
  const pick = () => {
    const d = $('#ad').value, keep = new Set(checked());
    $('#pick').innerHTML = vols.map(x => { const ex = att.find(y => y.volunteer_code === x.code && y.att_date === d);
      return `<label class="pk"><input type="checkbox" value="${esc(x.code)}"${keep.has(x.code) ? ' checked' : ''}><span><b>${esc(x.name)}</b><small>${esc(x.code)}</small></span>${ex ? badge(ex.status, cls[ex.status]) : ''}</label>`; }).join('') || '<div class="empty">No active fellows yet.</div>';
    count();
  };

  const load = async () => {
    vols = isAdmin() ? await sb('volunteers', 'select=code,name&role=eq.fellow&status=eq.active&order=code.asc') : [{ code: u.code, name: u.name }];
    att = await sb('attendance', 'select=*&order=att_date.asc' + (isAdmin() ? '' : '&volunteer_code=eq.' + encodeURIComponent(u.code)));
    if (isAdmin()) { opts($('#vf'), $('#vf').value); pick(); }
    overview(); detail();
  };
  const overview = () => {
    const rows = vols.map(x => { const r = att.filter(y => y.volunteer_code === x.code), n = s => r.filter(y => y.status === s).length;
      return { ...x, p: n(P), a: n(A), l: n(L), t: r.length, pct: r.length ? Math.round(100 * n(P) / r.length) : 0 }; });
    $('#list').innerHTML = tbl([['Fellow', x => `<b>${esc(x.name)}</b><br>${esc(x.code)}`], ['Present', x => badge(x.p, 'ok')], ['Absent', x => badge(x.a, 'bad')], ['Leave', x => badge(x.l, 'warn')],
      ['Attendance', x => `<span class="pct">${x.pct}%</span> of ${x.t} days<div class="pbar ${x.pct < 75 ? 'low' : ''}"><i style="width:${x.pct}%"></i></div>`],
      ['', x => `<button class="sm sec" data-view="${esc(x.code)}">View dates</button>`]], rows, 'No fellows yet.');
  };
  const detail = () => {
    const c = who(), m = month();
    const r = att.filter(x => x.volunteer_code === c && (!m || x.att_date.startsWith(m))).sort((a, b) => a.att_date.localeCompare(b.att_date));
    const n = s => r.filter(x => x.status === s).length, pct = r.length ? Math.round(100 * n(P) / r.length) : 0;
    $('#sum').innerHTML = `<span class="badge">${esc(nm(c))}</span>` + badge('Present ' + n(P), 'ok') + badge('Absent ' + n(A), 'bad') + badge('Leave ' + n(L), 'warn') + badge('Attendance ' + pct + '%');
    if (m) {
      const [y, mo] = m.split('-').map(Number), map = Object.fromEntries(r.map(x => [x.att_date, x.status]));
      let h = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ').map(x => `<div class="h">${x}</div>`).join('') + '<div class="e"></div>'.repeat(new Date(y, mo - 1, 1).getDay());
      for (let i = 1; i <= new Date(y, mo, 0).getDate(); i++) { const s = map[`${m}-${String(i).padStart(2, '0')}`]; h += `<div class="${s ? s[0] : ''}">${i}${s ? `<b>${s}</b>` : ''}</div>`; }
      $('#cal').innerHTML = `<div class="ac" role="img" aria-label="Attendance calendar">${h}</div>`;
    } else $('#cal').innerHTML = '';
    $('#days').innerHTML = tbl([['Date', x => `<b>${fmt(x.att_date)}</b>`], ['Day', x => new Date(x.att_date + 'T00:00').toLocaleDateString('en-IN', { weekday: 'long' })],
      ['Status', x => isAdmin() ? `<select data-id="${x.id}">${[P, A, L].map(s => `<option${s === x.status ? ' selected' : ''}>${s}</option>`).join('')}</select>` : badge(x.status, cls[x.status])],
      ['', x => `<button class="sm danger" data-del="${x.id}">Remove</button>`, 'adm']], r, 'No attendance recorded for this selection.');
  };

  $('#sa').onchange = e => { $('#pick').querySelectorAll('input').forEach(i => i.checked = e.target.checked); count(); };
  $('#pick').onchange = count; $('#ad').onchange = pick;
  $('#fa').onsubmit = e => { e.preventDefault(); if (!isAdmin()) return toast('Only admins can mark attendance.', true);
    const status = e.submitter?.value, codes = checked(), d = $('#ad').value;
    if (!d) return toast('Choose a date.', true);
    if (!codes.length) return toast('Select at least one fellow.', true);
    run(async () => {
      const old = att.filter(x => x.att_date === d && codes.includes(x.volunteer_code)).map(x => x.id), have = new Set(att.filter(x => x.att_date === d).map(x => x.volunteer_code));
      const fresh = codes.filter(c => !have.has(c)).map(c => ({ volunteer_code: c, att_date: d, status }));
      if (old.length) await sb('attendance', `id=in.(${old.join(',')})`, 'PATCH', { status });
      if (fresh.length) await sb('attendance', '', 'POST', fresh);
      if (codes.length === 1) $('#vf').value = codes[0];
      $('#vm').value = d.slice(0, 7);
      await load(); $('#pick').querySelectorAll('input').forEach(i => i.checked = false); count();
      toast(`${status} marked for ${codes.length} fellow${codes.length > 1 ? 's' : ''}`);
    });
  };
  $('#vf').onchange = $('#vm').onchange = detail;
  $('#all').onclick = () => { $('#vm').value = ''; detail(); };
  $('#list').onclick = e => { const b = e.target.closest('[data-view]'); if (!b) return; if (isAdmin()) $('#vf').value = b.dataset.view; if (!month()) $('#vm').value = today().slice(0, 7); detail(); $('#sum').scrollIntoView({ behavior: 'smooth' }); };
  $('#days').onchange = e => { const s = e.target.closest('select[data-id]'); if (s && isAdmin()) run(async () => { await sb('attendance', `id=eq.${s.dataset.id}`, 'PATCH', { status: s.value }); await load(); }, 'Attendance updated'); };
  $('#days').onclick = e => { const b = e.target.closest('[data-del]'); if (b && isAdmin() && confirm('Remove this attendance record?')) run(async () => { await sb('attendance', `id=eq.${b.dataset.del}`, 'DELETE'); await load(); }, 'Record removed'); };
  await load();
});
