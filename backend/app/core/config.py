from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    FRONTEND_URL: str = "http://localhost:5173"
    # Comma-separated list of allowed browser origins for CORS (dev may use 127.0.0.1 or alternate ports)
    CORS_ORIGINS: str = ""

    def cors_origins(self) -> list[str]:
        if self.CORS_ORIGINS.strip():
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return [self.FRONTEND_URL]


settings = Settings()
