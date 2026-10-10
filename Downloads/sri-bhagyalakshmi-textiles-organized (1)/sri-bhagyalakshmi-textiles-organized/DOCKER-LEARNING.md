# Three-container Docker learning setup

The repository is organized as three independent services. Each custom image has its own build context, package manifest, and Dockerfile. The root `compose.yaml` connects them.

- `frontend/`: React + Vite build, served by Nginx on container port 80. Host port 8080 maps to it. Nginx forwards `/api/` and `/uploads/` to the backend.
- `backend/`: Node.js + Express API, connected to PostgreSQL using `DATABASE_URL`. Uploaded images and compatibility files are stored under `/data`.
- `database`: the official `postgres:16` image. A custom database Dockerfile is not needed.

## Architecture

```text
Browser :8080
    |
    v
Frontend (Nginx)
    |  /api and /uploads
    v
Backend (Express :3000)
    |
    v
PostgreSQL (:5432, private)
```

All services join the Docker bridge network `sbt-network`. PostgreSQL is not published to the host.

## Build images separately

Run at the repository root:

```bash
docker build -t sbt-frontend:1.0 ./frontend
docker build -t sbt-backend:1.0 ./backend
docker pull postgres:16
docker images
```

## Start the application

```bash
cp .env.example .env
# Edit .env and set strong POSTGRES_PASSWORD and ADMIN_PASSWORD values.
docker compose up --build -d
docker compose ps
docker compose logs -f backend
```

Open <http://localhost:8080> and the admin page at <http://localhost:8080/#/admin>.

## Persistent data

- `sbt-postgres-data`: PostgreSQL database files.
- `sbt-data`: uploaded saree images, admin configuration, and a compatibility catalogue snapshot.

On first startup, if PostgreSQL has no catalogue row, the backend imports `/data/store.json` if it exists; otherwise it seeds the catalogue. The old SQLite database is not directly imported. Back up volumes before migration.

## Useful commands

```bash
docker compose logs -f database
docker compose logs -f backend
docker network inspect sbt-network
docker volume inspect sbt-postgres-data
docker volume inspect sbt-data
docker compose exec database psql -U textiles_user -d textiles -c '\dt'
docker compose down
```

`docker compose down` preserves volumes. `docker compose down -v` deletes Compose volumes and is destructive.

## Local development

Run the backend in one terminal:

```bash
cd backend
npm install
npm run dev
```

Run the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend Vite dev server proxies `/api` and `/uploads` to `http://localhost:3000`. For local backend development, provide a reachable PostgreSQL `DATABASE_URL` and a strong `ADMIN_PASSWORD`.
