# Build the three images separately

Run these commands from the folder containing `compose.yaml`.

```bash
# Frontend image (build context: ./frontend)
docker build -t sbt-frontend:1.0 ./frontend

# Backend image (build context: ./backend)
docker build -t sbt-backend:1.0 ./backend

# Official PostgreSQL image (no custom Dockerfile needed)
docker pull postgres:16
```

Check the local images:

```bash
docker images
```

Then configure secrets and start the full application from this same root folder:

```bash
cp .env.example .env
# Edit .env before starting.
docker compose up -d --build
docker compose ps
```

The Compose file builds each service from its own folder. All services join `sbt-network`; PostgreSQL data persists in `sbt-postgres-data`; application uploads/configuration persist in `sbt-data`.
