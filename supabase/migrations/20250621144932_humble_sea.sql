/*
  # Add comment column to goal_entries table

  1. Changes
    - Add `comment` column to `goal_entries` table
      - `comment` (text, nullable) - Optional comment for goal entries

  2. Security
    - No changes to RLS policies needed as existing policies will cover the new column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_entries' AND column_name = 'comment'
  ) THEN
    ALTER TABLE goal_entries ADD COLUMN comment text;
  END IF;
END $$;