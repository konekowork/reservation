/*
  # Add booking_type and status columns to bookings table

  1. Changes
    - Add `booking_type` column (text) with values 'coworking' or 'meeting_room'
    - Add `status` column (text) with default 'confirmed'
    - Add indexes for efficient capacity checking queries

  2. Indexes
    - Index on (booking_date, booking_type, status) for capacity checks
    - Index on (email, booking_date) for user queries

  3. Important Notes
    - Coworking: max 20 simultaneous people
    - Meeting room: no overlaps allowed
    - All bookings default to 'confirmed' status
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'booking_type'
  ) THEN
    ALTER TABLE bookings ADD COLUMN booking_type text DEFAULT 'coworking';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN status text DEFAULT 'confirmed';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_date_type_status 
  ON bookings(booking_date, booking_type, status);

CREATE INDEX IF NOT EXISTS idx_bookings_email_date 
  ON bookings(email, booking_date);
