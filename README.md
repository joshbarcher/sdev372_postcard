# Postcard

The application we deploy in **SDEV 372 — Cloud Application Deployment**.

It is deliberately small: an API, a page, and somewhere to keep the postcards.
The course is not about writing it. The course is about getting it onto a
machine, into a container, onto a cluster, and then describing all of that in a
file so a computer can do it again.

```
api/    Express + MySQL, listening on 8080
web/    Vite + React, talking to the API
```

## The branches are the course

**The code barely changes across the quarter. The deployment does.** So each
branch is the same application, deployed one step further:

| branch | what it adds | week |
|---|---|---:|
| `master` | the application, nothing else | 1–3 |
| `week-4` | `postcard.service`, `/etc/postcard.env` — a VM, by hand | 4 |
| `week-6` | `Dockerfile`, `compose.yaml` — containers | 6 |
| `week-7` | Kubernetes manifests — Deployment, Service | 7 |
| `week-10` | Terraform — the whole thing, declared | 10 |

Each branch builds on the one before it, so the diff **is** the lesson:

```bash
git diff week-4 week-6      # exactly what containerising changed
git diff week-6 week-7      # exactly what a cluster changed
```

## Running it

```bash
cd api && npm install && npm start     # http://localhost:8080
cd web && npm install && npm run dev   # http://localhost:5173
```

The page proxies `/api` to port 8080, so you only ever open one address.

### The one environment variable that matters

**Without `DATABASE_URL`, postcards live in an array inside the process.** They
work perfectly and they do not survive a restart.

**With it, the same code writes to MySQL.** Nothing in the application changes —
`store.js` is the only file that reads the variable, and it is the only file
that knows a database exists.

```bash
DATABASE_URL="mysql://postcard:s3cr3t@127.0.0.1:3306/postcard" npm start
```

That is week 4 and week 5 in one sentence, and it is the reason the app is built
this way.

| variable | what it does |
|---|---|
| `PORT` | what to listen on. Default 8080. |
| `DATABASE_URL` | set it and postcards persist. Leave it and they do not. |
| `ADMIN_TOKEN` | required to delete a postcard. Without it, `DELETE` returns 503. |
| `APP_VERSION` | shown in the page footer, so a running page says which build it is. |
| `NODE_ENV` | shown in the footer too. |

## Tests

```bash
cd api && npm test
```

Eleven tests, driving the real routes through Express without binding a port —
which is why they run anywhere, including in CI on a machine with nothing else
installed.

## Nothing here is a real secret

`s3cr3t` is a fake password and `ADMIN_TOKEN` is whatever you set it to. There
are no credentials in this repository, and none should ever be added — putting a
secret in a repo is a lesson this course teaches by not doing it.
