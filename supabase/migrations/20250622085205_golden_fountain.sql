/*
  # Fix Profile and Storage RLS Policies

  1. Security Updates
    - Add RLS policies for profiles table to allow authenticated users to manage their own profiles
    - Add storage policies for avatars bucket to allow authenticated users to upload their own avatars
  
  2. Profile Table Policies
    - Enable users to insert their own profile
    - Enable users to update their own profile
    - Enable users to read their own profile
  
  3. Storage Policies
    - Allow authenticated users to upload avatars to their own folder
    - Allow authenticated users to read avatars
*/

-- Ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;

-- Create comprehensive RLS policies for profiles table
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own avatar" ON storage.objects;

-- Create storage policies for avatars bucket
CREATE POLICY "Allow authenticated users to upload their own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to read avatars"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Allow users to update their own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to delete their own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );