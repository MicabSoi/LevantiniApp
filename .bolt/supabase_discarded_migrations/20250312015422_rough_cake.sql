/*
  # Task Posting Schema

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key) 
      - `title` (text) - Task title
      - `description` (text) - Detailed task description
      - `budget` (numeric) - Task budget
      - `status` (text) - Task status (open, assigned, completed)
      - `required_skills` (text[]) - Array of required skills
      - `deadline` (timestamptz) - Task deadline
      - `created_at` (timestamptz)
      - `user_id` (uuid) - Reference to auth.users
    
    - `proposals`
      - `id` (uuid, primary key)
      - `task_id` (uuid) - Reference to tasks
      - `user_id` (uuid) - Reference to auth.users
      - `price` (numeric) - Proposed price
      - `description` (text) - Proposal description
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Tasks viewable by all, but only editable by owner
    - Proposals viewable by task owner and proposal creator
*/

-- Create tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  budget numeric NOT NULL CHECK (budget > 0),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'completed')),
  required_skills text[] NOT NULL DEFAULT '{}',
  deadline timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create proposals table
CREATE TABLE proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price numeric NOT NULL CHECK (price > 0),
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Tasks are viewable by everyone" 
  ON tasks FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Tasks can be created by authenticated users" 
  ON tasks FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tasks can be updated by owner" 
  ON tasks FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Tasks can be deleted by owner" 
  ON tasks FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Proposals policies
CREATE POLICY "Proposals are viewable by task owner and creator" 
  ON proposals FOR SELECT 
  TO authenticated 
  USING (
    auth.uid() IN (
      SELECT user_id FROM tasks WHERE id = task_id
      UNION
      SELECT user_id FROM proposals WHERE id = proposals.id
    )
  );

CREATE POLICY "Proposals can be created by authenticated users" 
  ON proposals FOR INSERT 
  TO authenticated 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = task_id 
      AND status = 'open'
    )
  );

CREATE POLICY "Proposals can be updated by creator" 
  ON proposals FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Proposals can be deleted by creator" 
  ON proposals FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX tasks_user_id_idx ON tasks(user_id);
CREATE INDEX tasks_status_idx ON tasks(status);
CREATE INDEX proposals_task_id_idx ON proposals(task_id);
CREATE INDEX proposals_user_id_idx ON proposals(user_id);