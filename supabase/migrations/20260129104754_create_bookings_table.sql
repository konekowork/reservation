/*
  # Create bookings table for coworking space reservation

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key) - Unique identifier for each booking
      - `first_name` (text) - User's first name
      - `last_name` (text) - User's last name
      - `email` (text) - User's email address
      - `booking_date` (date) - Date of the reservation
      - `arrival_time` (time) - Time of arrival
      - `departure_time` (time) - Time of departure
      - `cost` (decimal) - Calculated cost for the reservation
      - `created_at` (timestamptz) - Timestamp when booking was created

  2. Security
    - Enable RLS on `bookings` table
    - Add policy to allow anyone to insert bookings
    - Add policy to allow anyone to view bookings (for display purposes)

  3. Important Notes
    - Cost is calculated based on hourly rate (€15/hour)
    - All fields are required for a valid booking
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  booking_date date NOT NULL,
  arrival_time time NOT NULL,
  departure_time time NOT NULL,
  cost decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create bookings"
  ON bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view bookings"
  ON bookings
  FOR SELECT
  TO anon
  USING (true);