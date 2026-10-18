boot('performance', async () => {
  const load = async () => {
    const [v, a, t, p] = await Promise.all([sb('volunteers', 'select=code,name&role=eq.fellow&status=eq.active&order=code.asc'), sb('attendance', 'select=*'), sb('tasks', 'select=assigned_to,status'), sb('performance', 'select=*&order=month.desc')]);
    document.querySelectorAll('.who').forEach(s => s.innerHTML = v.map(x => `<option value="${esc(x.code)}">${esc(x.code)} · ${esc(x.name)}</option>`).join(''));
    const rows = v.map(x => {
      const at = a.filter(y => y.volunteer_code === x.code), pct = at.length ? Math.round(100 * at.filter(y => y.status === 'Present').length / at.length) : 0;
      const tt = t.filter(y => y.assigned_to === x.code), done = tt.filter(y => y.status === 'Completed').length;
      const ps = p.filter(y => y.volunteer_code === x.code);
      return { ...x, pct, days: at.length, done, total: tt.length, avg: ps.length ? Math.round(ps.reduce((s, y) => s + y.score, 0) / ps.length) : null, fb: ps[0] };
    });
    const mine = isAdmin() ? rows : rows.filter(r => r.code === me().code);
    $('#list').innerHTML = tbl([['Fellow', x => `<b>${esc(x.name)}</b><br>${esc(x.code)}`], ['Attendance', x => `${x.pct}% of ${x.days} days<div class="bar ${x.pct < 75 ? 'low' : ''}"><i style="width:${x.pct}%"></i></div>`], ['Tasks done', x => `${x.done} of ${x.total}`], ['Avg score', x => `<span class="score">${x.avg ?? '–'}</span>`], ['Latest feedback', x => x.fb ? `${esc(x.fb.month)}: ${esc(x.fb.feedback)}` : 'No review yet']], mine);
  };
  const save = (id, table, ok) => $(id).onsubmit = e => { e.preventDefault(); run(async () => { const d = Object.fromEntries(new FormData(e.target)); if (d.score) d.score = +d.score; await sb(table, '', 'POST', d); e.target.reset(); await load(); }, ok); };
  save('#fa', 'attendance', 'Attendance marked'); save('#fp', 'performance', 'Review saved');
  await load();
});
