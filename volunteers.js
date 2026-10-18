boot('volunteers', async () => {
  let list = [], editing = null;
  const f = $('#f');
  const load = async () => {
    list = await sb('volunteers', 'select=id,code,name,email,phone,college,role,status,joined_on&order=code.asc');
    const act = x => `<button class="sm sec" data-edit="${x.id}">Edit</button> ` + (x.role === 'admin' ? '' :
      `<button class="sm sec" data-id="${x.id}" data-s="${x.status}">${x.status === 'active' ? 'Deactivate' : 'Activate'}</button> <button class="sm danger" data-del="${x.id}">Delete</button>`);
    $('#list').innerHTML = tbl([['Code', x => `<b>${esc(x.code)}</b>`], ['Name', x => esc(x.name)], ['Contact', x => esc(x.email) + '<br>' + esc(x.phone)], ['College', x => esc(x.college)], ['Role', x => badge(x.role)], ['Joined', x => fmt(x.joined_on)], ['Status', x => badge(x.status, x.status === 'active' ? 'ok' : 'bad')],
      ['Actions', act, 'adm']], list);
  };
  const setMode = v => {
    editing = v; f.reset();
    $('#mode').hidden = $('#kl').hidden = $('#cancel').hidden = !v;
    $('#mode').textContent = v ? `Editing ${v.code}` : '';
    $('#go').textContent = v ? 'Save changes' : 'Register fellow';
    if (v) for (const k of ['name', 'email', 'phone', 'college']) f[k].value = v[k] || '';
  };
  $('#cancel').onclick = () => setMode(null);

  // Create / Update (admin only)
  f.onsubmit = e => { e.preventDefault(); if (!isAdmin()) return toast('Only admins can change volunteers.', true); run(async () => {
    const d = Object.fromEntries(new FormData(f)), nk = (d.new_key || '').trim(); delete d.new_key;
    if (editing) {
      if (nk) d.key_hash = await sha(nk);
      await sb('volunteers', `id=eq.${editing.id}`, 'PATCH', d);
      if (editing.code === me().code) sessionStorage.setItem('kgf', JSON.stringify({ ...me(), name: d.name }));
      const msg = nk ? ` New access key for ${editing.code}: ` : '';
      $('#key').hidden = !nk; if (nk) $('#key').innerHTML = `<b>Access key updated.</b>${msg}<code>${esc(nk)}</code>`;
      setMode(null); await load(); return;
    }
    const n = Math.max(0, ...list.map(x => +x.code.replace(/\D/g, '') || 0)) + 1;
    const key = [...crypto.getRandomValues(new Uint8Array(8))].map(b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');
    d.code = 'KGF-' + String(n).padStart(3, '0'); d.role = 'fellow'; d.key_hash = await sha(key);
    await sb('volunteers', '', 'POST', d);
    $('#key').hidden = false;
    $('#key').innerHTML = `<b>${esc(d.name)} is registered.</b> Share these credentials now; the key cannot be shown again.<br>Code <code>${d.code}</code> &nbsp; Access key <code>${key}</code>`;
    f.reset(); await load();
  }, editing ? 'Changes saved' : null); };

  // Edit / Activate / Delete (admin only)
  $('#list').onclick = async e => {
    if (!isAdmin()) return;
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.edit) { setMode(list.find(x => x.id == b.dataset.edit)); f.scrollIntoView({ behavior: 'smooth' }); return; }
    if (b.dataset.id) return run(async () => {
      await sb('volunteers', `id=eq.${b.dataset.id}`, 'PATCH', { status: b.dataset.s === 'active' ? 'inactive' : 'active' }); await load();
    }, 'Status updated');
    if (b.dataset.del) {
      const v = list.find(x => x.id == b.dataset.del);
      if (v.code === me().code || v.role === 'admin') return toast('Admin accounts cannot be deleted.', true);
      if (!confirm(`Delete ${v.name} (${v.code})? This cannot be undone.`)) return;
      try { await sb('volunteers', `id=eq.${v.id}`, 'DELETE'); if (editing?.id === v.id) setMode(null); await load(); toast('Volunteer deleted'); }
      catch (x) { toast(/23503|foreign key/i.test(x.message) ? `${v.code} has tasks, attendance or reviews linked. Deactivate instead.` : x.message.slice(0, 160), true); }
    }
  };
  await load();
});
