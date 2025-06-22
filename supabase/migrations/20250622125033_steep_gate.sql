/*
  # Enhanced Goal Tracking System

  1. New Features
    - Add countable tracking with quantity/duration inputs
    - Add challenge participation system
    - Add goal metrics for different measurement units
    - Enhanced privacy controls for goals

  2. New Tables
    - `goal_participants` - Track challenge participation
    - `goal_metrics` - Define measurement units

  3. Updates to existing tables
    - `goals` - Add countable toggle, challenge settings, privacy controls
    - `goal_entries` - Add quantity, duration, and notes tracking

  4. Security
    - Update RLS policies for challenge visibility
    - Enable proper access controls for participants

  5. Performance
    - Add indexes for efficient queries
    - Create triggers for automatic progress tracking
*/

-- Add new columns to goals table
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

  -- Add privacy level (separate from goal_type which is for tracking type)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'privacy_level'
  ) THEN
    ALTER TABLE goals ADD COLUMN privacy_level text DEFAULT 'private' CHECK (privacy_level IN ('private', 'friends_challenge', 'public_challenge'));
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

  -- Add is_challenge flag for easier querying
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'is_challenge'
  ) THEN
    ALTER TABLE goals ADD COLUMN is_challenge boolean DEFAULT false;
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

-- Insert default metrics
INSERT INTO goal_metrics (name, unit, description, category) VALUES
  ('Completions', 'times', 'Number of times completed', 'general'),
  ('Duration', 'minutes', 'Time spent in minutes', 'time'),
  ('Distance', 'km', 'Distance covered in kilometers', 'fitness'),
  ('Pages', 'pages', 'Number of pages read/written', 'learning'),
  ('Exercises', 'reps', 'Number of repetitions', 'fitness'),
  ('Sessions', 'sessions', 'Number of sessions completed', 'general'),
  ('Hours', 'hours', 'Time spent in hours', 'time'),
  ('Steps', 'steps', 'Number of steps taken', 'fitness'),
  ('Calories', 'kcal', 'Calories burned or consumed', 'health'),
  ('Words', 'words', 'Number of words written', 'writing')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE goal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_metrics ENABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "Users can read accessible goals" ON goals;

CREATE POLICY "Users can read accessible goals"
  ON goals
  FOR SELECT
  TO authenticated
  USING (
    -- Own goals
    auth.uid() = user_id OR
    -- Public challenges
    privacy_level = 'public_challenge' OR
    -- Friend challenges they're invited to
    (privacy_level = 'friends_challenge' AND EXISTS (
      SELECT 1 FROM goal_collaborators 
      WHERE goal_collaborators.goal_id = goals.id 
      AND goal_collaborators.user_id = auth.uid()
      AND goal_collaborators.status = 'accepted'
    ))
  );

-- Update goal_entries RLS policies for challenge visibility
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goal_participants_goal_id ON goal_participants(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_participants_user_id ON goal_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_participants_status ON goal_participants(status);
CREATE INDEX IF NOT EXISTS idx_goals_privacy_level ON goals(privacy_level);
CREATE INDEX IF NOT EXISTS idx_goals_is_countable ON goals(is_countable);
CREATE INDEX IF NOT EXISTS idx_goals_is_challenge ON goals(is_challenge);
CREATE INDEX IF NOT EXISTS idx_goal_entries_quantity ON goal_entries(quantity);

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

-- Create trigger for automatic progress updates
DROP TRIGGER IF EXISTS update_participant_progress_trigger ON goal_entries;
CREATE TRIGGER update_participant_progress_trigger
  AFTER INSERT ON goal_entries
  FOR EACH ROW EXECUTE FUNCTION update_participant_progress();

-- Update existing goals to set default privacy levels based on goal_type
UPDATE goals SET 
  privacy_level = CASE 
    WHEN goal_type = 'friends' THEN 'friends_challenge'
    WHEN goal_type = 'public' THEN 'public_challenge'
    ELSE 'private'
  END,
  is_challenge = CASE 
    WHEN goal_type IN ('friends', 'public') THEN true
    ELSE false
  END
WHERE privacy_level IS NULL OR is_challenge IS NULL;