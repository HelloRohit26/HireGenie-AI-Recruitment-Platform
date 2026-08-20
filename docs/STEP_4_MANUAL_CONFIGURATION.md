# Step 4 — Shortlist, Email & Interview Invitation Configuration Guide

This document details the configuration requirements for email delivery providers, magic link resolution, token security, and interview invitation lifecycle management in HireGenie AI.

---

## 1. Environment Variables Configuration

To enable real email delivery to candidate inboxes upon candidate shortlisting, configure one of the supported email delivery providers in your `.env` file or deployment environment.

### Email Delivery Provider Selection
Set `EMAIL_PROVIDER` to one of:
- `resend` (Recommended for production & development)
- `sendgrid`
- `smtp`
- `auto` (Automatically picks the first available provider based on API keys)

```env
# Primary Email Provider Selection ("resend", "sendgrid", "smtp", or "auto")
EMAIL_PROVIDER=resend

# Resend REST API Configuration
RESEND_API_KEY=re_123456789_abcdefghijklmnopqrstuvwxyz
RESEND_FROM_EMAIL=onboarding@resend.dev

# SendGrid REST API Configuration (Alternative)
SENDGRID_API_KEY=SG.123456789_abcdefghijklmnopqrstuvwxyz
SENDGRID_FROM_EMAIL=noreply@hiregenie.ai

# SMTP Configuration (Alternative)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=recruitment@company.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=recruitment@company.com
SMTP_USE_TLS=True
SMTP_USE_SSL=False

# Frontend URL Configuration (Used for Magic Link Generation)
FRONTEND_URL=http://localhost:5173
```

> [!IMPORTANT]
> **Do NOT commit passwords or API keys to repository source control.** Store production secrets in environment management platforms (e.g. AWS Secrets Manager, Heroku Config Vars, Railway Variables).

---

## 2. Telemetry & Verification Endpoint

Verify actual runtime email provider configuration status via the HTTP API:

```http
GET /api/v1/communication/status
```

### Example Response (Configured):
```json
{
  "configured": true,
  "status": "EMAIL CONFIGURED",
  "active_provider": "resend",
  "unconfigured_reason": null
}
```

### Example Response (Unconfigured):
```json
{
  "configured": false,
  "status": "EMAIL NOT CONFIGURED",
  "active_provider": "none",
  "unconfigured_reason": "EMAIL NOT CONFIGURED — missing SMTP_HOST, SENDGRID_API_KEY, or RESEND_API_KEY"
}
```

---

## 3. Magic Link & Frontend Route Alignment

When a candidate is shortlisted:
1. HireGenie generates a cryptographically random invitation token (`secrets.token_urlsafe(32)`).
2. An `InterviewInvitation` record is created in PostgreSQL with initial status `INVITED`.
3. The email magic link is generated using the formula:
   ```
   {FRONTEND_URL}/interview/{invitation_token}/prep
   ```
4. Clicking the magic link opens the Candidate Preparation & Tech Check page (`InterviewPrepPage.tsx`).
5. Accessing the token endpoint (`GET /api/v1/interview/invitation/{token}`) transitions the state from `INVITED` → `VIEWED`.
6. Candidate clicking **"Accept & Continue"** invokes `POST /api/v1/interview/invitation/{token}/respond` (`action: ACCEPT`), transitioning status to `READY`.

---

## 4. Idempotency & Retry Safety

- **Single Invitation Rule**: `get_or_create_interview_invitation` prevents multiple invitation rows for the same application ID.
- **Single Email Log Rule**: `CommunicationAgent.send_communication` checks existing logs to prevent duplicate email dispatches on Celery task retries, candidate re-screening, or web page refreshes.
- **Rejected Candidate Protection**: Candidates whose applications are marked `REJECTED` receive `HTTP 403 Forbidden` if attempting token lookup.
- **Expired Token Enforcement**: Tokens past their `expires_at` timestamp return status `EXPIRED` (`expired: true`).
