// ---- Keep YOUR Supabase values here when you paste this file ----
const CFG = { url: 'https://mczzebguetahvnynvhip.supabase.co', key: 'sb_publishable_t3PFu7pQPGt_mRrE5zIQOg_IZQpeZAs' };
// -----------------------------------------------------------------
const LOGO = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh5ghIENEdfPvEKXNpg6AaNuCJ33z631SU_sOYwX8vNm_iruNhliEaZYuWYi8FPpN_8Sn0xGf1NUb8KoObgTXT3_ADcD2Aq-Tki2BW_q9qzW39tYLocWcYi_gcDXsZEs6fBvpcm_TDbRyo2ijJiHbO3S2X-dMlEn4J-j77FzOVfavP9sXT-c7AjJY2SbP81/s320/kgflogo.jpg';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const me = () => JSON.parse(sessionStorage.getItem('kgf') || 'null');
const isAdmin = () => me()?.role === 'admin';
const ic = p => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICON = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  tasks: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12h6M9 16h4"/>',
  chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  done: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4M12 17h.01"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
};
if (!document.querySelector('link[rel~=icon]')) document.head.insertAdjacentHTML('beforeend', `<link rel="icon" href="${LOGO}"><meta name="theme-color" content="#0b2a6f">`);

async function sb(table, query = '', method = 'GET', body) {
  const r = await fetch(`${CFG.url}/rest/v1/${table}${query ? '?' + query : ''}`, {
    method,
    headers: { apikey: CFG.key, Authorization: 'Bearer ' + CFG.key, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) throw new Error((await r.text()) || r.statusText);
  return r.status === 204 ? [] : r.json();
}
async function sha(s) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function toast(msg, bad) {
  $('#toast')?.remove();
  const t = document.createElement('div');
  t.id = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; if (bad) t.className = 'bad';
  document.body.append(t); setTimeout(() => t.remove(), 3500);
}
async function run(fn, ok) { try { await fn(); if (ok) toast(ok); } catch (e) { toast(e.message.slice(0, 160), true); } }
function tbl(cols, rows, empty = 'Nothing here yet.') {
  if (!rows.length) return `<div class="empty">${empty}</div>`;
  return `<div class="tw"><table><thead><tr>${cols.map(c => `<th class="${c[2] || ''}">${c[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td data-l="${c[0]}" class="${c[2] || ''}"><div class="cv">${c[1](r)}</div></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const badge = (t, cls = '') => `<span class="badge ${cls}">${esc(t)}</span>`;
const fmt = d => d ? new Date(d + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '–';

function boot(page, init) {
  const pages = [['index', 'Dashboard', 'home'], ['volunteers', 'Volunteers', 'users'], ['tasks', 'Tasks', 'tasks'], ['attendance', 'Attendance', 'chart'], ['calendar', 'Calendar', 'cal'], ['resources', 'Resources', 'book']];
  const start = () => {
    const u = me(), ini = u.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const links = (cls) => pages.map(p => `<a href="${p[0]}.html" class="${p[0] === page ? 'on' : ''}"${p[0] === page ? ' aria-current="page"' : ''}>${cls ? ic(ICON[p[2]]) : ''}${p[1]}</a>`).join('');
    const brand = `<a class="brand" href="index.html"><img src="${LOGO}" alt="KGF logo" onerror="this.style.display='none'"><span>KGF <b>Intern with MLA</b></span></a>`;
    document.body.classList.toggle('admin', isAdmin());
    $('#nav').innerHTML = `<header class="top"><div class="tbi"><button class="burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="drawer">${ic(ICON.menu)}</button>${brand}<nav class="dnav" aria-label="Main">${links(0)}</nav><div class="user"><span class="av">${esc(ini)}</span><span class="un">${esc(u.name)}<small>${esc(u.code)} · ${isAdmin() ? 'Admin' : 'Fellow'}</small></span><button class="sm sec out">Sign out</button></div></div></header>
<div class="scrim" id="scrim"></div>
<aside id="drawer" aria-label="Menu"><div class="dh">${brand}<button class="x" id="close" aria-label="Close menu">${ic(ICON.close)}</button></div><div class="dme"><span class="av">${esc(ini)}</span><div><b>${esc(u.name)}</b><small>${esc(u.code)} · ${isAdmin() ? 'Admin' : 'Fellow'}</small></div></div><nav class="dl" aria-label="Mobile">${links(1)}</nav><button class="out dout">${ic(ICON.out)}Sign out</button></aside>`;
    const set = o => { document.body.classList.toggle('nav-open', o); $('#burger').setAttribute('aria-expanded', o); };
    $('#burger').onclick = () => set(true); $('#close').onclick = $('#scrim').onclick = () => set(false);
    document.onkeydown = e => { if (e.key === 'Escape') set(false); };
    document.querySelectorAll('.out').forEach(b => b.onclick = () => { sessionStorage.removeItem('kgf'); location.reload(); });
    run(init);
  };
  if (me()) return start();
  const l = document.createElement('div'); l.id = 'login';
  l.innerHTML = `<div class="lp"><img src="${LOGO}" alt="KGF logo" onerror="this.style.display='none'"><h2>Kavundampalayam<br>Governance Fellowship</h2><p>Intern with MLA Management Portal</p><ul><li>Fieldwork tasks and report submission</li><li>Attendance records</li></ul></div>
<form class="lf"><h1>Sign in</h1><p>Use the ID No and password issued by the programme office.</p><label>ID No<input name="c" required autocomplete="username" autocapitalize="characters" placeholder="KGF-2026-001"></label><label>Password<div class="pw"><input name="k" type="password" required autocomplete="current-password" placeholder="Enter password"><button type="button" class="eye" aria-label="Show password">${ic(ICON.eye)}</button></div></label><div class="err" id="err" role="alert"></div><button class="go">Sign in</button></form>`;
  document.body.append(l);
  const eye = l.querySelector('.eye'), k = l.querySelector('[name=k]');
  eye.onclick = () => { const s = k.type === 'password'; k.type = s ? 'text' : 'password'; eye.innerHTML = ic(s ? ICON.eyeOff : ICON.eye); eye.setAttribute('aria-label', s ? 'Hide password' : 'Show password'); k.focus(); };
  l.querySelector('form').onsubmit = async e => {
    e.preventDefault();
    const f = e.target, b = $('.go', l); b.disabled = true; $('#err').textContent = '';
    try {
      const h = await sha(f.k.value.trim());
      const r = await sb('volunteers', `select=code,name,role&code=eq.${encodeURIComponent(f.c.value.trim().toUpperCase())}&key_hash=eq.${h}&status=eq.active`);
      if (!r.length) { b.disabled = false; return $('#err').textContent = 'ID No or password is incorrect.'; }
      sessionStorage.setItem('kgf', JSON.stringify(r[0])); l.remove(); start();
    } catch (x) { b.disabled = false; $('#err').textContent = 'Cannot reach database. Check CFG in shared.js.'; }
  };
}
