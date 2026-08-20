# Step 3B — Real Agent Pipeline Observability & Performance Manual Configuration Guide

This document specifies every environment variable required by the HireGenie AI autonomous recruitment platform, screening telemetry engine, and durable Celery task queue.

> [!IMPORTANT]
> **SECURITY DIRECTIVE**:
> Never expose real secrets or API keys in chat or git history. Save all production credentials in `backend/.env`.

---

## 1. Core & Database Configuration

### `DATABASE_URL`
- **WHERE TO PUT IT**: `backend/.env`
- **EXAMPLE**: `postgresql+psycopg2://postgres:password@localhost:5432/hiregenie_db`
- **WHERE TO GET IT**: PostgreSQL database server (AWS RDS, GCP Cloud SQL, Supabase, Neon, or local PostgreSQL instance).
- **LOCAL REQUIRED?**: Optional (Permits local SQLite fallback ONLY when `ENVIRONMENT=development`).
- **PRODUCTION REQUIRED?**: **YES (MANDATORY)**. Fail-fast `RuntimeError` is raised if missing in production.
- **RESTART REQUIRED?**: Yes.
- **Developer Action**:
  ```text
  Put your PostgreSQL connection string here:
  backend/.env
  DATABASE_URL=postgresql+psycopg2://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME
  ```

---

### `SECRET_KEY`
- **WHERE TO PUT IT**: `backend/.env`
- **EXAMPLE**: `SECRET_KEY=e8a49c...`
- **WHERE TO GET IT**: Generate using `python -c "import secrets; print(secrets.token_hex(32))"`.
- **LOCAL REQUIRED?**: Optional (Uses default dev key).
- **PRODUCTION REQUIRED?**: Yes.
- **RESTART REQUIRED?**: Yes.

---

### `GEMINI_API_KEY`
- **WHERE TO PUT IT**: `backend/.env`
- **EXAMPLE**: `GEMINI_API_KEY=AIzaSy...`
- **WHERE TO GET IT**: Google AI Studio (`https://aistudio.google.com/app/apikey`).
- **LOCAL REQUIRED?**: Optional (Falls back to explainable multi-criteria scoring if omitted).
- **PRODUCTION REQUIRED?**: Yes.
- **RESTART REQUIRED?**: Yes.
- **Developer Action**:
  ```text
  Put your own API key here:
  backend/.env
  GEMINI_API_KEY=YOUR_GEMINI_API_KEY
  ```

---

## 2. Durable Worker Queue & Redis (Step 7B / Step 3B)

### `REDIS_URL`
- **WHERE TO PUT IT**: `backend/.env`
- **EXAMPLE**: `REDIS_URL=redis://localhost:6379/0`
- **WHERE TO GET IT**: Local Redis service (`redis-server`) or cloud provider (Redis Cloud, Upstash).
- **LOCAL REQUIRED?**: Optional (In-process fallback active if disabled).
- **PRODUCTION REQUIRED?**: Yes.
- **RESTART REQUIRED?**: Yes.

---

### `CELERY_BROKER_URL`
- **WHERE TO PUT IT**: `backend/.env`
- **EXAMPLE**: `CELERY_BROKER_URL=redis://localhost:6379/0`
- **WHERE TO GET IT**: Redis or RabbitMQ broker URL.
- **LOCAL REQUIRED?**: Optional.
- **PRODUCTION REQUIRED?**: Yes.
- **RESTART REQUIRED?**: Yes.

---

### `CELERY_RESULT_BACKEND`
- **WHERE TO PUT IT**: `backend/.env`
- **EXAMPLE**: `CELERY_RESULT_BACKEND=redis://localhost:6379/0`
- **WHERE TO GET IT**: Redis server backend URL.
- **LOCAL REQUIRED?**: Optional.
- **PRODUCTION REQUIRED?**: Yes.
- **RESTART REQUIRED?**: Yes.

---

### `DURABLE_QUEUE_ENABLED`
- **WHERE TO PUT IT**: `backend/.env`
- **EXAMPLE**: `DURABLE_QUEUE_ENABLED=True`
- **WHERE TO GET IT**: Set `True` when Redis and Celery worker processes are active.
- **LOCAL REQUIRED?**: Optional.
- **PRODUCTION REQUIRED?**: Yes.
- **RESTART REQUIRED?**: Yes.

---

## 3. Communication & Email Delivery

### `EMAIL_PROVIDER`
- **WHERE TO PUT IT**: `backend/.env`
- **EXAMPLE**: `EMAIL_PROVIDER=resend` (Options: `auto`, `resend`, `smtp`, `sendgrid`)
- **WHERE TO GET IT**: Selected communication provider.
- **LOCAL REQUIRED?**: Optional.
- **PRODUCTION REQUIRED?**: Yes.
- **RESTART REQUIRED?**: Yes.

---

### `RESEND_API_KEY`
- **WHERE TO PUT IT**: `backend/.env`
- **EXAMPLE**: `RESEND_API_KEY=re_123456789`
- **WHERE TO GET IT**: Resend Dashboard (`https://resend.com/api-keys`).
- **LOCAL REQUIRED?**: Optional.
- **PRODUCTION REQUIRED?**: Yes (When `EMAIL_PROVIDER=resend`).
- **RESTART REQUIRED?**: Yes.
- **Developer Action**:
  ```text
  Put your own API key here:
  backend/.env
  RESEND_API_KEY=YOUR_RESEND_API_KEY
  ```

---

### `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD`
- **WHERE TO PUT IT**: `backend/.env`
- **EXAMPLE**: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=user@example.com`, `SMTP_PASSWORD=app_password`
- **WHERE TO GET IT**: Email provider settings.
- **LOCAL REQUIRED?**: Optional.
- **PRODUCTION REQUIRED?**: Yes (When `EMAIL_PROVIDER=smtp`).
- **RESTART REQUIRED?**: Yes.

---

### `SENDGRID_API_KEY`
- **WHERE TO PUT IT**: `backend/.env`
- **EXAMPLE**: `SENDGRID_API_KEY=SG.12345...`
- **WHERE TO GET IT**: SendGrid Dashboard.
- **LOCAL REQUIRED?**: Optional.
- **PRODUCTION REQUIRED?**: Yes (When `EMAIL_PROVIDER=sendgrid`).
- **RESTART REQUIRED?**: Yes.
