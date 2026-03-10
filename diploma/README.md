# AI Investment Assistant UI + Go Backend

## Frontend

```bash
npm i
npm run dev
```

Frontend URL: `http://localhost:5173`

If backend runs on another host/port, set:

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## Backend (PostgreSQL)

```bash
psql "$DATABASE_URL" -f backend/db/schema.sql`npsql "$DATABASE_URL" -f backend/db/seed.sql
cd backend
go mod tidy
go run ./cmd/server
```

Required env:

- `DATABASE_URL`

Optional env:

- `PORT` (default `8080`)
- `DEFAULT_USER_EMAIL` (default `john.doe@example.com`)
