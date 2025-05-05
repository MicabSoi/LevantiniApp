import { supabase } from './supabaseClient';

// Fetch all distinct topics (lesson types), ordered by their lowest level
// lessonService.ts
import { supabase } from './supabaseClient';

export async function fetchLessonTopics() {
  const { data, error } = await supabase
    .from('topics')
    .select('id, label, description, level');

  if (error) throw error;
  return data;
}

// New: generic lesson fetch by type
// lessonService.ts
export async function fetchLessonsByLevel(level: number) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('level', level)
    .order('order_num', { ascending: true }); // ✅ sort by order_num

  if (error) throw error;
  return data;
}


