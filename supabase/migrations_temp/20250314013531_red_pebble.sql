/*
  # Update lessons table schema

  1. Changes
    - Change lesson_group column from integer to text to support string values like 'alphabet'
    
  2. Data Migration
    - Safely converts existing integer values to text
    - Preserves existing data
*/

-- First create a temporary column
ALTER TABLE lessons 
ADD COLUMN lesson_group_new text;

-- Copy data from old column to new, converting integers to text
UPDATE lessons 
SET lesson_group_new = lesson_group::text;

-- Drop the old column
ALTER TABLE lessons 
DROP COLUMN lesson_group;

-- Rename the new column to the original name
ALTER TABLE lessons 
RENAME COLUMN lesson_group_new TO lesson_group;

-- Add NOT NULL constraint if it was present on the original column
ALTER TABLE lessons 
ALTER COLUMN lesson_group SET NOT NULL;