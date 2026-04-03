-- Add data_nastere column to contracts table for CNP-extracted birth date
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS data_nastere DATE;
