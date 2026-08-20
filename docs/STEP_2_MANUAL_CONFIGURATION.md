# Step 2 — Manual Environment & Infrastructure Configuration Guide

This document lists every environment variable used by the HireGenie AI backend application, its configuration location, format, source, and requirement classification.

> [!IMPORTANT]
> **API KEY & SECRET SECURITY NOTICE**:
> Never commit actual passwords or API keys to source code or git repositories. All secret values must be placed in `backend/.env`. Ensure `backend/.env` is listed in `.gitignore`.

---

## 1. Database & Core Infrastructure Variables

### `DATABASE_URL`
- **File**: `backend/.env`
- **Example Format**:
  - PostgreSQL (Production / Staging): `postgresql+psycopg2://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME`
  - Local SQLite (Development fallback): `sqlite:///./hiregenie.db`
- **Value Source**: PostgreSQL database hosting service (e.g. AWS RDS, GCP Cloud SQL, Supabase, Neon, or local PostgreSQL instance).
- **Classification**: **REQUIRED** (Defaults to SQLite in local dev if omitted).
- **Restart Required**: **YES** (Backend server restart required).

---

### `SECRET_KEY`
- **File**: `backend/.env`
- **Example Format**: `SECRET_KEY=YOUR_GENERATED_64_CHAR_HEX_STRING`
- **Value Source**: Generated using cryptographic tool (`python -c "import secrets; print(secrets.token_hex(32))"`).
- **Classification**: **REQUIRED** for Production (Defaults to dev key if omitted).
- **Restart Required**: **YES** (Backend server restart required).

---

### `ALGORITHM`
- **File**: `backend/.env`
- **Example Format**: `ALGORITHM=HS256`
- **Value Source**: Standard JWT signature algorithm (`HS256`).
- **Classification**: **OPTIONAL** (Default: `HS256`).
- **Restart Required**: **YES**.

---

### `ACCESS_TOKEN_EXPIRE_MINUTES`
- **File**: `backend/.env`
- **Example Format**: `ACCESS_TOKEN_EXPIRE_MINUTES=60`
- **Value Source**: Integer number of minutes for JWT validity.
- **Classification**: **OPTIONAL** (Default: `30`).
- **Restart Required**: **YES**.

---

## 2. AI Intelligence Engine Variables

### `GEMINI_API_KEY`
- **File**: `backend/.env`
- **Example Format**: `GEMINI_API_KEY=AIzaSy...`
- **Value Source**: Obtain from Google AI Studio (`https://aistudio.google.com/app/apikey`).
- **Classification**: **REQUIRED** for AI LLM screening, dynamic ranking, and interview evaluation.
- **Developer Instructions**:
  ```text
  Add your own Gemini API key here:
  backend/.env
  GEMINI_API_KEY=YOUR_GEMINI_API_KEY
  ```
- **Restart Required**: **YES**.

---

## 3. Asynchronous Worker Queue & Cache (Celery + Redis)

### `REDIS_URL`
- **File**: `backend/.env`
- **Example Format**: `REDIS_URL=redis://localhost:6379/0` or `redis://:PASSWORD@HOST:6379/0`
- **Value Source**: Local Redis instance or managed Redis provider (e.g., Redis Cloud, Upstash).
- **Classification**: **REQUIRED** for durable Celery worker execution (Step 7B).
- **Restart Required**: **YES**.

---

### `DURABLE_QUEUE_ENABLED`
- **File**: `backend/.env`
- **Example Format**: `DURABLE_QUEUE_ENABLED=True`
- **Value Source**: Set `True` to route tasks via Celery worker; `False` for local fallback.
- **Classification**: **OPTIONAL** (Default: `False` in local dev).
- **Restart Required**: **YES**.

---

## 4. Email Communication Provider Variables

### `EMAIL_PROVIDER`
- **File**: `backend/.env`
- **Example Format**: `EMAIL_PROVIDER=resend` (Options: `auto`, `resend`, `smtp`, `sendgrid`)
- **Value Source**: Chosen email provider.
- **Classification**: **OPTIONAL** (Default: `auto`).
- **Restart Required**: **YES**.

---

### `RESEND_API_KEY`
- **File**: `backend/.env`
- **Example Format**: `RESEND_API_KEY=re_123456789...`
- **Value Source**: Obtain from Resend dashboard (`https://resend.com/api-keys`).
- **Classification**: **OPTIONAL** (Recommended for transactional emails).
- **Restart Required**: **YES**.

---

### `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD`
- **File**: `backend/.env`
- **Example Format**:
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your_email@gmail.com
  SMTP_PASSWORD=your_app_password
  ```
- **Value Source**: Email provider SMTP settings.
- **Classification**: **OPTIONAL**.
- **Restart Required**: **YES**.
