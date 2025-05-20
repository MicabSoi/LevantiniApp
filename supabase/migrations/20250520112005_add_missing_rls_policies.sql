/*
  Add missing RLS policies for user_progress and decks tables.
*/

-- Add INSERT and DELETE policies for user_progress
CREATE POLICY "Users can create their own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON user_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add DELETE policy for decks
-- (Assuming INSERT and UPDATE policies are already in a discarded migration)
CREATE POLICY "Users can delete their own decks"
  ON decks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
