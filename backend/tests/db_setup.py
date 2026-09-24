from urllib.parse import urlsplit, urlunsplit

import psycopg2
from psycopg2 import errors
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DEFAULT_TEST_DATABASE_URL = (
    "postgresql+psycopg2://waitlist:waitlist@localhost:5432/waitlist_test"
)


def ensure_test_database(url: str = DEFAULT_TEST_DATABASE_URL) -> str:
    parts = urlsplit(url)
    dbname = parts.path.lstrip("/") or "waitlist_test"
    maintenance = urlunsplit((parts.scheme, parts.netloc, "/postgres", "", ""))
    conn = psycopg2.connect(maintenance.replace("+psycopg2", ""))
    try:
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        with conn.cursor() as cur:
            try:
                cur.execute(f'CREATE DATABASE "{dbname}"')
            except errors.DuplicateDatabase:
                pass
    finally:
        conn.close()
    return url
