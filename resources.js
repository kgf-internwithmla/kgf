boot('resources', async () => {
  let rows = [], editing = null;
  const f = $('#f');
  const DRIVE = /^https:\/\/(drive|docs)\.google\.com\//i;
  const prev = l => {
    if (/docs\.google\.com\/(document|spreadsheets|presentation)\/d\//.test(l)) return l.replace(/\/(edit|view|pub)[^]*$/, '/preview');
    const m = /\/d\/([\w-]+)|[?&]id=([\w-]+)/.exec(l); return m ? `https://drive.google.com/file/d/${m[1] || m[2]}/preview` : '';
  };
  const added = x => new Date(x.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const draw = () => {
    $('#rc').textContent = rows.length;
    $('#list').innerHTML = tbl([
      ['Date', x => `<span class="dt">${added(x)}</span>`],
      ['Resource', x => `<b>${esc(x.title)}</b>${x.description ? `<div class="desc">${esc(x.description)}</div>` : ''}`],
      ['File', x => `<button class="sm" data-pv="${x.id}">Preview</button>`],
      ['Actions', x => `<button class="sm sec" data-edit="${x.id}">Edit</button> <button class="sm danger" data-del="${x.id}">Delete</button>`, 'adm']
    ], rows, 'No resources have been shared yet.');
  };
  const load = async () => { rows = await sb('resources', 'select=*&order=created_at.desc,id.desc'); draw(); };

  const preview = t => {
    const src = prev(t.file_url), m = document.createElement('div'); m.className = 'pv';
    const close = () => { m.remove(); document.removeEventListener('keydown', k); }, k = e => { if (e.key === 'Escape') close(); };
    m.innerHTML = `<div class="pvb" role="dialog" aria-modal="true" aria-label="Resource preview"><div class="pvh"><b>${esc(t.title)}</b><span><a href="${esc(t.file_url)}" target="_blank" rel="noopener">Open in Drive</a><button class="sm sec" data-x>Close</button></span></div>${src ? `<iframe src="${esc(src)}" title="Resource preview" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>` : '<div class="empty">This link cannot be previewed. Use Open in Drive.</div>'}<p class="hint">If the preview is blank, set the file to "Anyone with the link can view" in Google Drive.</p></div>`;
    m.onclick = e => { if (e.target === m || e.target.hasAttribute('data-x')) close(); };
    document.addEventListener('keydown', k); document.body.append(m); m.querySelector('button').focus();
  };

  const setMode = t => {
    editing = t; f.reset();
    $('#mode').hidden = $('#cancel').hidden = !t;
    $('#mode').textContent = t ? `Editing: ${t.title}` : '';
    $('#go').textContent = t ? 'Save changes' : 'Add resource';
    if (t) for (const k of ['title', 'file_url', 'description']) f[k].value = t[k] || '';
  };
  $('#cancel').onclick = () => setMode(null);

  f.onsubmit = e => { e.preventDefault(); if (!isAdmin()) return toast('Only admins can change resources.', true); run(async () => {
    const d = Object.fromEntries(new FormData(f));
    d.title = d.title.trim(); d.file_url = d.file_url.trim(); d.description = d.description.trim() || null;
    if (!DRIVE.test(d.file_url)) throw new Error('Paste a Google Drive or Google Docs file link.');
    if (editing) await sb('resources', `id=eq.${editing.id}`, 'PATCH', d); else await sb('resources', '', 'POST', d);
    setMode(null); await load();
  }, editing ? 'Resource updated' : 'Resource added'); };

  $('#list').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.pv) return preview(rows.find(x => x.id == b.dataset.pv));
    if (!isAdmin()) return;
    if (b.dataset.edit) { setMode(rows.find(x => x.id == b.dataset.edit)); return f.scrollIntoView({ behavior: 'smooth' }); }
    if (b.dataset.del) {
      const t = rows.find(x => x.id == b.dataset.del);
      if (t && confirm(`Delete "${t.title}"? Volunteers will no longer see it. The file in Google Drive is not deleted. This cannot be undone.`))
        run(async () => { await sb('resources', `id=eq.${t.id}`, 'DELETE'); if (editing?.id === t.id) setMode(null); await load(); }, 'Resource deleted');
    }
  };
  await load();
});
