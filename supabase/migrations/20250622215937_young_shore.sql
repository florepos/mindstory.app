/*
  # Enhanced Goals and Tracking System

  1. New Features
    - Countable goals with quantity tracking
    - Privacy levels (private, friends_challenge, public_challenge)
    - Challenge system with participants
    - Goal metrics for different measurement units
    - Enhanced goal entries with quantity and duration

  2. Security
    - RLS policies for challenge visibility
    - Participant management policies
    - Public challenge access controls

  3. Performance
    - Indexes for efficient queries
    - Automatic progress tracking
*/

-- Add new columns to goals table first
DO $$
BEGIN
  -- Add countable toggle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'is_countable'
  ) THEN
    ALTER TABLE goals ADD COLUMN is_countable boolean DEFAULT false;
  END IF;

  -- Add target metric unit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'target_unit'
  ) THEN
    ALTER TABLE goals ADD COLUMN target_unit text DEFAULT 'completions';
  END IF;

  -- Add privacy level column (separate from goal_type)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'privacy_level'
  ) THEN
    ALTER TABLE goals ADD COLUMN privacy_level text DEFAULT 'private';
  END IF;

  -- Add challenge settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'challenge_start_date'
  ) THEN
    ALTER TABLE goals ADD COLUMN challenge_start_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'challenge_end_date'
  ) THEN
    ALTER TABLE goals ADD COLUMN challenge_end_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'max_participants'
  ) THEN
    ALTER TABLE goals ADD COLUMN max_participants integer;
  END IF;

  -- Add is_challenge flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'is_challenge'
  ) THEN
    ALTER TABLE goals ADD COLUMN is_challenge boolean DEFAULT false;
  END IF;
END $$;

-- Update privacy_level based on existing goal_type values
UPDATE goals SET privacy_level = 'private' WHERE goal_type IN ('weekly', 'absolute', 'deadline') OR goal_type IS NULL;
UPDATE goals SET privacy_level = 'friends_challenge' WHERE goal_type = 'friends';
UPDATE goals SET privacy_level = 'public_challenge' WHERE goal_type = 'public';

-- Set is_challenge flag for challenge types
UPDATE goals SET is_challenge = true WHERE privacy_level IN ('friends_challenge', 'public_challenge');

-- Reset goal_type to standard values (keeping original constraint)
UPDATE goals SET goal_type = 'weekly' WHERE goal_type NOT IN ('weekly', 'absolute', 'deadline');

-- Add privacy level constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'goals_privacy_level_check' 
    AND table_name = 'goals'
  ) THEN
    ALTER TABLE goals ADD CONSTRAINT goals_privacy_level_check 
    CHECK (privacy_level IN ('private', 'friends_challenge', 'public_challenge'));
  END IF;
END $$;

-- Add quantity tracking to goal_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_entries' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE goal_entries ADD COLUMN quantity numeric DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_entries' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE goal_entries ADD COLUMN duration_minutes integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_entries' AND column_name = 'notes'
  ) THEN
    ALTER TABLE goal_entries ADD COLUMN notes text;
  END IF;
END $$;

-- Create goal_participants table for challenge participation
CREATE TABLE IF NOT EXISTS goal_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left', 'completed')),
  total_progress numeric DEFAULT 0,
  last_activity timestamptz,
  UNIQUE(goal_id, user_id)
);

-- Create goal_metrics table for measurement units
CREATE TABLE IF NOT EXISTS goal_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  unit text NOT NULL,
  description text,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

-- Insert default metrics (with conflict handling)
INSERT INTO goal_metrics (name, unit, description, category) VALUES
  ('Completions', 'completions', 'Number of times completed', 'general'),
  ('Minutes', 'minutes', 'Time spent in minutes', 'time'),
  ('Kilometers', 'km', 'Distance covered in kilometers', 'fitness'),
  ('Pages', 'pages', 'Number of pages read/written', 'learning'),
  ('Repetitions', 'reps', 'Number of repetitions', 'fitness'),
  ('Sessions', 'sessions', 'Number of sessions completed', 'general'),
  ('Hours', 'hours', 'Time spent in hours', 'time'),
  ('Steps', 'steps', 'Number of steps taken', 'fitness'),
  ('Calories', 'kcal', 'Calories burned or consumed', 'health'),
  ('Words', 'words', 'Number of words written', 'writing'),
  ('Liters', 'liters', 'Volume in liters', 'health'),
  ('Grams', 'grams', 'Weight in grams', 'nutrition'),
  ('Points', 'points', 'Score or points earned', 'general'),
  ('Chapters', 'chapters', 'Book chapters completed', 'learning'),
  ('Lessons', 'lessons', 'Lessons completed', 'learning')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE goal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can read participants for public challenges" ON goal_participants;
DROP POLICY IF EXISTS "Users can read participants for their friend challenges" ON goal_participants;
DROP POLICY IF EXISTS "Users can join public challenges" ON goal_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON goal_participants;
DROP POLICY IF EXISTS "Users can leave challenges" ON goal_participants;
DROP POLICY IF EXISTS "Anyone can read goal metrics" ON goal_metrics;

-- RLS Policies for goal_participants
CREATE POLICY "Users can read participants for public challenges"
  ON goal_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_participants.goal_id 
      AND goals.privacy_level = 'public_challenge'
    )
  );

CREATE POLICY "Users can read participants for their friend challenges"
  ON goal_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_participants.goal_id 
      AND (goals.user_id = auth.uid() OR goals.privacy_level = 'friends_challenge')
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Users can join public challenges"
  ON goal_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_participants.goal_id 
      AND goals.privacy_level IN ('public_challenge', 'friends_challenge')
    )
  );

CREATE POLICY "Users can update their own participation"
  ON goal_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges"
  ON goal_participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for goal_metrics
CREATE POLICY "Anyone can read goal metrics"
  ON goal_metrics
  FOR SELECT
  TO authenticated
  USING (true);

-- Update goals RLS policies for new privacy levels
DROP POLICY IF EXISTS "Select own goals" ON goals;
DROP POLICY IF EXISTS "Users can read own goals" ON goals;
DROP POLICY IF EXISTS "Select public challenges" ON goals;

CREATE POLICY "Select own goals"
  ON goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Select public challenges"
  ON goals
  FOR SELECT
  TO authenticated
  USING (privacy_level = 'public_challenge');

-- Update goal_entries RLS policies for challenge visibility
DROP POLICY IF EXISTS "Users can read own goal entries" ON goal_entries;
DROP POLICY IF EXISTS "Users can read accessible goal entries" ON goal_entries;

CREATE POLICY "Users can read accessible goal entries"
  ON goal_entries
  FOR SELECT
  TO authenticated
  USING (
    -- Own entries
    auth.uid() = user_id OR
    -- Entries for public challenges
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_entries.goal_id 
      AND goals.privacy_level = 'public_challenge'
    ) OR
    -- Entries for friend challenges they're part of
    EXISTS (
      SELECT 1 FROM goals 
      JOIN goal_collaborators ON goals.id = goal_collaborators.goal_id
      WHERE goals.id = goal_entries.goal_id 
      AND goals.privacy_level = 'friends_challenge'
      AND goal_collaborators.user_id = auth.uid()
      AND goal_collaborators.status = 'accepted'
    )
  );

-- Create indexes for performance (with IF NOT EXISTS equivalent)
DO $$
BEGIN
  -- Check and create indexes only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goal_participants_goal_id') THEN
    CREATE INDEX idx_goal_participants_goal_id ON goal_participants(goal_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goal_participants_user_id') THEN
    CREATE INDEX idx_goal_participants_user_id ON goal_participants(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goal_participants_status') THEN
    CREATE INDEX idx_goal_participants_status ON goal_participants(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goals_privacy_level') THEN
    CREATE INDEX idx_goals_privacy_level ON goals(privacy_level);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goals_is_challenge') THEN
    CREATE INDEX idx_goals_is_challenge ON goals(is_challenge);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goals_is_countable') THEN
    CREATE INDEX idx_goals_is_countable ON goals(is_countable);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goal_entries_quantity') THEN
    CREATE INDEX idx_goal_entries_quantity ON goal_entries(quantity);
  END IF;
END $$;

-- Function to update participant progress
CREATE OR REPLACE FUNCTION update_participant_progress()
RETURNS trigger AS $$
BEGIN
  -- Update participant progress when a new entry is added
  IF TG_OP = 'INSERT' AND NEW.status IN ('done', 'done_with_photo') THEN
    INSERT INTO goal_participants (goal_id, user_id, total_progress, last_activity)
    VALUES (NEW.goal_id, NEW.user_id, COALESCE(NEW.quantity, 1), NEW.completed_at)
    ON CONFLICT (goal_id, user_id) 
    DO UPDATE SET 
      total_progress = goal_participants.total_progress + COALESCE(NEW.quantity, 1),
      last_activity = NEW.completed_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic progress updates (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_participant_progress_trigger ON goal_entries;
CREATE TRIGGER update_participant_progress_trigger
  AFTER INSERT ON goal_entries
  FOR EACH ROW EXECUTE FUNCTION update_participant_progress();