import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

// Define the lesson type
interface Lesson {
  id: number;
  title: string;
  objective: string;
  grammarPoints: {
    point: string;
    explanation: string;
    examples: {
      arabic: string;
      transliteration: string;
      translation: string;
    }[];
  }[];
  practice: {
    question: string;
    options: string[];
    correctAnswer: number;
    feedback: string;
  }[];
}

// Define the course data
const grammarCourse: Lesson[] = [
  {
    id: 1,
    title: 'The Arabic Alphabet',
    objective:
      'Learn the basics of the Arabic alphabet and how letters connect.',
    grammarPoints: [
      {
        point: 'Letter Forms',
        explanation:
          'Arabic letters change form depending on their position in a word (beginning, middle, end, or isolated).',
        examples: [
          {
            arabic: 'ب',
            transliteration: 'b',
            translation: "The letter 'ba' in isolated form",
          },
          {
            arabic: 'بـ',
            transliteration: 'b',
            translation: "The letter 'ba' at the beginning of a word",
          },
          {
            arabic: 'ـبـ',
            transliteration: 'b',
            translation: "The letter 'ba' in the middle of a word",
          },
          {
            arabic: 'ـب',
            transliteration: 'b',
            translation: "The letter 'ba' at the end of a word",
          },
        ],
      },
      {
        point: 'Short Vowels',
        explanation:
          'Arabic has three short vowels that are usually not written but are important for pronunciation.',
        examples: [
          {
            arabic: 'بَ',
            transliteration: 'ba',
            translation: "The letter 'ba' with fatha (a sound)",
          },
          {
            arabic: 'بِ',
            transliteration: 'bi',
            translation: "The letter 'ba' with kasra (i sound)",
          },
          {
            arabic: 'بُ',
            transliteration: 'bu',
            translation: "The letter 'ba' with damma (u sound)",
          },
        ],
      },
    ],
    practice: [
      {
        question: "Which of these is the letter 'ba' at the end of a word?",
        options: ['ب', 'بـ', 'ـبـ', 'ـب'],
        correctAnswer: 3,
        feedback: "The letter 'ba' at the end of a word looks like 'ـب'.",
      },
      {
        question: "What sound does the short vowel 'fatha' represent?",
        options: ['i sound', 'u sound', 'a sound', 'o sound'],
        correctAnswer: 2,
        feedback: "The fatha represents the 'a' sound, as in 'cat'.",
      },
    ],
  },
  {
    id: 2,
    title: 'Pronouns (2l-Domaa2r)',
    objective:
      'Learn the personal pronouns in Levantine Arabic and how to use them.',
    grammarPoints: [
      {
        point: 'Subject Pronouns',
        explanation:
          'These are the basic pronouns used as the subject of a sentence.',
        examples: [
          {
            arabic: 'أنا',
            transliteration: 'ana',
            translation: 'I',
          },
          {
            arabic: 'إنتَ',
            transliteration: 'inte',
            translation: 'You (masculine)',
          },
          {
            arabic: 'إنتِ',
            transliteration: 'inti',
            translation: 'You (feminine)',
          },
          {
            arabic: 'هو',
            transliteration: 'huwwe',
            translation: 'He',
          },
          {
            arabic: 'هي',
            transliteration: 'hiyye',
            translation: 'She',
          },
          {
            arabic: 'إحنا',
            transliteration: 'i7na',
            translation: 'We',
          },
          {
            arabic: 'إنتو',
            transliteration: 'intu',
            translation: 'You (plural)',
          },
          {
            arabic: 'هم',
            transliteration: 'humme',
            translation: 'They',
          },
        ],
      },
      {
        point: 'Using Pronouns',
        explanation:
          'In Levantine Arabic, pronouns are often used with verbs and can sometimes be omitted when clear from context.',
        examples: [
          {
            arabic: 'أنا بحكي عربي',
            transliteration: 'ana ba7ki 3arabi',
            translation: 'I speak Arabic',
          },
          {
            arabic: 'هو بيشتغل هون',
            transliteration: 'huwwe byishtaghil hoon',
            translation: 'He works here',
          },
        ],
      },
    ],
    practice: [
      {
        question: "What is the Levantine Arabic pronoun for 'We'?",
        options: ['ana', 'i7na', 'intu', 'humme'],
        correctAnswer: 1,
        feedback: "The pronoun for 'We' is 'i7na' (إحنا).",
      },
      {
        question: "Which sentence means 'She speaks Arabic'?",
        options: [
          'أنا بحكي عربي',
          'هو بيحكي عربي',
          'هي بتحكي عربي',
          'إنتو بتحكو عربي',
        ],
        correctAnswer: 2,
        feedback:
          "هي بتحكي عربي (hiyye bti7ki 3arabi) means 'She speaks Arabic'.",
      },
    ],
  },
  {
    id: 3,
    title: 'Basic Sentence Structure (2l-Jomle 2l-Basiita)',
    objective: 'Learn how to form basic sentences in Levantine Arabic.',
    grammarPoints: [
      {
        point: 'Nominal Sentences',
        explanation:
          'Sentences that begin with a noun or pronoun, often expressing a state of being.',
        examples: [
          {
            arabic: 'البيت كبير',
            transliteration: 'il-beit kbiir',
            translation: 'The house is big',
          },
          {
            arabic: 'أنا مبسوط',
            transliteration: 'ana mabsooT',
            translation: 'I am happy',
          },
        ],
      },
      {
        point: 'Verbal Sentences',
        explanation: 'Sentences that begin with a verb, describing an action.',
        examples: [
          {
            arabic: 'بيشرب قهوة',
            transliteration: 'byishrab 2ahwe',
            translation: 'He drinks coffee',
          },
          {
            arabic: 'رحت عالسوق',
            transliteration: 'ri7it 3al-soo2',
            translation: 'I went to the market',
          },
        ],
      },
      {
        point: 'Question Formation',
        explanation:
          'Questions can be formed by adding question words or changing intonation.',
        examples: [
          {
            arabic: 'بتحب القهوة؟',
            transliteration: 'bti7ibb il-2ahwe?',
            translation: 'Do you like coffee?',
          },
          {
            arabic: 'وين رايح؟',
            transliteration: 'wein raaye7?',
            translation: 'Where are you going?',
          },
        ],
      },
    ],
    practice: [
      {
        question: 'Which sentence is a nominal sentence?',
        options: ['رحت عالبيت', 'البيت كبير', 'بيشرب شاي', 'بتحكي إنجليزي'],
        correctAnswer: 1,
        feedback:
          'البيت كبير (il-beit kbiir) is a nominal sentence because it starts with a noun (البيت/the house).',
      },
      {
        question:
          "How would you ask 'Do you speak Arabic?' in Levantine Arabic?",
        options: [
          'بتحكي عربي',
          'أنا بحكي عربي',
          'بتحكي عربي؟',
          'ليش بتحكي عربي',
        ],
        correctAnswer: 2,
        feedback:
          "بتحكي عربي؟ (bti7ki 3arabi?) is the correct way to ask 'Do you speak Arabic?' - just add a question mark/intonation to the statement.",
      },
    ],
  },
  {
    id: 4,
    title: 'Nouns and Gender (2l-2asmaa2 w 2l-Jens)',
    objective:
      'Learn about noun gender in Arabic and how it affects other parts of speech.',
    grammarPoints: [
      {
        point: 'Masculine and Feminine Nouns',
        explanation:
          "In Arabic, all nouns are either masculine or feminine. Many feminine nouns end with 'ة' (taa marbuuta).",
        examples: [
          {
            arabic: 'كتاب',
            transliteration: 'ktaab',
            translation: 'Book (masculine)',
          },
          {
            arabic: 'طاولة',
            transliteration: 'Taawle',
            translation: 'Table (feminine)',
          },
          {
            arabic: 'بيت',
            transliteration: 'beit',
            translation: 'House (masculine)',
          },
          {
            arabic: 'مدرسة',
            transliteration: 'madrase',
            translation: 'School (feminine)',
          },
        ],
      },
      {
        point: 'Gender Agreement',
        explanation:
          'Adjectives, verbs, and other words must agree with the gender of the noun they refer to.',
        examples: [
          {
            arabic: 'الولد طويل',
            transliteration: 'il-walad Tawiil',
            translation: 'The boy is tall (masculine)',
          },
          {
            arabic: 'البنت طويلة',
            transliteration: 'il-binit Tawiile',
            translation: 'The girl is tall (feminine)',
          },
          {
            arabic: 'هو راح',
            transliteration: 'huwwe raa7',
            translation: 'He went (masculine verb form)',
          },
          {
            arabic: 'هي راحت',
            transliteration: 'hiyye raa7at',
            translation: 'She went (feminine verb form)',
          },
        ],
      },
    ],
    practice: [
      {
        question: 'Which of these nouns is feminine?',
        options: [
          'كتاب (ktaab)',
          'بيت (beit)',
          'شارع (shaari3)',
          'سيارة (sayyaara)',
        ],
        correctAnswer: 3,
        feedback:
          'سيارة (sayyaara) is feminine because it ends with taa marbuuta (ة).',
      },
      {
        question:
          "What is the correct way to say 'The car is new' in Levantine Arabic?",
        options: [
          'السيارة جديد',
          'السيارة جديدة',
          'السيار جديد',
          'السيار جديدة',
        ],
        correctAnswer: 1,
        feedback:
          'السيارة جديدة (is-sayyaara jdiide) is correct because both the noun (car) and adjective (new) are feminine.',
      },
    ],
  },
  {
    id: 5,
    title: 'Definite and Indefinite Nouns (2l-M3arraf w 2l-Nakira)',
    objective:
      'Learn how to make nouns definite or indefinite in Levantine Arabic.',
    grammarPoints: [
      {
        point: 'The Definite Article',
        explanation:
          "The Arabic definite article 'ال' (il/el) is equivalent to 'the' in English. It's attached to the beginning of a noun.",
        examples: [
          {
            arabic: 'بيت',
            transliteration: 'beit',
            translation: 'A house (indefinite)',
          },
          {
            arabic: 'البيت',
            transliteration: 'il-beit',
            translation: 'The house (definite)',
          },
          {
            arabic: 'كتاب',
            transliteration: 'ktaab',
            translation: 'A book (indefinite)',
          },
          {
            arabic: 'الكتاب',
            transliteration: 'il-ktaab',
            translation: 'The book (definite)',
          },
        ],
      },
      {
        point: 'Sun and Moon Letters',
        explanation:
          'The pronunciation of the definite article changes depending on the first letter of the noun (sun letters vs. moon letters).',
        examples: [
          {
            arabic: 'القمر',
            transliteration: 'il-2amar',
            translation: "The moon (moon letter - clear 'l' sound)",
          },
          {
            arabic: 'الشمس',
            transliteration: 'ish-shams',
            translation: "The sun (sun letter - 'l' assimilates into 'sh')",
          },
          {
            arabic: 'الدار',
            transliteration: 'id-daar',
            translation: "The house (sun letter - 'l' assimilates into 'd')",
          },
        ],
      },
      {
        point: 'Indefinite Nouns',
        explanation:
          "Unlike Modern Standard Arabic, Levantine Arabic doesn't use tanween (nunation) for indefinite nouns. A noun without the definite article is understood to be indefinite.",
        examples: [
          {
            arabic: 'شفت بنت',
            transliteration: 'shift binit',
            translation: 'I saw a girl',
          },
          {
            arabic: 'عندي كتاب',
            transliteration: '3indi ktaab',
            translation: 'I have a book',
          },
        ],
      },
    ],
    practice: [
      {
        question: "How do you say 'the teacher' in Levantine Arabic?",
        options: [
          'معلم (m3allem)',
          'المعلم (il-m3allem)',
          'معلمة (m3allme)',
          'المعلمة (il-m3allme)',
        ],
        correctAnswer: 1,
        feedback:
          "المعلم (il-m3allem) means 'the teacher' (masculine). The definite article 'ال' (il) is added to the beginning of the noun.",
      },
      {
        question:
          "In the phrase 'الشمس' (ish-shams), why is the definite article pronounced 'ish' instead of 'il'?",
        options: [
          "Because it's a feminine noun",
          "Because 'ش' (sh) is a sun letter",
          "Because it's a plural noun",
          "Because it's a proper noun",
        ],
        correctAnswer: 1,
        feedback:
          "The letter 'ش' (sh) is a sun letter, which causes the 'l' in the definite article to assimilate, changing the pronunciation from 'il' to 'ish'.",
      },
    ],
  },
  {
    id: 6,
    title: 'Demonstratives (2smaa2 2l-Ishaara)',
    objective:
      'Learn demonstrative pronouns (this, that, these, those) in Levantine Arabic.',
    grammarPoints: [
      {
        point: 'Near Demonstratives',
        explanation:
          'Used to point to things that are close to the speaker (this, these).',
        examples: [
          {
            arabic: 'هاد',
            transliteration: 'haad',
            translation: 'This (masculine)',
          },
          {
            arabic: 'هاي',
            transliteration: 'haay',
            translation: 'This (feminine)',
          },
          {
            arabic: 'هدول',
            transliteration: 'hadool',
            translation: 'These (plural)',
          },
        ],
      },
      {
        point: 'Far Demonstratives',
        explanation:
          'Used to point to things that are far from the speaker (that, those).',
        examples: [
          {
            arabic: 'هداك',
            transliteration: 'hadaak',
            translation: 'That (masculine)',
          },
          {
            arabic: 'هديك',
            transliteration: 'hadiik',
            translation: 'That (feminine)',
          },
          {
            arabic: 'هدوليك',
            transliteration: 'hadooliik',
            translation: 'Those (plural)',
          },
        ],
      },
      {
        point: 'Using Demonstratives with Nouns',
        explanation:
          'When used with nouns, demonstratives follow a specific pattern.',
        examples: [
          {
            arabic: 'هاد البيت',
            transliteration: 'haad il-beit',
            translation: 'This house',
          },
          {
            arabic: 'هاي السيارة',
            transliteration: 'haay is-sayyaara',
            translation: 'This car',
          },
          {
            arabic: 'هداك الرجال',
            transliteration: 'hadaak ir-rijjaal',
            translation: 'That man',
          },
          {
            arabic: 'هدول الأولاد',
            transliteration: 'hadool il-2awlaad',
            translation: 'These children',
          },
        ],
      },
    ],
    practice: [
      {
        question: "How do you say 'this book' in Levantine Arabic?",
        options: ['هاد كتاب', 'هاد الكتاب', 'هاي كتاب', 'هاي الكتاب'],
        correctAnswer: 1,
        feedback:
          "هاد الكتاب (haad il-ktaab) is correct. 'هاد' is used for masculine nouns like 'كتاب' (book), and the noun takes the definite article.",
      },
      {
        question: "Which phrase means 'those houses'?",
        options: ['هدول البيوت', 'هاي البيوت', 'هدوليك البيوت', 'هداك البيوت'],
        correctAnswer: 2,
        feedback:
          "هدوليك البيوت (hadooliik il-byoot) means 'those houses'. 'هدوليك' is used for plural objects that are far from the speaker.",
      },
    ],
  },
  {
    id: 7,
    title: 'Present Tense Verbs (2l-Fi3l 2l-MoDaare3)',
    objective:
      'Learn how to conjugate and use present tense verbs in Levantine Arabic.',
    grammarPoints: [
      {
        point: 'Basic Present Tense Formation',
        explanation:
          'In Levantine Arabic, present tense verbs typically start with a prefix (b-) followed by the verb stem.',
        examples: [
          {
            arabic: 'بكتب',
            transliteration: 'baktob',
            translation: 'I write/am writing',
          },
          {
            arabic: 'بتكتب',
            transliteration: 'btiktob',
            translation: 'You write/are writing (masculine)',
          },
          {
            arabic: 'بتكتبي',
            transliteration: 'btikitbi',
            translation: 'You write/are writing (feminine)',
          },
          {
            arabic: 'بيكتب',
            transliteration: 'byiktob',
            translation: 'He writes/is writing',
          },
          {
            arabic: 'بتكتب',
            transliteration: 'btiktob',
            translation: 'She writes/is writing',
          },
        ],
      },
      {
        point: 'Plural Forms',
        explanation:
          'Plural forms of present tense verbs have their own conjugations.',
        examples: [
          {
            arabic: 'منكتب',
            transliteration: 'mniktob',
            translation: 'We write/are writing',
          },
          {
            arabic: 'بتكتبو',
            transliteration: 'btikitbu',
            translation: 'You (plural) write/are writing',
          },
          {
            arabic: 'بيكتبو',
            transliteration: 'byikitbu',
            translation: 'They write/are writing',
          },
        ],
      },
      {
        point: 'Continuous Action',
        explanation:
          "To emphasize that an action is happening right now, you can add 'عم' (3am) before the verb.",
        examples: [
          {
            arabic: 'عم بكتب',
            transliteration: '3am baktob',
            translation: 'I am writing (right now)',
          },
          {
            arabic: 'عم بياكل',
            transliteration: '3am byaakol',
            translation: 'He is eating (right now)',
          },
        ],
      },
    ],
    practice: [
      {
        question: "How do you say 'She reads' in Levantine Arabic?",
        options: ['بتقرا', 'بيقرا', 'منقرا', 'بتقري'],
        correctAnswer: 0,
        feedback:
          "بتقرا (bti2ra) is correct. For 'she' in present tense, we use the prefix 'بت' (bt).",
      },
      {
        question: "Which sentence means 'We are eating now'?",
        options: ['بناكل', 'عم بناكل', 'بياكلو', 'عم بياكلو'],
        correctAnswer: 1,
        feedback:
          "عم بناكل (3am bnaakol) means 'We are eating now'. '3am' indicates the action is happening at the moment.",
      },
    ],
  },
  {
    id: 8,
    title: 'Negation (2l-Nafi)',
    objective: 'Learn how to form negative sentences in Levantine Arabic.',
    grammarPoints: [
      {
        point: 'Negating Present Tense Verbs',
        explanation:
          "To negate present tense verbs, add 'ما' (ma) before the verb. In some regions, 'ش' (-sh) is also added at the end.",
        examples: [
          {
            arabic: 'بحب القهوة',
            transliteration: 'b7ibb il-2ahwe',
            translation: 'I like coffee',
          },
          {
            arabic: 'ما بحب القهوة',
            transliteration: 'ma b7ibb il-2ahwe',
            translation: "I don't like coffee",
          },
          {
            arabic: 'ما بحبش القهوة',
            transliteration: 'ma b7ibbish il-2ahwe',
            translation: "I don't like coffee (with -sh)",
          },
        ],
      },
      {
        point: 'Negating Past Tense Verbs',
        explanation:
          "Past tense verbs are negated by adding 'ما' (ma) before the verb and sometimes 'ش' (-sh) at the end.",
        examples: [
          {
            arabic: 'رحت عالسوق',
            transliteration: 'ri7it 3al-soo2',
            translation: 'I went to the market',
          },
          {
            arabic: 'ما رحت عالسوق',
            transliteration: 'ma ri7it 3al-soo2',
            translation: "I didn't go to the market",
          },
          {
            arabic: 'ما رحتش عالسوق',
            transliteration: 'ma ri7itsh 3al-soo2',
            translation: "I didn't go to the market (with -sh)",
          },
        ],
      },
      {
        point: 'Negating Nominal Sentences',
        explanation:
          "To negate nominal sentences (sentences without verbs), use 'مش' (mish).",
        examples: [
          {
            arabic: 'هو طويل',
            transliteration: 'huwwe Tawiil',
            translation: 'He is tall',
          },
          {
            arabic: 'هو مش طويل',
            transliteration: 'huwwe mish Tawiil',
            translation: 'He is not tall',
          },
          {
            arabic: 'الجو حلو',
            transliteration: 'ij-jaww 7ilu',
            translation: 'The weather is nice',
          },
          {
            arabic: 'الجو مش حلو',
            transliteration: 'ij-jaww mish 7ilu',
            translation: 'The weather is not nice',
          },
        ],
      },
    ],
    practice: [
      {
        question: "How do you say 'I don't understand' in Levantine Arabic?",
        options: ['ما بفهم', 'مش بفهم', 'ما فهمت', 'بفهم'],
        correctAnswer: 0,
        feedback:
          "ما بفهم (ma bafham) means 'I don't understand'. We use 'ما' (ma) to negate present tense verbs.",
      },
      {
        question: "Which sentence means 'The food is not good'?",
        options: [
          'الأكل مش منيح',
          'ما الأكل منيح',
          'الأكل ما منيح',
          'مش الأكل منيح',
        ],
        correctAnswer: 0,
        feedback:
          "الأكل مش منيح (il-akil mish mniih) means 'The food is not good'. We use 'مش' (mish) to negate nominal sentences.",
      },
    ],
  },
  {
    id: 9,
    title: 'Possessive Suffixes (2l-Domaa2r 2l-Milkiyye)',
    objective:
      'Learn how to express possession using suffixes in Levantine Arabic.',
    grammarPoints: [
      {
        point: 'Basic Possessive Suffixes',
        explanation:
          "In Arabic, possession is shown by adding suffixes to nouns rather than using separate words like 'my' or 'your'.",
        examples: [
          {
            arabic: 'كتاب',
            transliteration: 'ktaab',
            translation: 'A book',
          },
          {
            arabic: 'كتابي',
            transliteration: 'ktaabi',
            translation: 'My book',
          },
          {
            arabic: 'كتابك',
            transliteration: 'ktaabak',
            translation: 'Your book (masculine)',
          },
          {
            arabic: 'كتابك',
            transliteration: 'ktaabik',
            translation: 'Your book (feminine)',
          },
          {
            arabic: 'كتابو',
            transliteration: 'ktaabo',
            translation: 'His book',
          },
          {
            arabic: 'كتابها',
            transliteration: 'ktaabha',
            translation: 'Her book',
          },
        ],
      },
      {
        point: 'Plural Possessive Suffixes',
        explanation: 'Different suffixes are used for plural possessors.',
        examples: [
          {
            arabic: 'كتابنا',
            transliteration: 'ktaabna',
            translation: 'Our book',
          },
          {
            arabic: 'كتابكم',
            transliteration: 'ktaabkum',
            translation: 'Your book (plural)',
          },
          {
            arabic: 'كتابهم',
            transliteration: 'ktaabhum',
            translation: 'Their book',
          },
        ],
      },
      {
        point: 'Possessive Suffixes with Feminine Nouns',
        explanation:
          "When adding possessive suffixes to feminine nouns ending in 'ة' (taa marbuuta), the 'ة' changes to 't'.",
        examples: [
          {
            arabic: 'سيارة',
            transliteration: 'sayyaara',
            translation: 'A car',
          },
          {
            arabic: 'سيارتي',
            transliteration: 'sayyaarti',
            translation: 'My car',
          },
          {
            arabic: 'سيارتك',
            transliteration: 'sayyaartak',
            translation: 'Your car (masculine)',
          },
          {
            arabic: 'سيارتها',
            transliteration: 'sayyaaritha',
            translation: 'Her car',
          },
        ],
      },
    ],
    practice: [
      {
        question: "How do you say 'our house' in Levantine Arabic?",
        options: ['بيتي', 'بيتنا', 'بيتكم', 'بيتهم'],
        correctAnswer: 1,
        feedback:
          "بيتنا (beitna) means 'our house'. The suffix '-na' indicates 'our'.",
      },
      {
        question: "What is the correct way to say 'her school'?",
        options: ['مدرستي', 'مدرستك', 'مدرستها', 'مدرستنا'],
        correctAnswer: 2,
        feedback:
          "مدرستها (madrasitha) means 'her school'. Note how the feminine ending 'ة' changes to 't' before adding the suffix '-ha'.",
      },
    ],
  },
  {
    id: 10,
    title: 'Past Tense Verbs (2l-Fi3l 2l-MaaDi)',
    objective:
      'Learn how to conjugate and use past tense verbs in Levantine Arabic.',
    grammarPoints: [
      {
        point: 'Basic Past Tense Formation',
        explanation:
          'Past tense verbs in Levantine Arabic are formed by adding suffixes to the verb stem.',
        examples: [
          {
            arabic: 'كتبت',
            transliteration: 'katabit',
            translation: 'I wrote',
          },
          {
            arabic: 'كتبت',
            transliteration: 'katabit',
            translation: 'You wrote (masculine)',
          },
          {
            arabic: 'كتبتي',
            transliteration: 'katabti',
            translation: 'You wrote (feminine)',
          },
          {
            arabic: 'كتب',
            transliteration: 'katab',
            translation: 'He wrote',
          },
          {
            arabic: 'كتبت',
            transliteration: 'katabit',
            translation: 'She wrote',
          },
        ],
      },
      {
        point: 'Plural Forms',
        explanation:
          'Plural forms of past tense verbs have their own conjugations.',
        examples: [
          {
            arabic: 'كتبنا',
            transliteration: 'katabna',
            translation: 'We wrote',
          },
          {
            arabic: 'كتبتو',
            transliteration: 'katabtu',
            translation: 'You (plural) wrote',
          },
          {
            arabic: 'كتبو',
            transliteration: 'katabu',
            translation: 'They wrote',
          },
        ],
      },
      {
        point: 'Common Irregular Verbs',
        explanation: 'Some common verbs have irregular past tense forms.',
        examples: [
          {
            arabic: 'قلت',
            transliteration: '2ilt',
            translation: 'I said',
          },
          {
            arabic: 'رحت',
            transliteration: 'ri7it',
            translation: 'I went',
          },
          {
            arabic: 'جيت',
            transliteration: 'jiit',
            translation: 'I came',
          },
          {
            arabic: 'شفت',
            transliteration: 'shift',
            translation: 'I saw',
          },
        ],
      },
    ],
    practice: [
      {
        question: "How do you say 'She ate' in Levantine Arabic?",
        options: ['أكلت', 'أكل', 'أكلتي', 'أكلنا'],
        correctAnswer: 0,
        feedback:
          "أكلت (akalit) means 'She ate'. For 'she' in past tense, we add the suffix 't'.",
      },
      {
        question: "Which sentence means 'They went to the restaurant'?",
        options: [
          'راحوا عالمطعم',
          'رحت عالمطعم',
          'راح عالمطعم',
          'رحنا عالمطعم',
        ],
        correctAnswer: 0,
        feedback:
          "راحوا عالمطعم (raa7u 3al-maT3am) means 'They went to the restaurant'. The suffix '-u' indicates 'they' in past tense.",
      },
    ],
  },
];

interface GrammarProps {
  setSubTab?: (tab: string) => void;
}

const Grammar: React.FC<GrammarProps> = ({ setSubTab }) => {
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [expandedPoint, setExpandedPoint] = useState<{
    lessonId: number;
    pointIndex: number;
  } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{
    [key: string]: number | null;
  }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleLesson = (lessonId: number) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
    // Reset expanded point when closing a lesson
    if (expandedLesson === lessonId) {
      setExpandedPoint(null);
    }
  };

  const togglePoint = (lessonId: number, pointIndex: number) => {
    if (
      expandedPoint &&
      expandedPoint.lessonId === lessonId &&
      expandedPoint.pointIndex === pointIndex
    ) {
      setExpandedPoint(null);
    } else {
      setExpandedPoint({ lessonId, pointIndex });
    }
  };

  const handleAnswerSelect = (
    lessonId: number,
    questionIndex: number,
    answerIndex: number
  ) => {
    const key = `${lessonId}-${questionIndex}`;
    if (!quizSubmitted[key]) {
      setQuizAnswers({
        ...quizAnswers,
        [key]: answerIndex,
      });
    }
  };

  const handleQuizSubmit = (lessonId: number, questionIndex: number) => {
    const key = `${lessonId}-${questionIndex}`;
    setQuizSubmitted({
      ...quizSubmitted,
      [key]: true,
    });
  };

  const isAnswerCorrect = (lessonId: number, questionIndex: number) => {
    const key = `${lessonId}-${questionIndex}`;
    const lesson = grammarCourse.find((l) => l.id === lessonId);
    if (!lesson) return false;

    return quizAnswers[key] === lesson.practice[questionIndex].correctAnswer;
  };

  return (
    <div className="p-4">
      <button
        onClick={() => setSubTab?.('landing')}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center transition-colors duration-200 hover:!border-emerald-500"
      >
        ← Back to Learn
      </button>

      <h2 className="text-xl font-bold mb-4">
        Levantine Arabic Grammar Course
      </h2>

      <div className="space-y-4">
        {grammarCourse.map((lesson) => (
          <div
            key={lesson.id}
            className="border border-gray-200 dark:border-dark-100 rounded-lg overflow-hidden dark:bg-dark-200"
          >
            {/* Lesson Header */}
            <div
              className={`
               p-4 flex justify-between items-center cursor-pointer transition-colors duration-200
               ${
                 expandedLesson === lesson.id
                   ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-500'
                   : 'bg-gray-50 dark:bg-dark-100 border border-gray-200 dark:border-dark-300 hover:!border-emerald-500 dark:hover:!border-emerald-500'
               }`}
              onClick={() => toggleLesson(lesson.id)}
            >
              <div>
                <h3 className="text-lg font-bold">
                  {lesson.id}. {lesson.title}
                </h3>
                {expandedLesson !== lesson.id && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {lesson.objective}
                  </p>
                )}
              </div>
              {expandedLesson === lesson.id ? (
                <ChevronUp className="text-emerald-600" />
              ) : (
                <ChevronDown className="text-gray-400" />
              )}
            </div>

            {/* Lesson Content */}
            {expandedLesson === lesson.id && (
              <div className="p-4">
                <p className="mb-4 text-gray-700">{lesson.objective}</p>

                {/* Grammar Points */}
                <h4 className="font-bold text-md mb-3">Grammar Points</h4>
                <div className="space-y-3 mb-6">
                  {lesson.grammarPoints.map((point, pointIndex) => (
                    <div
                      key={pointIndex}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div
                        className={`
                     p-3 flex justify-between items-center cursor-pointer transition-colors duration-200
                     ${
                       expandedPoint &&
                       expandedPoint.lessonId === lesson.id &&
                       expandedPoint.pointIndex === pointIndex
                         ? 'bg-blue-50 border border-emerald-500'
                         : 'bg-gray-50 dark:bg-dark-100 border border-gray-200 dark:border-dark-300 hover:!border-emerald-500 dark:hover:!border-emerald-500'
                     }`}
                        onClick={() => togglePoint(lesson.id, pointIndex)}
                      >
                        <h5 className="font-medium">{point.point}</h5>
                        {expandedPoint &&
                        expandedPoint.lessonId === lesson.id &&
                        expandedPoint.pointIndex === pointIndex ? (
                          <ChevronUp className="text-blue-600" size={18} />
                        ) : (
                          <ChevronDown className="text-gray-400" size={18} />
                        )}
                      </div>

                      {expandedPoint &&
                        expandedPoint.lessonId === lesson.id &&
                        expandedPoint.pointIndex === pointIndex && (
                          <div className="p-3">
                            <p className="mb-3 text-gray-700">
                              {point.explanation}
                            </p>

                            <h6 className="font-medium text-sm text-gray-600 mb-2">
                              Examples:
                            </h6>
                            <div className="space-y-2">
                              {point.examples.map((example, exIndex) => (
                                <div
                                  key={exIndex}
                                  className="bg-gray-50 p-2 rounded-md"
                                >
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      {example.arabic}
                                    </span>
                                    <span className="text-gray-600">
                                      {example.transliteration}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mt-1">
                                    {example.translation}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>

                {/* Practice Exercises */}
                <h4 className="font-bold text-md mb-3">Practice Exercises</h4>
                <div className="space-y-4">
                  {lesson.practice.map((question, qIndex) => {
                    const quizKey = `${lesson.id}-${qIndex}`;
                    const isSubmitted = quizSubmitted[quizKey];
                    const isCorrect = isAnswerCorrect(lesson.id, qIndex);

                    return (
                      <div
                        key={qIndex}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <p className="font-medium mb-3">
                          {qIndex + 1}. {question.question}
                        </p>

                        <div className="space-y-2 mb-4">
                          {question.options.map((option, oIndex) => (
                            <div
                              key={oIndex}
                              className={`
    p-2 rounded-md cursor-pointer transition-colors duration-200
    ${
      quizAnswers[quizKey] === oIndex
        ? isSubmitted
          ? isCorrect
            ? 'bg-green-100 border border-green-300'
            : 'bg-red-100 border border-red-300'
          : 'bg-blue-100 border border-blue-300'
        : isSubmitted && question.correctAnswer === oIndex
        ? 'bg-green-100 border border-green-300'
        : 'bg-gray-50 border border-gray-200 hover:!border-emerald-500 dark:border-gray-200 dark:hover:!border-emerald-500'
    }
                              }`}
                              onClick={() =>
                                handleAnswerSelect(lesson.id, qIndex, oIndex)
                              }
                            >
                              <div className="flex items-center">
                                <span className="mr-2">
                                  {String.fromCharCode(65 + oIndex)}.
                                </span>
                                <span>{option}</span>
                                {isSubmitted && (
                                  <span className="ml-auto">
                                    {oIndex === question.correctAnswer && (
                                      <CheckCircle
                                        size={18}
                                        className="text-green-600"
                                      />
                                    )}
                                    {quizAnswers[quizKey] === oIndex &&
                                      oIndex !== question.correctAnswer && (
                                        <XCircle
                                          size={18}
                                          className="text-red-600"
                                        />
                                      )}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {!isSubmitted ? (
                          <button
                            className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 disabled:bg-gray-300"
                            onClick={() => handleQuizSubmit(lesson.id, qIndex)}
                            disabled={
                              quizAnswers[quizKey] === undefined ||
                              quizAnswers[quizKey] === null
                            }
                          >
                            Check Answer
                          </button>
                        ) : (
                          <div
                            className={`p-3 rounded-md ${
                              isCorrect
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                            }`}
                          >
                            <p
                              className={`font-medium ${
                                isCorrect ? 'text-green-800' : 'text-red-800'
                              }`}
                            >
                              {isCorrect ? 'Correct!' : 'Incorrect!'}{' '}
                              {question.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Next Lesson Button */}
                {lesson.id < grammarCourse.length && (
                  <div className="mt-6 flex justify-end">
                    <button
                      className="flex items-center bg-emerald-100 text-emerald-800 px-4 py-2 rounded-md transition-colors duration-200 hover:bg-emerald-200"
                      onClick={() => {
                        /* ... */
                      }}
                      onClick={() => {
                        setExpandedLesson(lesson.id + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <span className="mr-2">Next Lesson</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Grammar;


