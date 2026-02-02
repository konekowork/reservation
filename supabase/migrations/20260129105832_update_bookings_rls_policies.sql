/*
  # Update bookings table RLS policies

  1. Changes
    - Drop the overly permissive INSERT policy that allows unrestricted access
    - Create a restrictive INSERT policy that disables direct inserts from clients
    - Keep SELECT policy for public access to view bookings
    - All inserts must go through the create-booking Edge Function which validates data

  2. Security
    - RLS policies now properly restrict direct database access
    - All booking creation goes through Edge Function with server-side validation
    - Prevents bypass of business logic validation
*/

DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;

CREATE POLICY "Bookings created via API only"
  ON bookings
  FOR INSERT
  TO anon
  WITH CHECK (false);
