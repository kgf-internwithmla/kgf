# KGF Youth Leaders Management Portal

Five pages: Dashboard, Volunteers, Tasks & Assignments, Attendance Tracking (attendance), Calendar.
Plain HTML, CSS and JavaScript on a Supabase database. Shared code is in `shared.js` and `shared.css`; each page has its own `.html`, `.css` and `.js`.

## Setup (new project)
1. Create a project at supabase.com.
2. SQL Editor: run `sql/schema.sql`, then (optional) `sql/demo-data.sql`.
3. Project Settings > API: copy the Project URL and anon key into the top of `shared.js`.
4. Serve the folder: `python3 -m http.server 8000`, then open http://localhost:8000/index.html
   Or upload it to any static host (Netlify, GitHub Pages, Cloudflare Pages).

## Upgrading an existing database
Run only the files you have not run yet, in this order, from `sql/migrations/`:
`migrate-ids.sql`, `migrate-volunteers.sql`, `migrate-tasks.sql`, `migrate-attendance.sql`, `migrate-remove-requests.sql`, `migrate-delete-cascade.sql`, `migrate-remove-validation.sql`, `migrate-common-tasks.sql`.
`migrate-attendance.sql` and `migrate-remove-requests.sql` delete data permanently.

## Demo sign-ins (from demo-data.sql)
| ID No | Password | Access |
|---|---|---|
| KGF-ADMIN | admin123 | Admin: registers fellows, assigns tasks, marks attendance |
| KGF-2026-001 to 005 | fellow001 to fellow005 | Fellow: own tasks, reports and attendance |

Passwords are stored as SHA-256 hashes.

## Security warning
Row Level Security is disabled. Anyone holding the anon key can read and edit every table directly, including password hashes and Drive links. The admin/fellow split is enforced only in the page code. Fine for a demo or closed pilot; before real use enable RLS, put database access behind a server (e.g. Supabase Edge Functions), use a salted hash such as bcrypt, and delete the demo accounts.
