boot('volunteers', async () => {
  let list = [], editing = null;
  const f = $('#f');
  const gid = u => { const m = /\/d\/([\w-]+)|[?&]id=([\w-]+)/.exec(u || ''); return m ? (m[1] || m[2]) : ''; };
  const src = (i, w) => `https://drive.google.com/thumbnail?id=${i}&sz=w${w}`;
  const fb = (i, w) => `if(!this.dataset.t){this.dataset.t=1;this.src='https://lh3.googleusercontent.com/d/${i}=w${w}'}else this.remove()`;
  const ph = x => { const i = gid(x.photo_url); return `<span class="ph"${i ? ` data-photo="${i}" data-n="${esc(x.name)}" role="button" tabindex="0" aria-label="View photo of ${esc(x.name)}"` : ''}>${esc(x.name[0])}${i ? `<img src="${src(i, 200)}" alt="" referrerpolicy="no-referrer" onerror="${fb(i, 200)}">` : ''}</span>`; };
  const lightbox = (i, n) => {
    const m = document.createElement('div'); m.className = 'lb';
    const close = () => { m.remove(); document.removeEventListener('keydown', k); }, k = e => { if (e.key === 'Escape') close(); };
    m.innerHTML = `<figure><img src="${src(i, 800)}" alt="${esc(n)}" referrerpolicy="no-referrer" onerror="${fb(i, 800)}"><figcaption>${esc(n)}</figcaption></figure>`;
    m.onclick = close; document.addEventListener('keydown', k); document.body.append(m);
  };
  const load = async () => {
    list = await sb('volunteers', 'select=*&order=code.asc');
    const act = x => `<button class="sm sec" data-edit="${x.id}">Edit</button> ` + (x.role === 'admin' ? '' :
      `<button class="sm sec" data-id="${x.id}" data-s="${x.status}">${x.status === 'active' ? 'Deactivate' : 'Activate'}</button> <button class="sm danger" data-del="${x.id}">Delete</button>`);
    $('#list').innerHTML = tbl([
      ['Volunteer', x => `<div class="who2">${ph(x)}<div><b>${esc(x.name)}</b><small>${esc(x.code)}</small></div></div>`],
      ['Role', x => badge(x.member_type)],
      ['Contact', x => esc(x.email) + '<br>' + esc(x.phone)],
      ['DOB / Blood', x => fmt(x.dob) + '<br>' + esc(x.blood_group)],
      ['Address', x => `<div class="addr">${esc(x.address)}</div>`],
      ['Status', x => badge(x.status, x.status === 'active' ? 'ok' : 'bad')],
      ['Actions', act, 'adm']], list);
  };
  const setMode = v => {
    editing = v; f.reset(); f.code.readOnly = !!v; f.pw.required = !v;
    $('#mode').hidden = $('#cancel').hidden = !v;
    $('#mode').textContent = v ? `Editing ${v.code}. Leave the password blank to keep it.` : '';
    $('#go').textContent = v ? 'Save changes' : 'Register';
    if (v) for (const k of ['code', 'name', 'email', 'phone', 'member_type', 'dob', 'blood_group', 'address', 'photo_url']) f[k].value = v[k] || '';
  };
  $('#cancel').onclick = () => setMode(null);

  f.onsubmit = async e => {
    e.preventDefault();
    if (!isAdmin()) return toast('Only admins can change volunteers.', true);
    try {
      const d = Object.fromEntries(new FormData(f)), pw = (d.pw || '').trim(); delete d.pw;
      d.code = d.code.trim().toUpperCase(); d.phone = d.phone.replace(/\s/g, '');
      if (pw) d.key_hash = await sha(pw);
      if (editing) {
        delete d.code; await sb('volunteers', `id=eq.${editing.id}`, 'PATCH', d);
        if (editing.code === me().code) sessionStorage.setItem('kgf', JSON.stringify({ ...me(), name: d.name }));
      } else { d.role = 'fellow'; await sb('volunteers', '', 'POST', d); }
      toast(editing ? 'Changes saved' : `${d.name} registered`); setMode(null); await load();
    } catch (x) { toast(/23505|duplicate/i.test(x.message) ? 'That ID No is already registered.' : x.message.slice(0, 160), true); }
  };

  $('#list').onclick = async e => {
    const p = e.target.closest('[data-photo]'); if (p) return lightbox(p.dataset.photo, p.dataset.n);
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
