export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vocabulary_items: {
        Row: {
          id: string
          arabic: string
          transliteration: string
          translation: string
          context: string | null
          examples: Json | null
          audio_url: string | null
          category: string[] | null
          created_at: string | null
        }
        Insert: {
          id?: string
          arabic: string
          transliteration: string
          translation: string
          context?: string | null
          examples?: Json | null
          audio_url?: string | null
          category?: string[] | null
          created_at?: string | null
        }
        Update: {
          id?: string
          arabic?: string
          transliteration?: string
          translation?: string
          context?: string | null
          examples?: Json | null
          audio_url?: string | null
          category?: string[] | null
          created_at?: string | null
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string | null
          level: number | null
          xp: number | null
          streak: number | null
          last_active: string | null
          preferences: Json | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          level?: number | null
          xp?: number | null
          streak?: number | null
          last_active?: string | null
          preferences?: Json | null
        }
        Update: {
          id?: string
          user_id?: string | null
          level?: number | null
          xp?: number | null
          streak?: number | null
          last_active?: string | null
          preferences?: Json | null
        }
      }
      learned_words: {
        Row: {
          id: string
          user_id: string | null
          word_id: string | null
          learned_at: string | null
          strength: number | null
          next_review: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          word_id?: string | null
          learned_at?: string | null
          strength?: number | null
          next_review?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          word_id?: string | null
          learned_at?: string | null
          strength?: number | null
          next_review?: string | null
        }
      }
      lessons: {
        Row: {
          id: string
          title: string
          description: string
          content: Json
          level: number
          order_num: number
          type: string
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          content: Json
          level: number
          order_num: number
          type: string
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          content?: Json
          level?: number
          order_num?: number
          type?: string
          created_at?: string | null
        }
      }
      lesson_progress: {
        Row: {
          id: string
          user_id: string | null
          lesson_id: string | null
          completed: boolean | null
          score: number | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          lesson_id?: string | null
          completed?: boolean | null
          score?: number | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          lesson_id?: string | null
          completed?: boolean | null
          score?: number | null
          completed_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    Tables: {
      quizzes: {
        Row: {
          id: string
          level: number
          order_num: number
          correct_letter: string
        }
        Insert: {
          id?: string
          level: number
          order_num: number
          correct_letter: string
        }
        Update: {
          id?: string
          level?: number
          order_num?: number
          correct_letter?: string
        }
      }
      quiz_options: {
        Row: {
          id: string
          level: number
          order_num: number
          letter: string
        }
        Insert: {
          id?: string
          level: number
          order_num: number
          letter: string
        }
        Update: {
          id?: string
          level?: number
          order_num?: number
          letter?: string
        }
      }
    }
  }
}

