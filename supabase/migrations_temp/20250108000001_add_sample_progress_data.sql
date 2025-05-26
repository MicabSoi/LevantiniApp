/*
  # Sample Progress Data

  This migration adds sample data for testing the progress system:
  - Sample lesson progress entries
  - Sample learned words entries
  - Sample user progress entries

  This is for development/testing purposes only.
*/

-- Insert sample lesson progress (only if lessons exist)
INSERT INTO lesson_progress (user_id, lesson_id, completed, score, completed_at)
SELECT 
  auth.uid(),
  l.id,
  true,
  CASE 
    WHEN random() > 0.7 THEN 90 + (random() * 10)::int
    WHEN random() > 0.4 THEN 70 + (random() * 20)::int
    ELSE 50 + (random() * 20)::int
  END,
  now() - (random() * interval '30 days')
FROM lessons l
WHERE auth.uid() IS NOT NULL
  AND random() > 0.6  -- Only complete ~40% of lessons
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- Insert sample learned words (only if vocabulary exists)
INSERT INTO learned_words (user_id, word_id, learned_at, strength, next_review)
SELECT 
  auth.uid(),
  v.id,
  now() - (random() * interval '30 days'),
  (1 + (random() * 4)::int),
  now() + (random() * interval '7 days')
FROM vocabulary_items v
WHERE auth.uid() IS NOT NULL
  AND random() > 0.7  -- Only learn ~30% of vocabulary
ON CONFLICT (user_id, word_id) DO NOTHING;

-- Create a function to initialize user progress when a user signs up
CREATE OR REPLACE FUNCTION initialize_user_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_progress (user_id, level, xp, streak, last_active, preferences)
  VALUES (
    NEW.id,
    1,
    0,
    0,
    now(),
    jsonb_build_object(
      'daily_goal', 10,
      'notifications', true,
      'theme', 'light'
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically initialize progress for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_progress();

-- Update existing users who don't have progress records
INSERT INTO user_progress (user_id, level, xp, streak, last_active, preferences)
SELECT 
  id,
  1,
  0,
  0,
  now(),
  jsonb_build_object(
    'daily_goal', 10,
    'notifications', true,
    'theme', 'light'
  )
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_progress WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING; 