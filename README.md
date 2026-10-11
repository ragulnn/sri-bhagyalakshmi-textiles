# Sri Bhagyalakshmi Textiles

A React/Vite storefront with a separate Express API and PostgreSQL database. The frontend and backend are independently buildable projects; Docker Compose is kept at the repository root to wire the services together.

## Project layout

```text
sri-bhagyalakshmi-textiles/
├── compose.yaml          # Runs the three services together
├── .env.example          # Database and admin secrets template
├── frontend/             # React + Vite + Nginx image
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── nginx.conf
│   └── src/
├── backend/              # Express API + PostgreSQL access
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── server.ts
│   └── seed/
└── database/             # Notes about the official PostgreSQL image
```

## Run with Docker Compose

1. Install Docker Desktop or Docker Engine with Compose.
2. Copy `.env.example` to `.env` and set strong, unique `POSTGRES_PASSWORD` and `ADMIN_PASSWORD` values. Use letters and numbers for the database password with the current connection URL format.
3. Build the images and start the services:

   ```bash
   docker compose up --build -d
   ```

4. Check startup:

   ```bash
   docker compose ps
   docker compose logs -f backend
   ```

5. Visit <http://localhost:8080>. Admin portal: <http://localhost:8080/#/admin>.

## Build images separately

Run these from the project root:

```bash
docker build -t sbt-frontend:1.0 ./frontend
docker build -t sbt-backend:1.0 ./backend
docker pull postgres:16
```

PostgreSQL uses the official `postgres:16` image; no custom database Dockerfile is required.

## Persistent data

- `sbt-postgres-data`: PostgreSQL database files.
- `sbt-data`: uploaded saree images, admin configuration, and a compatibility catalogue snapshot.

On first startup, if PostgreSQL has no catalogue row, the backend imports a legacy `/data/store.json` catalogue if present; otherwise it seeds the catalogue. This does not directly import the old SQLite database. Back up existing volumes before migration.

See [DOCKER-LEARNING.md](DOCKER-LEARNING.md) for architecture and useful commands.
