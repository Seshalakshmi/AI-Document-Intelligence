from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "AI Document Intelligence"
    app_env: str = "development"
    database_url: str 
    upload_dir: str = "uploads"

    class Config:
        env_file: str = ".env"
    
settings = Settings()