-- Add wizard-specific fields to contracts table
-- Run this in the Supabase SQL editor

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS client_data2         JSONB,
  ADD COLUMN IF NOT EXISTS durata               INTEGER,
  ADD COLUMN IF NOT EXISTS data_incepere        DATE,
  ADD COLUMN IF NOT EXISTS comision             NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS vicii_cunoscute      TEXT,
  ADD COLUMN IF NOT EXISTS pret_minim           NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS clarificari          TEXT,
  ADD COLUMN IF NOT EXISTS cheltuieli_lunare    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS signwell_document_id TEXT;
