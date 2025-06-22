/*
  # Add RLS policies for goals table

  1. Security
    - Add policy for authenticated users to create their own goals
    - Add policy for authenticated users to read their own goals  
    - Add policy for authenticated users to update their own goals
    - Add policy for authenticated users to delete their own goals

  This migration adds the missing Row Level Security policies for the goals table
  to allow authenticated users to perform CRUD operations on their own goals.
*/

-- Policy for users to create their own goals
CREATE POLICY "Users can create own goals"
  ON goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to read their own goals
CREATE POLICY "Users can read own goals"
  ON goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to update their own goals
CREATE POLICY "Users can update own goals"
  ON goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own goals
CREATE POLICY "Users can delete own goals"
  ON goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);