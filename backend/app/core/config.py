import re
import urllib.parse
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine.url import make_url


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""
    
    PROJECT_NAME: str = "Hackathon Starter API"
    PROJECT_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS Origins (default covers standard local frontend dev ports:
    # Vite 5173, CRA/Next 3000, Vue 8080, Angular 4200, Vite preview 4173)
    CORS_ORIGINS: Union[List[str], str] = [
        # Vite picks the next free port when 5173 is occupied, so cover the range
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:8080", "http://127.0.0.1:8080",
        "http://localhost:4200", "http://127.0.0.1:4200",
        "http://localhost:4173", "http://127.0.0.1:4173",
    ]

    # Dev escape hatch: set CORS_ALLOW_ALL=True in .env when your UI runs on a
    # port not listed above. Never leave this on for a public deployment.
    CORS_ALLOW_ALL: bool = False
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Primary Database Configuration (Supports Supabase or Local Docker PostgreSQL)
    DATABASE_URL: str = ""
    
    # Echo every SQL statement to stdout. Useful when debugging a query,
    # very noisy otherwise - so it's opt-in rather than tied to DEBUG.
    SQL_ECHO: bool = False

    # Optional Local Fallback Credentials (used only if DATABASE_URL is unset)
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "postgres"

    # LLM / Agent Layer Configuration (idea.md sections 3.1, 7)
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    CEREBRAS_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    CLOUDFLARE_API_TOKEN: str = ""
    CLOUDFLARE_ACCOUNT_ID: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = "gemini-2.0-flash"
    # Tier-1 router confidence below which the coordinator falls back to the LLM classifier
    ROUTER_CONFIDENCE_THRESHOLD: float = 0.6
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if not isinstance(v, str) or not v.strip():
            return ""
        
        cleaned = v.strip()
        
        # Strip accidental duplicate key prefix (e.g. DATABASE_URL=DATABASE_URL=...)
        if cleaned.startswith("DATABASE_URL="):
            cleaned = cleaned[len("DATABASE_URL="):].strip()
            
        # Strip surrounding double or single quotes
        if (cleaned.startswith('"') and cleaned.endswith('"')) or (cleaned.startswith("'") and cleaned.endswith("'")):
            cleaned = cleaned[1:-1].strip()
            
        # Normalize legacy 'postgres://' schema to 'postgresql://' for SQLAlchemy compatibility
        if cleaned.startswith("postgres://"):
            cleaned = "postgresql://" + cleaned[len("postgres://"):]
            
        # Validate or safely encode password special characters if needed
        try:
            make_url(cleaned)
            return cleaned
        except Exception:
            try:
                if "://" in cleaned and "@" in cleaned:
                    scheme_part, rest = cleaned.split("://", 1)
                    userinfo, hostinfo = rest.rsplit("@", 1)
                    if ":" in userinfo:
                        username, password = userinfo.split(":", 1)
                        unquoted_pwd = urllib.parse.unquote(password)
                        encoded_pwd = urllib.parse.quote_plus(unquoted_pwd)
                        cleaned = f"{scheme_part}://{username}:{encoded_pwd}@{hostinfo}"
            except Exception:
                pass
            return cleaned

    def get_database_url(self) -> str:
        """Returns the primary DATABASE_URL or constructs a local fallback."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    def get_masked_database_target(self) -> str:
        """Returns a safe representation of the database host/database without exposing credentials."""
        url = self.get_database_url()
        try:
            # Mask user:password while keeping host, port, db
            match = re.search(r"@([^/?#]+)(?:/([^?#]+))?", url)
            if match:
                host = match.group(1)
                db = match.group(2) or ""
                return f"{host}/{db}" if db else host
        except Exception:
            pass
        return "configured-database"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
