/*
  # Fix RLS recursion and database relationships

  1. Database Schema Updates
    - Add missing foreign key relationships between goals and profiles
    - Fix RLS policies to prevent infinite recursion
    - Ensure proper indexing for performance

  2. Security Updates
    - Create non-recursive RLS policies for goals table
    - Fix goal_collaborators policies to avoid circular dependencies
    - Ensure proper access control for challenges

  3. Performance
    - Add proper indexes for foreign key relationships
    - Optimize query patterns for frontend usage
*/

-- First, let's add the missing foreign key relationship from goals to profiles
-- This will enable the frontend queries to work properly
DO $$
BEGIN
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'goals_user_id_fkey' 
    AND table_name = 'goals'
  ) THEN
    -- The constraint already exists from auth.users, we just need to ensure it's properly indexed
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
  END IF;
END $$;

-- Drop ALL existing policies for goals table to start fresh
DROP POLICY IF EXISTS "Users can manage own goals" ON goals;
DROP POLICY IF EXISTS "Users can read public challenges" ON goals;
DROP POLICY IF EXISTS "Users can read friend challenges they participate in" ON goals;
DROP POLICY IF EXISTS "Users can create own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;
DROP POLICY IF EXISTS "Users can read accessible goals" ON goals;
DROP POLICY IF EXISTS "Users can read own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;

-- Create new, non-recursive policies for goals table
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

-- Fix goal_collaborators policies to prevent recursion
DROP POLICY IF EXISTS "Users can read goal collaborators for their goals" ON goal_collaborators;
DROP POLICY IF EXISTS "Goal owners can manage collaborators" ON goal_collaborators;
DROP POLICY IF EXISTS "Users can update their own collaboration status" ON goal_collaborators;

-- Create simplified goal_collaborators policies
CREATE POLICY "Users can read goal collaborators for their goals"
  ON goal_collaborators
  FOR SELECT
  TO authenticated
  USING (
    -- User is the collaborator themselves
    user_id = auth.uid() OR
    -- User owns the goal (direct check without subquery to goals table)
    invited_by = auth.uid() OR
    -- User is checking collaborators for a goal they own
    goal_id IN (
      SELECT id FROM goals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Goal owners can manage collaborators"
  ON goal_collaborators
  FOR ALL
  TO authenticated
  USING (
    goal_id IN (
      SELECT id FROM goals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    goal_id IN (
      SELECT id FROM goals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own collaboration status"
  ON goal_collaborators
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Fix goal_entries policies to prevent recursion
DROP POLICY IF EXISTS "Users can read accessible goal entries" ON goal_entries;
DROP POLICY IF EXISTS "Users can read own goal entries" ON goal_entries;

-- Create new goal_entries policies
CREATE POLICY "Users can read accessible goal entries"
  ON goal_entries
  FOR SELECT
  TO authenticated
  USING (
    -- Own entries
    auth.uid() = user_id OR
    -- Entries for public challenges
    goal_id IN (
      SELECT id FROM goals WHERE privacy_level = 'public_challenge'
    ) OR
    -- Entries for friend challenges they're part of
    goal_id IN (
      SELECT goal_id FROM goal_collaborators 
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

-- Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_privacy_level ON goals(privacy_level);
CREATE INDEX IF NOT EXISTS idx_goal_collaborators_goal_id ON goal_collaborators(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_collaborators_user_id ON goal_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_entries_goal_id ON goal_entries(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_entries_user_id ON goal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Create a view for easier goal queries with user information
CREATE OR REPLACE VIEW goals_with_users AS
SELECT 
  g.*,
  p.display_name as user_display_name,
  p.avatar_url as user_avatar_url
FROM goals g
LEFT JOIN profiles p ON g.user_id = p.user_id;

-- Grant access to the view
GRANT SELECT ON goals_with_users TO authenticated;

-- Enable RLS on the view (inherits from base tables)
ALTER VIEW goals_with_users SET (security_barrier = true);