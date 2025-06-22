/*
  # Fix Goals RLS Policies

  1. Security
    - Remove recursive policies that cause infinite loops
    - Simplify RLS policies for goals table
    - Ensure proper access control without circular dependencies

  2. Changes
    - Drop existing problematic policies
    - Create new simplified policies
    - Fix relationship access patterns
*/

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can manage own goals" ON goals;
DROP POLICY IF EXISTS "Users can read friend challenges they participate in" ON goals;
DROP POLICY IF EXISTS "Users can read public challenges" ON goals;

-- Create new simplified policies
CREATE POLICY "Users can manage own goals"
  ON goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read public challenges"
  ON goals
  FOR SELECT
  TO authenticated
  USING (privacy_level = 'public_challenge');

CREATE POLICY "Users can read friend challenges they participate in"
  ON goals
  FOR SELECT
  TO authenticated
  USING (
    privacy_level = 'friends_challenge' 
    AND id IN (
      SELECT goal_id 
      FROM goal_collaborators 
      WHERE user_id = auth.uid() 
      AND status = 'accepted'
    )
  );