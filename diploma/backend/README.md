# Go Backend (PostgreSQL)

Бэкенд переведен на PostgreSQL и использует реальную схему из `backend/db/schema.sql`.

## 1) Подготовка БД

Создай БД и примени схему:

```bash
psql "$DATABASE_URL" -f backend/db/schema.sql`npsql "$DATABASE_URL" -f backend/db/seed.sql
```

## 2) Переменные окружения

- `DATABASE_URL` (обязательно), пример: `postgres://postgres:postgres@localhost:5432/investai?sslmode=disable`
- `PORT` (опционально, по умолчанию `8080`)
- `DEFAULT_USER_EMAIL` (опционально, по умолчанию `john.doe@example.com`)

## 3) Запуск

```bash
cd backend
go mod tidy
go run ./cmd/server
```

## API

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET/PUT /api/v1/onboarding`
- `GET /api/v1/dashboard`
- `GET /api/v1/portfolio`
- `GET /api/v1/portfolio/holdings?search=&type=`
- `GET /api/v1/assets/{symbol}`
- `GET /api/v1/ai/messages`
- `POST /api/v1/ai/chat`
- `GET /api/v1/market/overview`
- `GET/PUT /api/v1/settings`

## Идентификация пользователя

После логина фронт отправляет `X-User-ID`. Если заголовок отсутствует, backend использует `DEFAULT_USER_EMAIL`.
