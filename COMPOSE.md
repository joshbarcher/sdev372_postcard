# week 6 — containers

Everything week 4 did by hand, in one file.

```bash
cp .env.example .env     # then edit it
docker compose up --build
```

`http://localhost:8080`.

## What changed, and what did not

**The application did not change.** `git diff week-4 week-6` touches no file
under `api/src` or `web/src`. What arrived is a `Dockerfile` per service, a
`compose.yaml`, and an nginx config.

**DATABASE_URL is set now**, and it points at `db` — a hostname that exists
because compose made a network and named a container on it. There is no IP
anywhere in this repo.

**The API is no longer published.** In week 4 anyone who could reach port 8080
could reach the API. Here only `web` can: the browser talks to nginx, nginx
talks to `api` over the compose network. The firewall rule from week 5 now
protects one port instead of two.

## Three things to try

```bash
docker compose down && docker compose up -d
```

The postcards are still there. The named volume did that.

```bash
docker compose down -v && docker compose up -d
```

They are gone. `-v` removed the volume — which is why that flag deserves the
respect it never gets.

```bash
docker compose up -d --scale api=2
curl localhost:8080/api/config     # a few times
```

Same answer every time. The two API containers share one database, so it does
not matter which one answers. Take `DATABASE_URL` out and it would.
