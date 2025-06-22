/*
  # Create mottos table and storage bucket

  1. New Tables
    - `mottos`
      - `id` (uuid, primary key)
      - `text` (text, the motto content)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)

  2. Storage
    - Create `goal-photos` bucket for storing goal completion photos
    - Enable public access for goal photos

  3. Security
    - Enable RLS on `mottos` table
    - Add policies for authenticated users to manage their own mottos
    - Storage policies will be managed through Supabase dashboard
*/

-- Create the mottos table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.mottos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mottos ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
  -- Check and create "Users can read own mottos" policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mottos' 
    AND policyname = 'Users can read own mottos'
  ) THEN
    CREATE POLICY "Users can read own mottos" 
      ON public.mottos 
      FOR SELECT 
      TO authenticated 
      USING (auth.uid() = user_id);
  END IF;

  -- Check and create "Users can create own mottos" policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mottos' 
    AND policyname = 'Users can create own mottos'
  ) THEN
    CREATE POLICY "Users can create own mottos" 
      ON public.mottos 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check and create "Users can update own mottos" policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mottos' 
    AND policyname = 'Users can update own mottos'
  ) THEN
    CREATE POLICY "Users can update own mottos" 
      ON public.mottos 
      FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check and create "Users can delete own mottos" policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mottos' 
    AND policyname = 'Users can delete own mottos'
  ) THEN
    CREATE POLICY "Users can delete own mottos" 
      ON public.mottos 
      FOR DELETE 
      TO authenticated 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create storage bucket for goal photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('goal-photos', 'goal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Note: Storage policies for the goal-photos bucket should be configured
-- through the Supabase dashboard or with appropriate permissions.
-- The bucket is created as public, so photos will be accessible via URL.