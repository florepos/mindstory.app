/*
  # Fix goal_entries table migration

  1. Updates to existing tables
    - The goal_entries table already exists but may need RLS and policies
    - Add missing indexes for performance
    - Ensure proper constraints and relationships

  2. Security
    - Enable RLS on goal_entries table if not already enabled
    - Add policies for authenticated users to manage their own entries

  3. Performance
    - Add indexes for common query patterns
    - Optimize for goal tracking and feed queries
*/

-- Enable RLS on goal_entries table if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'goal_entries' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE goal_entries ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies for goal_entries if they don't exist
DO $$
BEGIN
  -- Check and create SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'goal_entries' 
    AND policyname = 'Users can read own goal entries'
  ) THEN
    CREATE POLICY "Users can read own goal entries"
      ON goal_entries
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Check and create INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'goal_entries' 
    AND policyname = 'Users can create own goal entries'
  ) THEN
    CREATE POLICY "Users can create own goal entries"
      ON goal_entries
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check and create UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'goal_entries' 
    AND policyname = 'Users can update own goal entries'
  ) THEN
    CREATE POLICY "Users can update own goal entries"
      ON goal_entries
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check and create DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'goal_entries' 
    AND policyname = 'Users can delete own goal entries'
  ) THEN
    CREATE POLICY "Users can delete own goal entries"
      ON goal_entries
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for better performance (using completed_at which exists in the schema)
CREATE INDEX IF NOT EXISTS idx_goal_entries_goal_id ON goal_entries(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_entries_completed_at ON goal_entries(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_goal_entries_user_id ON goal_entries(user_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_goal_entries_user_goal_completed ON goal_entries(user_id, goal_id, completed_at DESC);

-- Add status constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'goal_entries_status_check'
  ) THEN
    ALTER TABLE goal_entries 
    ADD CONSTRAINT goal_entries_status_check 
    CHECK (status IN ('done', 'done_with_photo', 'not_done'));
  END IF;
END $$;