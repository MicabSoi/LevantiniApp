/*
  # Add Sample Alphabet Lessons

  1. New Data
    - Adds initial alphabet lessons with proper content structure
    - Includes lesson titles, descriptions, and content
    - Sets appropriate lesson groups and ordering

  2. Content Structure
    - Each lesson includes:
      - Title and description
      - Pronunciation guide
      - Example words
      - Letters covered
      - Practice quiz
*/

-- Insert alphabet lessons
INSERT INTO lessons (title, description, content, level, order_num, type, lesson_group) VALUES
(
  'Lesson 1: Lam, Alif, Alif Maksura, Ya',
  'Introduction to Lam (ل), Alif (ا), Alif Maksura (ى), and Ya (ي). These letters are visually similar.',
  '{
    "pronunciation": "Alif is a standalone vowel, while Ya acts as a consonant and vowel. Lam is a common consonant that often connects with Alif.",
    "examples": [
      "لا (la - no)",
      "يا (ya - oh/hey)",
      "لي (li - for me)",
      "ليل (layl - night)"
    ],
    "letters": ["ل", "ا", "ى", "ي"],
    "quiz": [
      {
        "question": "Which letter makes the L sound?",
        "options": ["ل", "ا", "ي", "ى"],
        "answer": "ل"
      },
      {
        "question": "What is the difference between ى and ي?",
        "options": [
          "ى appears at the end of words, ي can appear anywhere",
          "They are the same letter",
          "ى is only used in formal Arabic",
          "ي is only used in names"
        ],
        "answer": "ى appears at the end of words, ي can appear anywhere"
      }
    ]
  }'::jsonb,
  1,
  1,
  'alphabet',
  'alphabet'
),
(
  'Lesson 2: Ba, Ta, Tha',
  'Learn the basic letters Ba (ب), Ta (ت), and Tha (ث), which share similar shapes but have different dots.',
  '{
    "pronunciation": "These letters share the same base shape but are distinguished by dots. Ba has one dot below, Ta has two dots above, and Tha has three dots above.",
    "examples": [
      "باب (bab - door)",
      "تين (teen - figs)",
      "ثوم (thoom - garlic)"
    ],
    "letters": ["ب", "ت", "ث"],
    "quiz": [
      {
        "question": "Which letter has two dots above?",
        "options": ["ب", "ت", "ث"],
        "answer": "ت"
      },
      {
        "question": "What word means door?",
        "options": ["باب", "تين", "ثوم"],
        "answer": "باب"
      }
    ]
  }'::jsonb,
  1,
  2,
  'alphabet',
  'alphabet'
),
(
  'Lesson 3: Jim, Ha, Kha',
  'Explore Jim (ج), Ha (ح), and Kha (خ), which share a similar cup-like shape.',
  '{
    "pronunciation": "These letters share a cup-like shape. Jim has a dot in the cup, Ha has no dots, and Kha has a dot above the cup.",
    "examples": [
      "جمل (jamal - camel)",
      "حب (hub - love)",
      "خبز (khubz - bread)"
    ],
    "letters": ["ج", "ح", "خ"],
    "quiz": [
      {
        "question": "Which letter has no dots?",
        "options": ["ج", "ح", "خ"],
        "answer": "ح"
      },
      {
        "question": "What word means bread?",
        "options": ["جمل", "حب", "خبز"],
        "answer": "خبز"
      }
    ]
  }'::jsonb,
  1,
  3,
  'alphabet',
  'alphabet'
);