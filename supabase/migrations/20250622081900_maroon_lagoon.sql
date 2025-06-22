/*
  # Update profiles table RLS policy for public access

  1. Security Changes
    - Update the "Users can read all profiles" policy to allow public access
    - This enables non-authenticated users to read profile information for public goal feeds

  2. Changes
    - Drop existing policy "Users can read all profiles"
    - Create new policy "Users can read all profiles" with public access
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;

-- Create new policy that allows both public and authenticated users to read profiles
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO public, authenticated
  USING (true);