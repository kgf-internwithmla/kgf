boot('administration', async () => {
  let rows = [];
  const load = async () => {
    rows = await sb('requests', 'select=*&order=created_on.desc');
    $('#list').innerHTML = '<h2>Public requests</h2>' + tbl([['Request', x => `<b>${esc(x.title)}</b><br>${esc(x.category)} · ${esc(x.location)}<div class="note">${esc(x.notes || 'No follow-up notes yet.')}</div>`], ['Officer', x => esc(x.assigned_officer || 'Unassigned')], ['Logged', x => fmt(x.created_on)],
      ['Status', x => `<select data-id="${x.id}">${['New', 'In Progress', 'Escalated', 'Resolved'].map(s => `<option${s === x.status ? ' selected' : ''}>${s}</option>`).join('')}</select>`], ['', x => `<button class="sm sec" data-note="${x.id}">Add note</button>`]], rows, 'No requests logged.');
  };
  $('#f').onsubmit = e => { e.preventDefault(); run(async () => { const d = Object.fromEntries(new FormData(e.target)); d.status = 'New'; await sb('requests', '', 'POST', d); e.target.reset(); await load(); }, 'Request logged'); };
  $('#list').onchange = e => { const s = e.target.closest('select[data-id]'); if (s) run(async () => { await sb('requests', `id=eq.${s.dataset.id}`, 'PATCH', { status: s.value }); await load(); }, 'Status updated'); };
  $('#list').onclick = e => { const b = e.target.closest('button[data-note]'); if (!b) return; const r = rows.find(x => x.id == b.dataset.note), n = prompt('Follow-up note', r.notes || ''); if (n !== null) run(async () => { await sb('requests', `id=eq.${r.id}`, 'PATCH', { notes: n }); await load(); }, 'Note saved'); };
  await load();
});
