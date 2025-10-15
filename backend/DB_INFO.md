# Demo Database Credentials

- **Host:** db (Docker service) or localhost (if mapped)
- **Port:** 5432  
- **User:** postgres  
- **Password:** postgres  
- **Database:** demo_db  

## Connection String

```text
postgres://postgres:postgres@localhost:5432/demo_db
```

## How It Works

The `POSTGRES_DB` environment variable in `docker-compose.yml` initializes and creates the database named `demo_db` automatically when the container starts.

## Usage Instructions

1. Ensure your `.env` (copied from `.env.example`) contains:

   ```
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=demo_db
   DB_PORT=5432
   ```

2. From the `backend/` directory, rebuild and start the services:

   ```bash
   cd backend
   docker-compose up --build -d