boot('tasks', async () => {
  const u = me(); let tasks = [];
  const DRIVE = /^https:\/\/(drive|docs)\.google\.com\//i;
  const prev = l => {
    if (/docs\.google\.com\/(document|spreadsheets|presentation)\/d\//.test(l)) return l.replace(/\/(edit|view|pub)[^]*$/, '/preview');
    const m = /\/d\/([\w-]+)|[?&]id=([\w-]+)/.exec(l); return m ? `https://drive.google.com/file/d/${m[1] || m[2]}/preview` : '';
  };
  if (isAdmin()) { const v = await sb('volunteers', 'select=code,name&role=eq.fellow&status=eq.active&order=code.asc'); $('#who').innerHTML = v.map(x => `<option value="${esc(x.code)}">${esc(x.code)} · ${esc(x.name)}</option>`).join(''); }

  const rep = x => {
    const done = x.status === 'Completed' && x.report_url;
    const pv = done ? `<button class="sm" data-pv="${x.id}">Preview</button>` : '';
    if (isAdmin()) return x.report_url ? (pv || badge('Link saved, not completed', 'warn')) : '<span class="muted">Not submitted</span>';
    return `<div class="rep"><input type="url" data-r="${x.id}" value="${esc(x.report_url || '')}" placeholder="Google Drive file link" aria-label="Report link"${done ? ' readonly' : ''}><div class="ra">${done ? '' : `<button class="sm sec" data-save="${x.id}">Save link</button>`}${pv}</div></div>`;
  };
  const draw = () => {
    $('#list').innerHTML = tbl([['Task', x => `<b>${esc(x.title)}</b><br>${esc(x.location)}`], ['Assigned to', x => esc(x.assigned_to)], ['Due', x => `<span class="${x.status !== 'Completed' && x.due_date < today() ? 'late' : ''}">${fmt(x.due_date)}</span>`], ['Priority', x => badge(x.priority, x.priority === 'High' ? 'bad' : '')],
      [isAdmin() ? 'Report' : 'Add Report', rep],
      ['Status', x => `<select data-id="${x.id}">${['Pending', 'In Progress', 'Completed'].map(s => `<option${s === x.status ? ' selected' : ''}>${s}</option>`).join('')}</select>${x.completed_at ? `<div class="muted">${fmt(x.completed_at.slice(0, 10))}</div>` : ''}`],
      ['Actions', x => `<button class="sm sec" data-edit="${x.id}">Edit</button> <button class="sm danger" data-del="${x.id}">Delete</button>`, 'adm']], tasks, 'No tasks assigned.');
  };
  const load = async () => {
    tasks = await sb('tasks', 'select=*&order=due_date.asc' + (isAdmin() ? '' : '&assigned_to=eq.' + encodeURIComponent(u.code)));
    draw();
  };
  const preview = t => {
    const src = prev(t.report_url), m = document.createElement('div'); m.className = 'pv';
    const close = () => { m.remove(); document.removeEventListener('keydown', k); }, k = e => { if (e.key === 'Escape') close(); };
    m.innerHTML = `<div class="pvb" role="dialog" aria-modal="true" aria-label="Report preview"><div class="pvh"><b>${esc(t.title)}</b><span><a href="${esc(t.report_url)}" target="_blank" rel="noopener">Open in Drive</a><button class="sm sec" data-x>Close</button></span></div>${src ? `<iframe src="${esc(src)}" title="Report preview" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>` : '<div class="empty">This link cannot be previewed. Use Open in Drive.</div>'}<p class="hint">If the preview is blank, set the file to "Anyone with the link can view" in Google Drive.</p></div>`;
    m.onclick = e => { if (e.target === m || e.target.hasAttribute('data-x')) close(); };
    document.addEventListener('keydown', k); document.body.append(m); m.querySelector('button').focus();
  };

  const f = $('#f'); let editing = null;
  const setMode = t => {
    editing = t; f.reset();
    $('#mode').hidden = $('#cancel').hidden = !t;
    $('#mode').textContent = t ? `Editing: ${t.title}` : '';
    $('#go').textContent = t ? 'Save changes' : 'Assign task';
    if (!t) return;
    if (![...f.assigned_to.options].some(o => o.value === t.assigned_to)) f.assigned_to.add(new Option(t.assigned_to, t.assigned_to));
    for (const k of ['title', 'location', 'assigned_to', 'due_date', 'priority']) f[k].value = t[k] || '';
  };
  $('#cancel').onclick = () => setMode(null);
  f.onsubmit = e => { e.preventDefault(); if (!isAdmin()) return toast('Only admins can change tasks.', true); run(async () => {
    const d = Object.fromEntries(new FormData(f));
    if (editing) await sb('tasks', `id=eq.${editing.id}`, 'PATCH', d); else { d.status = 'Pending'; await sb('tasks', '', 'POST', d); }
    setMode(null); await load();
  }, editing ? 'Task updated' : 'Task assigned'); };
  $('#list').onchange = e => {
    const s = e.target.closest('select[data-id]'); if (!s) return;
    const t = tasks.find(x => x.id == s.dataset.id), done = s.value === 'Completed';
    if (done && !t.report_url) { toast('Save the Google Drive report link first, then mark Completed.', true); return draw(); }
    run(async () => { await sb('tasks', `id=eq.${t.id}`, 'PATCH', { status: s.value, completed_at: done ? new Date().toISOString() : null }); await load(); }, 'Status updated');
  };
  $('#list').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.pv) return preview(tasks.find(x => x.id == b.dataset.pv));
    if (b.dataset.edit && isAdmin()) { setMode(tasks.find(x => x.id == b.dataset.edit)); return f.scrollIntoView({ behavior: 'smooth' }); }
    if (b.dataset.del && isAdmin()) {
      const t = tasks.find(x => x.id == b.dataset.del);
      if (t && confirm(`Delete task "${t.title}" assigned to ${t.assigned_to}? Any submitted report link is removed too. This cannot be undone.`)) run(async () => { await sb('tasks', `id=eq.${t.id}`, 'DELETE'); if (editing?.id === t.id) setMode(null); await load(); }, 'Task deleted');
      return;
    }
    if (b.dataset.save) {
      const v = $(`input[data-r="${b.dataset.save}"]`).value.trim();
      if (!DRIVE.test(v)) return toast('Paste a Google Drive or Google Docs file link.', true);
      run(async () => { await sb('tasks', `id=eq.${b.dataset.save}`, 'PATCH', { report_url: v }); await load(); }, 'Report link saved');
    }
  };
  await load();
});
