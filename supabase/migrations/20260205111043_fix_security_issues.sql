/*
  # Fix Security Issues

  ## Changes
  
  1. **Remove Unused Index**
     - Drop `idx_bookings_lookup` index as it has not been used
     - The query pattern may benefit from a more specific index in the future if needed
  
  2. **Remove Overly Permissive RLS Policy**
     - Drop the `Enable all access for service role` policy that uses USING (true)
     - This policy bypasses all row-level security checks
     - The edge function uses the service role key which bypasses RLS by default
     - No client-side policies are needed since all operations go through the edge function
  
  ## Security Impact
  
  After this migration:
  - RLS remains enabled on the bookings table
  - No direct client access is permitted (secure by default)
  - All operations must go through the edge function with service role authentication
  - This ensures proper validation and business logic enforcement
*/

-- Drop the unused index
DROP INDEX IF EXISTS public.idx_bookings_lookup;

-- Drop the overly permissive RLS policy
DROP POLICY IF EXISTS "Enable all access for service role" ON public.bookings;

-- No new policies are added because:
-- 1. The edge function uses service role key, which bypasses RLS
-- 2. Direct client access should not be permitted for data integrity
-- 3. All bookings must go through the validation logic in the edge function
