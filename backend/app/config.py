import os

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg2://waitlist:waitlist@localhost:5432/waitlist"
)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql://" + DATABASE_URL[len("postgres://"):]
