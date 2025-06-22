/*
  # Create mottos table and goal photos storage

  1. New Tables
    - `mottos`
      - `id` (uuid, primary key)
      - `text` (text, the motto content)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Storage
    - Create `goal-photos` bucket for storing goal completion photos
    - Enable public access for goal photos

  3. Updates to existing tables
    - Add `photo_url` column to `goal_entries` table to store photo URLs

  4. Security
    - Enable RLS on `mottos` table
    - Add policies for authenticated users to manage their own mottos
    - Set up storage policies for goal photos
*/

-- Create mottos table
CREATE TABLE IF NOT EXISTS mottos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on mottos table
ALTER TABLE mottos ENABLE ROW LEVEL SECURITY;

-- Create policies for mottos
CREATE POLICY "Users can read own mottos"
  ON mottos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own mottos"
  ON mottos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mottos"
  ON mottos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mottos"
  ON mottos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add photo_url column to goal_entries table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_entries' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE goal_entries ADD COLUMN photo_url text;
  END IF;
END $$;

-- Create storage bucket for goal photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('goal-photos', 'goal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for goal photos
CREATE POLICY "Users can upload goal photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'goal-photos');

CREATE POLICY "Users can view goal photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'goal-photos');

CREATE POLICY "Users can update their goal photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'goal-photos');

CREATE POLICY "Users can delete their goal photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'goal-photos');