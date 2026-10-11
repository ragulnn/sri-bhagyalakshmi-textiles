# Deployment notes

1. Install Docker Engine or Docker Desktop with Docker Compose.
2. Copy `.env.example` to `.env`; set strong unique database and admin passwords.
3. Run `docker compose up --build -d` from the repository root.
4. Verify with `docker compose ps` and `docker compose logs -f backend`.
5. Open the site at `http://localhost:8080`.

For a public deployment, put the site behind HTTPS, use managed secrets rather than committing `.env`, restrict database network access, configure backups for both named volumes, and test restoration. The current PostgreSQL migration imports the legacy JSON snapshot, not the previous SQLite database file.
