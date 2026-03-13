-- ============================================================================
-- Migration 00010: Change integration credentials to encrypted text
-- ============================================================================
-- The credentials column previously stored JSON objects. Now it stores
-- AES-256-GCM encrypted strings (iv:authTag:ciphertext format).
-- Changing from jsonb → text to properly hold encrypted opaque strings.
-- ============================================================================

ALTER TABLE integrations ALTER COLUMN credentials TYPE text USING credentials::text;
ALTER TABLE integrations ALTER COLUMN credentials SET DEFAULT '';
