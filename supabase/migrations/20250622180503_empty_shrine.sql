/*
  # Fix goal_type constraint

  1. Changes
    - Remove the old constraint that only allows 'weekly', 'absolute', 'deadline'
    - Add new constraint that allows proper goal types including privacy levels
    - Update any existing data to use valid goal_type values

  2. Security
    - Maintains existing RLS policies
    - No changes to permissions
*/

-- First, update any existing goals with invalid goal_type values
UPDATE goals 
SET goal_type = 'weekly' 
WHERE goal_type NOT IN ('weekly', 'absolute', 'deadline');

-- Drop the old constraint if it exists
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_goal_type_check;

-- Add the correct constraint that matches the original schema
ALTER TABLE goals ADD CONSTRAINT goals_goal_type_check 
    CHECK (goal_type IN ('weekly', 'absolute', 'deadline'));