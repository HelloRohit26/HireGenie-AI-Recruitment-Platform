# Step 3 — Manual Environment & Infrastructure Configuration Guide

This document lists every environment variable used by the HireGenie AI autonomous agent pipeline, background workers, and telemetry engine.

> [!IMPORTANT]
> **API KEY & SECRET SECURITY NOTICE**:
> Never commit real secrets or credentials into repository source code or git history. All environment variables belong in `backend/.env`. Ensure `backend/.env` is listed in `.gitignore`.

---

## 1. Required Variables

### `DATABASE_URL`
- **File**: `backend/.env`
- **Example**: `postgresql+psycopg2://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME`
- **Value Source**: PostgreSQL database service provider (AWS RDS, GCP Cloud SQL, Supabase, Neon, or local PostgreSQL instance).
- **Required for Local**: Optional (Permits local SQLite fallback ONLY when `ENVIRONMENT=development`).
- **Required for Production**: **MANDATORY POSTGRESQL**. Fail-fast `RuntimeError` is raised if `DATABASE_URL` is omitted or configured with SQLite in production (`ENVIRONMENT=production`).
- **Restart Required**: Yes.

---

### `SECRET_KEY`
- **File**: `backend/.env`
- **Example**: `SECRET_KEY=YOUR_64_CHAR_HEX_STRING_HERE`
- **Value Source**: Generated using `python -c "import secrets; print(secrets.token_hex(32))"`.
- **Required for Local**: Optional (Uses dev secret).
- **Required for Production**: Yes.
- **Restart Required**: Yes.

---

### `GEMINI_API_KEY`
- **File**: `backend/.env`
- **Example**: `GEMINI_API_KEY=AIzaSy...`
- **Value Source**: Google AI Studio dashboard (`https://aistudio.google.com/app/apikey`).
- **Required for Local**: Yes (For live Gemini LLM evaluation; falls back to explainable multi-criteria engine if unconfigured).
- **Required for Production**: Yes.
- **Restart Required**: Yes.
- **Developer Action**:
  ```text
  Put your own API key here:
  backend/.env
  GEMINI_API_KEY=YOUR_GEMINI_API_KEY
  ```

---

## 2. Optional Asynchronous & Communication Variables

### `REDIS_URL` / `CELERY_BROKER_URL`
- **File**: `backend/.env`
- **Example**: `REDIS_URL=redis://localhost:6379/0`
- **Value Source**: Redis broker server or cloud provider (Redis Cloud, Upstash).
- **Required for Local**: Optional (Local eager worker fallback active if disabled).
- **Required for Production**: Yes (For durable queue operation).
- **Restart Required**: Yes.

---

### `DURABLE_QUEUE_ENABLED`
- **File**: `backend/.env`
- **Example**: `DURABLE_QUEUE_ENABLED=True`
- **Value Source**: Set `True` when Redis and Celery worker processes are active.
- **Required for Local**: Optional.
- **Required for Production**: Yes.
- **Restart Required**: Yes.

---

### `RESEND_API_KEY`
- **File**: `backend/.env`
- **Example**: `RESEND_API_KEY=re_123456789...`
- **Value Source**: Resend dashboard (`https://resend.com/api-keys`).
- **Required for Local**: Optional.
- **Required for Production**: Yes (If `EMAIL_PROVIDER=resend`).
- **Restart Required**: Yes.
