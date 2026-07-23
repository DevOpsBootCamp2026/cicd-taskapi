# cicd-taskapi — Docker + GitHub Actions CI/CD demo

A small **Task REST API** (Node/Express + PostgreSQL) that exists to demonstrate a real CI/CD
pipeline: it is **linted**, **unit tested**, **API/integration tested against a real Postgres**,
**built into a Docker image**, and **published to the GitHub Container Registry (GHCR)** — all by
GitHub Actions.

## The API
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/health` | — | health check |
| GET | `/api/tasks` | — | list tasks (newest first) |
| POST | `/api/tasks` | `{ "title", "priority" }` | create a task (`priority`: low/medium/high) |
| GET | `/api/tasks/:id` | — | get one task |
| PATCH | `/api/tasks/:id/toggle` | — | flip `done` |
| DELETE | `/api/tasks/:id` | — | delete a task |

## Run it locally
```bash
docker compose up --build      # API on http://localhost:3000, Postgres alongside
curl localhost:3000/health
curl -X POST localhost:3000/api/tasks -H 'Content-Type: application/json' \
  -d '{"title":"Learn CI/CD","priority":"high"}'
curl localhost:3000/api/tasks
```

## Tests
Two kinds, on purpose:
- **Unit tests** (`tests/unit/`) — pure validation logic, no database. Fast, run anywhere.
  ```bash
  npm ci && npm run test:unit
  ```
- **API / integration tests** (`tests/api/`) — real HTTP requests (Supertest) against the app
  wired to a **real Postgres**. They create/list/toggle/delete tasks end to end.
  ```bash
  # needs a Postgres reachable via DATABASE_URL
  DATABASE_URL=postgres://taskuser:taskpass@localhost:5432/tasksdb npm run test:api
  ```

## The CI pipeline (`.github/workflows/ci.yml`)
Runs on every push / PR to `main`:
1. **lint** — `eslint`.
2. **unit-tests** — `npm run test:unit` (no DB).
3. **api-tests** — spins up a **Postgres service container**, then runs `npm run test:api`
   against it (real database, real HTTP).
4. **docker-build** — builds the image and **smoke-tests** it (`curl /health` inside the runner)
   so a broken image never gets published.

```
lint ─┬─ unit-tests ─┐
      └─ api-tests ──┴─ docker-build
```

## The CD pipeline (`.github/workflows/cd.yml`)
On push to `main` (and on `vX.Y.Z` tags):
- logs in to **GHCR** with the built-in `GITHUB_TOKEN`,
- computes tags with `docker/metadata-action` (branch, `sha-…`, semver, `latest`),
- **builds and pushes** the image to `ghcr.io/<owner>/cicd-taskapi`,
- on a version tag, also creates a **GitHub Release**.

Uses least-privilege `permissions: { contents: read, packages: write }`.

### Pulling the published image
```bash
docker pull ghcr.io/<owner>/cicd-taskapi:latest
docker run -e DATABASE_URL=postgres://user:pass@host:5432/db -p 3000:3000 \
  ghcr.io/<owner>/cicd-taskapi:latest
```

## Publishing a release
```bash
git tag v1.0.0 && git push origin v1.0.0     # triggers build+push (semver tag) + a Release
```
> After the first push, make the GHCR package public (or keep it private) under the repo's
> **Packages** settings if you want others to pull it.

## Project layout
```
src/            app.js · server.js · db.js · validation.js
tests/unit/     validation.test.js         (Jest, no DB)
tests/api/      tasks.test.js              (Supertest + Postgres)
Dockerfile      multi-stage, non-root
docker-compose.yml   local dev (api + postgres)
.github/workflows/   ci.yml · cd.yml
```
