/*
  # Complete MindStory Update - Friends Management and Avatar System

  1. New Tables
    - `profiles` - User profiles with avatars and display names
    - `goal_collaborators` - Manage goal collaborations and roles
    - `goal_invites` - Handle external invitations via email/phone

  2. Updates to existing tables
    - `goals` - Add goal_type, frequency, total_target, end_date, weekdays
    - Enhanced goal management capabilities

  3. Security
    - Enable RLS on all new tables
    - Add comprehensive policies for data access
    - Ensure proper user isolation and collaboration permissions

  4. Storage
    - Create avatars bucket for user profile pictures
    - Set up proper storage policies
*/

-- Create profiles table for user avatars and display names
CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create goal_collaborators table for friends management
CREATE TABLE IF NOT EXISTS goal_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(goal_id, user_id)
);

-- Create goal_invites table for external invitations
CREATE TABLE IF NOT EXISTS goal_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  invite_code text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  invited_contact text NOT NULL, -- email or phone
  invited_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired')),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now()
);

-- Add new columns to goals table
DO $$
BEGIN
  -- Add goal_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'goal_type'
  ) THEN
    ALTER TABLE goals ADD COLUMN goal_type text DEFAULT 'private' CHECK (goal_type IN ('private', 'friends', 'public'));
  END IF;

  -- Add frequency column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'frequency'
  ) THEN
    ALTER TABLE goals ADD COLUMN frequency integer;
  END IF;

  -- Add total_target column (rename existing target_absolute if needed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'total_target'
  ) THEN
    ALTER TABLE goals ADD COLUMN total_target integer;
  END IF;

  -- Add end_date column (rename existing deadline if needed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE goals ADD COLUMN end_date date;
  END IF;

  -- Add weekdays column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'weekdays'
  ) THEN
    ALTER TABLE goals ADD COLUMN weekdays text[];
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_invites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Goal collaborators policies
CREATE POLICY "Users can read goal collaborators for their goals"
  ON goal_collaborators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_collaborators.goal_id 
      AND goals.user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Goal owners can manage collaborators"
  ON goal_collaborators
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_collaborators.goal_id 
      AND goals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_collaborators.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own collaboration status"
  ON goal_collaborators
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Goal invites policies
CREATE POLICY "Users can read invites for their goals"
  ON goal_invites
  FOR SELECT
  TO authenticated
  USING (
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_invites.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Goal owners can manage invites"
  ON goal_invites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_invites.goal_id 
      AND goals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_invites.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_collaborators_goal_id ON goal_collaborators(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_collaborators_user_id ON goal_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_invites_goal_id ON goal_invites(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_invites_invite_code ON goal_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_goals_goal_type ON goals(goal_type);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'display_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();