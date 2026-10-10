# Database tier

This project uses the official `postgres:16` image directly; a custom database Dockerfile is not needed. Compose creates the `sbt-postgres-data` named volume and waits for the database health check before starting the backend. Product catalogue records are stored in PostgreSQL. Uploaded saree photos and compatibility JSON files remain in the separate `sbt-app-data` volume mounted into the backend.

Do not delete `sbt-postgres-data` unless you intend to delete the database.
