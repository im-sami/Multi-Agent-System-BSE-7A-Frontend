# Docker usage (commands)

This file contains concise, copy-pasteable commands to run the app with Docker so your local edits are visible while keeping `node_modules` and the production build (`.next`) inside Docker volumes.

Run these from the project root in Windows `cmd.exe`.

Prerequisites
- Docker installed and running

---

## Development Mode (Hot-Reload) - **RECOMMENDED** for Active Development

Use this when you want **live hot-reload** — file changes appear immediately without rebuilding.

```cmd
cd /d "D:\University\Semester 7\SPM\SPM_Project\Multi-Agent-System-BSE-7A-Frontend"
docker compose up dev
```

- Your code changes are picked up **immediately** (Next.js dev server watches files).
- Access the app at http://localhost:3000
- Press `Ctrl+C` to stop.
- No need to run builder or rebuild — deps install automatically on first run.

---

## Production Mode (using docker compose)

1) **First time or after adding dependencies:** Populate named volumes (installs deps and builds into volumes)

```cmd
cd /d "D:\University\Semester 7\SPM\SPM_Project\Multi-Agent-System-BSE-7A-Frontend"
docker compose run --rm builder
```

2) **Start the production service**

```cmd
docker compose up web
```

3) **Stop the service**

```cmd
docker compose down
```

2) Using `docker run` (manual, same behaviour)

  # Build the image (optional if you use compose which builds the `web` service)
  cd /d "D:\University\Semester 7\SPM\SPM_Project\Multi-Agent-System-BSE-7A-Frontend"
  docker build -t mas-frontend:latest .

  # Populate volumes: installs and builds into Docker named volumes `mas-node-modules` and `mas-next`.
  docker run --rm -it -v "%cd%:/app" -v mas-node-modules:/app/node_modules -v mas-next:/app/.next -w /app node:20-alpine sh -c "npm install -g pnpm && pnpm install --no-frozen-lockfile && pnpm build"

  # Run the production container with source bind-mounted so edits reflect immediately
  docker run --rm -it -p 3000:3000 -v "%cd%:/app" -v mas-node-modules:/app/node_modules -v mas-next:/app/.next mas-frontend:latest

3) Quick dev workflow (install+dev server inside ephemeral container)

  # Run dev server (installs into named volume and runs `pnpm dev`)
  docker run --rm -it -p 3000:3000 -v "%cd%:/app" -v mas-node-modules:/app/node_modules -w /app node:20-alpine sh -c "npm install -g pnpm && pnpm install --no-frozen-lockfile && pnpm dev"

Notes
- Why named volumes? Binding the host project to `/app` hides the files that were baked into the image (particularly `node_modules` and `.next`). Mounting `node_modules` and `.next` as Docker named volumes preserves those build artifacts inside Docker while letting your source files be edited on the host and reflected in the container.
- `--no-frozen-lockfile` is used in the container because your `pnpm-lock.yaml` is currently out-of-sync with `package.json`. This allows the container install+build to complete. If you prefer, run `pnpm install` on your host and keep the lockfile synchronized.
- In PowerShell use `${PWD}` instead of `%cd%` (or run the same commands inside WSL/linux with adjusted path style).

If you want, I can add a small `README.md` snippet instead of this file or add a `dev` service to `docker-compose.yml` that runs `pnpm dev`.

## Quick-run notes

Do you need to repeat the full install/build every time? No — after the builder has populated the named volumes you generally do not need to re-run the install/build unless you change dependencies or want a fresh production build.

- First time (populate volumes: installs deps and builds into Docker volumes):

```cmd
cd /d "D:\\University\\Semester 7\\SPM\\SPM_Project\\Multi-Agent-System-BSE-7A-Frontend"
docker compose run --rm builder
```

- Start the web service (no rebuild needed unless you changed the Dockerfile, dependencies or want a fresh build):

```cmd
docker compose up web
```

- If you changed dependencies or want to rebuild the production artifacts, re-run the builder and then start web:

```cmd
docker compose run --rm builder && docker compose up --build web
```

- Quick cleanup (remove the named volumes and force a fresh populate):

```cmd
docker compose down
docker volume rm mas-node-modules mas-next
docker compose run --rm builder
docker compose up web
```

Notes:
- For local code edits you generally only need to run `docker compose up web` after the builder step — the source is bind-mounted so edits show immediately.
- Only re-run the builder when you change dependencies or need a new production build (`.next`).
- If you prefer development hot-reload, run the `dev` container (or `pnpm dev` on host). See `DOCKER.md` for more variants and `docker run` examples.
