from app.db.base import Base
from app.db.database import engine
import app.models


Base.metadata.create_all(bind=engine)

# print(Base.metadata.tables.keys())
print("Tables created successfully")