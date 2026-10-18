// ---- Edit these two values (Supabase > Project Settings > API) ----
const CFG = { url: 'https://tefadudacxpzjwmzhhpg.supabase.co', key: 'sb_publishable_Lk4ccHLvxx4gWXF7SzTLlQ_dbWMu--y' };
// -------------------------------------------------------------------
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const me = () => JSON.parse(sessionStorage.getItem('kgf') || 'null');
const isAdmin = () => me()?.role === 'admin';

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
  t.id = 'toast'; t.textContent = msg; if (bad) t.className = 'bad';
  document.body.append(t); setTimeout(() => t.remove(), 3500);
}
async function run(fn, ok) { try { await fn(); if (ok) toast(ok); } catch (e) { toast(e.message.slice(0, 160), true); } }
function tbl(cols, rows, empty = 'Nothing here yet.') {
  if (!rows.length) return `<div class="empty">${empty}</div>`;
  return `<div class="tw"><table><thead><tr>${cols.map(c => `<th class="${c[2] || ''}">${c[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td class="${c[2] || ''}">${c[1](r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const badge = (t, cls = '') => `<span class="badge ${cls}">${esc(t)}</span>`;
const fmt = d => d ? new Date(d + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '–';

function boot(page, init) {
  const pages = [['index', 'Dashboard'], ['volunteers', 'Volunteers'], ['tasks', 'Tasks'], ['performance', 'Performance'], ['calendar', 'Calendar'], ['administration', 'Administration']];
  const start = () => {
    const u = me();
    document.body.classList.toggle('admin', isAdmin());
    $('#nav').innerHTML = `<header class="top"><div class="brand">KGF <b>Youth Leaders</b></div><nav>${pages.map(p => `<a href="${p[0]}.html" class="${p[0] === page ? 'on' : ''}">${p[1]}</a>`).join('')}</nav><div class="who">${esc(u.name)} (${esc(u.code)})<button class="sm sec" id="out">Sign out</button></div></header>`;
    $('#out').onclick = () => { sessionStorage.removeItem('kgf'); location.reload(); };
    run(init);
  };
  if (me()) return start();
  const l = document.createElement('div'); l.id = 'login';
  l.innerHTML = `<form><h1>KGF Youth Leaders Portal</h1><p>Kavundampalayam Governance Fellowship. Sign in with your volunteer code and access key.</p><label>Volunteer code<input name="c" required autocomplete="username" placeholder="KGF-001"></label><label>Access key<input name="k" type="password" required autocomplete="current-password"></label><div class="err" id="err"></div><button>Sign in</button></form>`;
  document.body.append(l);
  l.querySelector('form').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    try {
      const h = await sha(f.k.value.trim());
      const r = await sb('volunteers', `select=code,name,role&code=eq.${encodeURIComponent(f.c.value.trim().toUpperCase())}&key_hash=eq.${h}&status=eq.active`);
      if (!r.length) return $('#err').textContent = 'Code or access key is incorrect.';
      sessionStorage.setItem('kgf', JSON.stringify(r[0])); l.remove(); start();
    } catch (x) { $('#err').textContent = 'Cannot reach database. Check CFG in shared.js.'; }
  };
}
