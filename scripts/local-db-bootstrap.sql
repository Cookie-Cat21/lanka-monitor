-- Runs once on fresh docker volume (docker-entrypoint-initdb.d).
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'lanka_local_dev';
GRANT anon, authenticated, service_role TO authenticator;
GRANT USAGE ON SCHEMA public, extensions TO anon, authenticated, service_role, authenticator;
