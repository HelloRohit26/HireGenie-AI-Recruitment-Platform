"""Unified Email Delivery Service — Supporting Resend, SMTP, and SendGrid."""
import os
import json
import smtplib
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple, Optional, Dict, Any

from app.core.config import settings
from app.core.logger import logger


def get_active_provider_info() -> Tuple[str, Optional[str]]:
    """Determines the active email provider based on configuration settings.
    Returns (provider_name, error_reason_if_unconfigured).
    """
    provider = os.getenv("EMAIL_PROVIDER", settings.EMAIL_PROVIDER).lower()

    resend_key = os.getenv("RESEND_API_KEY", settings.RESEND_API_KEY)
    sendgrid_key = os.getenv("SENDGRID_API_KEY", settings.SENDGRID_API_KEY)
    smtp_host = os.getenv("SMTP_HOST", settings.SMTP_HOST)

    if provider == "resend" or (provider == "auto" and resend_key):
        if resend_key:
            return ("resend", None)
        return ("resend", "RESEND_API_KEY environment variable missing")

    if provider == "sendgrid" or (provider == "auto" and sendgrid_key):
        if sendgrid_key:
            return ("sendgrid", None)
        return ("sendgrid", "SENDGRID_API_KEY environment variable missing")

    if provider == "smtp" or (provider == "auto" and smtp_host):
        if smtp_host and (os.getenv("SMTP_USER", settings.SMTP_USER) or not os.getenv("SMTP_USE_AUTH", "True") == "True"):
            return ("smtp", None)
        return ("smtp", "SMTP_HOST or SMTP credentials environment variables missing")

    return ("none", "EMAIL NOT CONFIGURED — missing SMTP_HOST, SENDGRID_API_KEY, or RESEND_API_KEY")


def get_email_provider_status() -> Dict[str, Any]:
    """Exposes truthful configuration status for system telemetry."""
    provider_name, unconfigured_reason = get_active_provider_info()
    is_configured = (provider_name != "none" and unconfigured_reason is None)

    return {
        "configured": is_configured,
        "status": "EMAIL CONFIGURED" if is_configured else "EMAIL NOT CONFIGURED",
        "active_provider": provider_name,
        "unconfigured_reason": unconfigured_reason
    }


def send_via_resend(to_email: str, subject: str, body_text: str, body_html: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Sends email via Resend HTTP REST API."""
    api_key = os.getenv("RESEND_API_KEY", settings.RESEND_API_KEY)
    from_email = os.getenv("RESEND_FROM_EMAIL", settings.RESEND_FROM_EMAIL) or "onboarding@resend.dev"

    if not api_key:
        return (False, "RESEND_API_KEY is missing", None)

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "HireGenie-Backend/1.0"
    }

    payload = {
        "from": from_email,
        "to": [to_email],
        "subject": subject,
        "text": body_text,
        "html": body_html
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            email_id = res_body.get("id")
            logger.info(f"✅ [RESEND SUCCESS] Email sent to {to_email} | ID: {email_id}")
            return (True, None, email_id)
    except urllib.error.HTTPError as e:
        error_content = e.read().decode("utf-8") if e.fp else str(e)
        logger.error(f"❌ [RESEND HTTP ERROR {e.code}] {error_content}")
        return (False, f"Resend API Error ({e.code}): {error_content}", None)
    except Exception as e:
        logger.error(f"❌ [RESEND EXCEPTION] {str(e)}")
        return (False, f"Resend Connection Exception: {str(e)}", None)


def send_via_sendgrid(to_email: str, subject: str, body_text: str, body_html: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Sends email via SendGrid v3 REST API."""
    api_key = os.getenv("SENDGRID_API_KEY", settings.SENDGRID_API_KEY)
    from_email = os.getenv("SENDGRID_FROM_EMAIL", settings.SENDGRID_FROM_EMAIL) or "noreply@hiregenie.ai"

    if not api_key:
        return (False, "SENDGRID_API_KEY is missing", None)

    url = "https://api.sendgrid.com/v3/mail/send"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "HireGenie-Backend/1.0"
    }

    payload = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": from_email},
        "subject": subject,
        "content": [
            {"type": "text/plain", "value": body_text},
            {"type": "text/html", "value": body_html}
        ]
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as response:
            msg_id = response.headers.get("X-Message-Id") or "sendgrid-ok"
            logger.info(f"✅ [SENDGRID SUCCESS] Email sent to {to_email}")
            return (True, None, msg_id)
    except urllib.error.HTTPError as e:
        error_content = e.read().decode("utf-8") if e.fp else str(e)
        logger.error(f"❌ [SENDGRID HTTP ERROR {e.code}] {error_content}")
        return (False, f"SendGrid API Error ({e.code}): {error_content}", None)
    except Exception as e:
        logger.error(f"❌ [SENDGRID EXCEPTION] {str(e)}")
        return (False, f"SendGrid Connection Exception: {str(e)}", None)


def send_via_smtp(to_email: str, subject: str, body_text: str, body_html: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Sends email via SMTP server."""
    host = os.getenv("SMTP_HOST", settings.SMTP_HOST)
    port = int(os.getenv("SMTP_PORT", str(settings.SMTP_PORT)))
    user = os.getenv("SMTP_USER", settings.SMTP_USER)
    password = os.getenv("SMTP_PASSWORD", settings.SMTP_PASSWORD)
    from_email = os.getenv("SMTP_FROM_EMAIL", settings.SMTP_FROM_EMAIL) or user
    use_tls = os.getenv("SMTP_USE_TLS", str(settings.SMTP_USE_TLS)).lower() == "true"
    use_ssl = os.getenv("SMTP_USE_SSL", str(settings.SMTP_USE_SSL)).lower() == "true"

    if not host:
        return (False, "SMTP_HOST is missing", None)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email

    msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(body_html, "html"))

    try:
        if use_ssl:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            if use_tls:
                server.starttls()

        if user and password:
            server.login(user, password)

        server.sendmail(from_email, [to_email], msg.as_string())
        server.quit()

        logger.info(f"✅ [SMTP SUCCESS] Email sent to {to_email} via {host}:{port}")
        return (True, None, f"smtp-{host}-{port}")
    except Exception as e:
        logger.error(f"❌ [SMTP EXCEPTION] {str(e)}")
        return (False, f"SMTP Connection Exception: {str(e)}", None)


def send_real_email(to_email: str, subject: str, body_text: str, body_html: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[str]]:
    """Main entry point to physically deliver email through the configured provider."""
    html_content = body_html or f"<pre style='font-family: sans-serif; white-space: pre-wrap;'>{body_text}</pre>"
    provider_name, unconfigured_reason = get_active_provider_info()

    if provider_name == "none" or unconfigured_reason:
        return (False, unconfigured_reason or "EMAIL NOT CONFIGURED", None)

    if provider_name == "resend":
        return send_via_resend(to_email, subject, body_text, html_content)
    elif provider_name == "sendgrid":
        return send_via_sendgrid(to_email, subject, body_text, html_content)
    elif provider_name == "smtp":
        return send_via_smtp(to_email, subject, body_text, html_content)
    else:
        return (False, f"Unsupported email provider '{provider_name}'", None)
