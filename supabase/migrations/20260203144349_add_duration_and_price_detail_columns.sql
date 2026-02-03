/*
  # Add duration and price_detail columns to bookings table

  1. Changes
    - Add `duration` column (numeric) to store duration in hours
    - Add `price_detail` column (text) to store pricing description

  2. Important Notes
    - Both columns are nullable to accommodate existing and future bookings
    - duration stores the total duration in hours
    - price_detail stores human-readable pricing information
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'duration'
  ) THEN
    ALTER TABLE bookings ADD COLUMN duration numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'price_detail'
  ) THEN
    ALTER TABLE bookings ADD COLUMN price_detail text;
  END IF;
END $$;
