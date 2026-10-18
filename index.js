boot('index', async () => {
  $('#hello').textContent = 'Welcome back, ' + me().name.split(' ')[0];
  $('#date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const [v, t, e, a] = await Promise.all([
    sb('volunteers', 'select=code&role=eq.fellow&status=eq.active'),
    sb('tasks', 'select=*&order=due_date.asc'),
    sb('events', `select=*&event_date=gte.${today()}&order=event_date.asc&limit=5`),
    sb('attendance', `select=status&att_date=eq.${today()}`)
  ]);
  const pres = a.filter(x => x.status === 'Present').length;
  const open = t.filter(x => x.status !== 'Completed'), late = open.filter(x => x.due_date < today());
  const s = (n, l, c, i) => `<div class="card stat ${c}"><div class="si">${ic(ICON[i])}</div><div><b>${n}</b><span>${l}</span></div></div>`;
  $('#stats').innerHTML = s(v.length, 'Active volunteers', '', 'users') + s(pres, 'Present today', '', 'cal') + s(open.length, 'Open tasks', 'y', 'tasks') + s(t.length - open.length, 'Completed assignments', 'g', 'done') + s(late.length, 'Tasks overdue', 'r', 'alert');
  $('#tasks').innerHTML = tbl([['Task', x => esc(x.title)], ['Assigned to', x => esc(x.assigned_to)], ['Due', x => fmt(x.due_date)], ['Status', x => badge(x.status, x.due_date < today() ? 'bad' : 'warn')]], open.slice(0, 6), 'No open tasks.');
  $('#events').innerHTML = tbl([['Date', x => fmt(x.event_date)], ['Event', x => esc(x.title)], ['Type', x => badge(x.type)], ['Place', x => esc(x.location)]], e, 'No upcoming events.');
});
