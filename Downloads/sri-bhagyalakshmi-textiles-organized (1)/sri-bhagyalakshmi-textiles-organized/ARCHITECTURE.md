# Architecture

- **Frontend:** React + Vite assets, packaged independently and served by Nginx.
- **Backend:** Express API, packaged independently with its own Node dependencies.
- **Database:** official PostgreSQL 16 image.
- **Compose:** root `compose.yaml` configures service startup order, environment, private networking, health checks, and persistent volumes.

## Build contexts

The frontend image uses `./frontend` as its context; the backend image uses `./backend`. Neither image needs files from the repository root to build. Compose itself stays at the root and wires the services together.

## Network and persistence

All services use `sbt-network`. Only Nginx publishes a host port (`8080:80`). PostgreSQL remains private. `sbt-postgres-data` stores database files; `sbt-data` stores uploaded images and retained application configuration/snapshot files.
