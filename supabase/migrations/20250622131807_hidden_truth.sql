/*
  # Fix Goals Table RLS Policies

  1. Security Updates
    - Drop all existing conflicting policies on goals table
    - Create clean, simple policies that avoid recursion
    - Add policy for public goals visibility

  2. Changes
    - Enable RLS on goals table
    - Create non-recursive policies for goals access
    - Add public goals access policy
*/

-- Ensure RLS is enabled on goals table
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can read public challenges" ON public.goals;
DROP POLICY IF EXISTS "Users can read friend challenges they participate in" ON public.goals;
DROP POLICY IF EXISTS "Users can create own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can read accessible goals" ON public.goals;
DROP POLICY IF EXISTS "Users can read own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Select own goals" ON public.goals;
DROP POLICY IF EXISTS "Insert own goals" ON public.goals;
DROP POLICY IF EXISTS "Update own goals" ON public.goals;
DROP POLICY IF EXISTS "Delete own goals" ON public.goals;
DROP POLICY IF EXISTS "Select public goals" ON public.goals;

-- Create new, clean policies
CREATE POLICY "Select own goals"
  ON public.goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Insert own goals"
  ON public.goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own goals"
  ON public.goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Delete own goals"
  ON public.goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add policy for public goals (if is_public column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'is_public'
  ) THEN
    CREATE POLICY "Select public goals"
      ON public.goals
      FOR SELECT
      TO authenticated
      USING (is_public = true);
  END IF;
END $$;

-- Add policy for public challenges (if privacy_level column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'privacy_level'
  ) THEN
    CREATE POLICY "Select public challenges"
      ON public.goals
      FOR SELECT
      TO authenticated
      USING (privacy_level = 'public_challenge');
  END IF;
END $$;