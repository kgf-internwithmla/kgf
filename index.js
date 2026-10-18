boot('index', async () => {
  const [v, t, r, e] = await Promise.all([
    sb('volunteers', 'select=code&role=eq.fellow&status=eq.active'),
    sb('tasks', 'select=*&order=due_date.asc'),
    sb('requests', 'select=status'),
    sb('events', `select=*&event_date=gte.${today()}&order=event_date.asc&limit=5`)
  ]);
  const open = t.filter(x => x.status !== 'Completed'), late = open.filter(x => x.due_date < today());
  const pend = r.filter(x => x.status !== 'Resolved').length;
  const s = (n, l, c = '') => `<div class="card stat ${c}"><b>${n}</b>${l}</div>`;
  $('#stats').innerHTML = s(v.length, 'Active volunteers') + s(open.length, 'Open tasks', 'y') + s(t.length - open.length, 'Completed assignments') + s(pend, 'Public requests pending', 'r') + s(late.length, 'Tasks overdue', 'r');
  $('#tasks').innerHTML = tbl([['Task', x => esc(x.title)], ['Assigned to', x => esc(x.assigned_to)], ['Due', x => fmt(x.due_date)], ['Status', x => badge(x.status, x.due_date < today() ? 'bad' : 'warn')]], open.slice(0, 6), 'No open tasks.');
  $('#events').innerHTML = tbl([['Date', x => fmt(x.event_date)], ['Event', x => esc(x.title)], ['Type', x => badge(x.type)], ['Place', x => esc(x.location)]], e, 'No upcoming events.');
});
