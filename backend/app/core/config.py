from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "HireGenie AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "production"
    ALLOW_DEV_SQLITE_FALLBACK: bool = False
    DATABASE_URL: str = ""
    SECRET_KEY: str = "your_super_secret_key_change_this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days persistent session
    GEMINI_API_KEY: str = ""
    # Sarvam Conversational AI Voice Agent Settings
    SARVAM_API_KEY: str = ""
    SARVAM_ORG_ID: str = ""
    SARVAM_WORKSPACE_ID: str = ""
    SARVAM_APP_ID: str = ""
    SARVAM_TTS_SPEAKER: str = "anushka"
    
    # AI & Voice Provider Settings (Sarvam AI & LiveKit)
    SARVAM_API_KEY: str = ""
    SARVAM_TTS_SPEAKER: str = "anushka"
    LIVEKIT_URL: str = ""
    LIVEKIT_API_KEY: str = ""
    LIVEKIT_API_SECRET: str = ""
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"

    # Email Delivery Provider Settings
    EMAIL_PROVIDER: str = "auto"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@hiregenie.ai"
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = "noreply@hiregenie.ai"
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "onboarding@resend.dev"
    TEST_EMAIL_RECIPIENT: str = ""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()