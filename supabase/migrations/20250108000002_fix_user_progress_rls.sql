-- Fix Row Level Security policies for user_progress table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;

-- Enable RLS on user_progress table
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for user_progress table
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_progress.user_id);

CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Also fix lesson_progress table if it has similar issues
DROP POLICY IF EXISTS "Users can view own lesson progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can insert own lesson progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can update own lesson progress" ON lesson_progress;

-- Enable RLS on lesson_progress table
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for lesson_progress table
CREATE POLICY "Users can view own lesson progress" ON lesson_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lesson progress" ON lesson_progress
    FOR INSERT WITH CHECK (auth.uid() = lesson_progress.user_id);

CREATE POLICY "Users can update own lesson progress" ON lesson_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for upsert operations (which combines insert and update)
CREATE POLICY "Users can upsert own lesson progress" ON lesson_progress
    FOR ALL USING (auth.uid() = user_id);

-- Also ensure learned_words table has proper RLS if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'learned_words') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own learned words" ON learned_words;
        DROP POLICY IF EXISTS "Users can insert own learned words" ON learned_words;
        DROP POLICY IF EXISTS "Users can update own learned words" ON learned_words;
        
        -- Enable RLS
        ALTER TABLE learned_words ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view own learned words" ON learned_words
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can insert own learned words" ON learned_words
            FOR INSERT WITH CHECK (auth.uid() = learned_words.user_id);
            
        CREATE POLICY "Users can update own learned words" ON learned_words
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$; 