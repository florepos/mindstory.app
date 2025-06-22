/*
  # Fix Goals RLS Policies

  This migration fixes the infinite recursion issue in the goals table RLS policies.
  The problem was caused by duplicate or conflicting policies that created circular references.

  ## Changes Made
  1. Drop all existing policies for the goals table
  2. Recreate clean, non-conflicting policies
  3. Ensure no circular references in policy conditions

  ## Security
  - Users can only read their own goals
  - Users can read public challenges
  - Users can read friend challenges they're invited to
  - Users can only create, update, and delete their own goals
*/

-- Drop all existing policies for goals table
DROP POLICY IF EXISTS "Users can create own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;
DROP POLICY IF EXISTS "Users can read accessible goals" ON goals;
DROP POLICY IF EXISTS "Users can read own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;

-- Create clean, non-conflicting policies
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
    AND EXISTS (
      SELECT 1 
      FROM goal_collaborators 
      WHERE goal_collaborators.goal_id = goals.id 
        AND goal_collaborators.user_id = auth.uid() 
        AND goal_collaborators.status = 'accepted'
    )
  );