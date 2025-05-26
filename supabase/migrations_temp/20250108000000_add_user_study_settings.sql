/*
  # User Study Settings Schema

  1. New Table
    - `user_study_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Reference to auth.users
      - `study_direction` (text) - 'en-ar' or 'ar-en'
      - `show_transliteration` (boolean) - Whether to show transliteration
      - `hotkeys` (jsonb) - Hotkey settings
      - `hotkey_behavior` (text) - 'double-press' or 'single-press'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. RPC Function
    - `get_or_create_user_settings()` - Returns user settings or creates default ones

  3. Security
    - Enable RLS on user_study_settings table
    - Users can only access their own settings
*/

-- Create user_study_settings table
CREATE TABLE user_study_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  study_direction text NOT NULL DEFAULT 'en-ar' CHECK (study_direction IN ('en-ar', 'ar-en')),
  show_transliteration boolean NOT NULL DEFAULT true,
  hotkeys jsonb NOT NULL DEFAULT '{
    "undo": "z",
    "next": " ",
    "quality0": "1",
    "quality1": "2",
    "quality2": "3",
    "quality3": "4"
  }'::jsonb,
  hotkey_behavior text NOT NULL DEFAULT 'double-press' CHECK (hotkey_behavior IN ('double-press', 'single-press')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE user_study_settings ENABLE ROW LEVEL SECURITY;

-- User study settings policies
CREATE POLICY "Users can view their own study settings"
  ON user_study_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study settings"
  ON user_study_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study settings"
  ON user_study_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RPC function to get or create user settings
CREATE OR REPLACE FUNCTION get_or_create_user_settings()
RETURNS user_study_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_settings user_study_settings;
  current_user_id uuid;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Try to get existing settings
  SELECT * INTO user_settings
  FROM user_study_settings
  WHERE user_id = current_user_id;
  
  -- If no settings exist, create default ones
  IF NOT FOUND THEN
    INSERT INTO user_study_settings (user_id)
    VALUES (current_user_id)
    RETURNING * INTO user_settings;
  END IF;
  
  RETURN user_settings;
END;
$$; 