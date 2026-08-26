-- Produção: execute esta migração antes de publicar a API que usa preferências de tema.
BEGIN;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) NOT NULL DEFAULT 'dark';

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS account_status_reason VARCHAR(255);

DO $$
BEGIN
  ALTER TABLE usuarios
    ADD CONSTRAINT usuarios_theme_preference_check
    CHECK (theme_preference IN ('dark', 'light'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
