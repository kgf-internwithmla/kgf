boot('tasks', async () => {
  const u = me(); let tasks = [];
  if (isAdmin()) { const v = await sb('volunteers', 'select=code,name&role=eq.fellow&status=eq.active&order=code.asc'); $('#who').innerHTML = v.map(x => `<option value="${esc(x.code)}">${esc(x.code)} · ${esc(x.name)}</option>`).join(''); }
  const load = async () => {
    tasks = await sb('tasks', 'select=*&order=due_date.asc' + (isAdmin() ? '' : '&assigned_to=eq.' + encodeURIComponent(u.code)));
    $('#list').innerHTML = tbl([['Task', x => `<b>${esc(x.title)}</b><br>${esc(x.location)}`], ['Assigned to', x => esc(x.assigned_to)], ['Due', x => `<span class="${x.status !== 'Completed' && x.due_date < today() ? 'late' : ''}">${fmt(x.due_date)}</span>`], ['Priority', x => badge(x.priority, x.priority === 'High' ? 'bad' : '')],
      ['Status', x => `<select data-id="${x.id}">${['Pending', 'In Progress', 'Completed'].map(s => `<option${s === x.status ? ' selected' : ''}>${s}</option>`).join('')}</select>`]], tasks, 'No tasks assigned.');
  };
  $('#f').onsubmit = e => { e.preventDefault(); run(async () => { const d = Object.fromEntries(new FormData(e.target)); d.status = 'Pending'; await sb('tasks', '', 'POST', d); e.target.reset(); await load(); }, 'Task assigned'); };
  $('#list').onchange = e => { const s = e.target.closest('select[data-id]'); if (s) run(async () => { await sb('tasks', `id=eq.${s.dataset.id}`, 'PATCH', { status: s.value }); await load(); }, 'Status updated'); };
  await load();
});
