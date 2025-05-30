# NLLB-200 Translation Service
# NOTE: This service is currently COMMENTED OUT and NOT IN USE
# The system has been reverted back to Google Gemini API due to better performance
# Keep this code for potential future use

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from pydantic import BaseModel
from supabase import create_client, Client
import re
import unicodedata

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Supabase configuration
SUPABASE_URL = "https://mnfxcqpwvsprsrxmaxxt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZnhjcXB3dnNwcnNyeG1heHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NDMwMDMsImV4cCI6MjA1NzMxOTAwM30.IVTRI8a-ja0RhyCmyQoXfLG4dIsGfXXxa2vRuIfUD4I"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load NLLB-200 model and tokenizer (better for Levantine Arabic)
model_name = "facebook/nllb-200-distilled-600M"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# Cache for alphabet mappings
alphabet_map = {}

def load_alphabet_mappings():
    """Load Arabic to transliteration mappings from Supabase"""
    global alphabet_map
    try:
        response = supabase.table('alphabet').select('letter, transliteration').execute()
        for row in response.data:
            if row['letter'] and row['transliteration']:
                alphabet_map[row['letter']] = row['transliteration']
        print(f"Loaded {len(alphabet_map)} alphabet mappings")
    except Exception as e:
        print(f"Error loading alphabet mappings: {e}")

def transliterate_arabic_chat_alphabet(arabic_text):
    """Convert Arabic text to chat-alphabet transliteration following the user's established system"""
    
    # Chat-alphabet mapping (user's established system)
    chat_alphabet_map = {
        'ء': '2',    # hamza
        'أ': '2a',   # alif with hamza above
        'إ': '2i',   # alif with hamza below  
        'ؤ': '2u',   # waw with hamza
        'ئ': '2i',   # ya with hamza
        'آ': '2a',   # alif madda
        'ا': 'a',    # alif
        'ب': 'b',    # ba
        'ت': 't',    # ta
        'ة': 'eh',   # ta marbuta (always 'eh' at word end, 'a' in middle)
        'ث': 'th',   # tha
        'ج': 'j',    # jim
        'ح': '7',    # ha
        'خ': 'kh',   # kha
        'د': 'd',    # dal
        'ذ': 'z',    # zal (simplified to 'z' for Levantine)
        'ر': 'r',    # ra
        'ز': 'z',    # zay
        'س': 's',    # sin
        'ش': 'sh',   # shin
        'ص': 'S',    # sad
        'ض': 'D',    # dad
        'ط': 'T',    # ta
        'ظ': 'z',    # za (simplified to 'z' for Levantine)
        'ع': '3',    # ayn
        'غ': 'gh',   # ghayn
        'ف': 'f',    # fa
        'ق': '2',    # qaf (often pronounced as hamza in Levantine)
        'ك': 'k',    # kaf
        'ل': 'l',    # lam
        'م': 'm',    # mim
        'ن': 'n',    # nun
        'ه': 'h',    # ha
        'و': 'w',    # waw
        'ي': 'y',    # ya
        'ى': 'a',    # alif maqsura
        
        # Common combinations
        'لا': 'la',   # lam-alif
        'الل': 'all', # al + lam
    }
    
    # Remove diacritics for mapping
    arabic_text_clean = ''.join(c for c in arabic_text if unicodedata.category(c) != 'Mn')
    
    transliterated = ""
    i = 0
    while i < len(arabic_text_clean):
        char = arabic_text_clean[i]
        
        # Check for two-character combinations first
        if i < len(arabic_text_clean) - 1:
            two_char = char + arabic_text_clean[i+1]
            if two_char in chat_alphabet_map:
                transliterated += chat_alphabet_map[two_char]
                i += 2
                continue
        
        # Single character mapping
        if char in chat_alphabet_map:
            # Special handling for ة (ta marbuta)
            if char == 'ة':
                # Use 'eh' at word end, 'a' in middle
                if i + 1 >= len(arabic_text_clean) or arabic_text_clean[i+1].isspace() or arabic_text_clean[i+1] in '.,!?;:()[]{}\"\'':
                    transliterated += 'eh'
                else:
                    transliterated += 'a'
            else:
                transliterated += chat_alphabet_map[char]
        elif char.isspace():
            transliterated += ' '
        elif char in '.,!?;:()[]{}\"\'`-':
            transliterated += char
        elif char.isdigit():
            transliterated += char
        else:
            # Keep unmapped characters as is
            transliterated += char
        
        i += 1
    
    return transliterated.strip()

def add_comprehensive_diacritics(arabic_text):
    """Add comprehensive diacritics to Arabic text for Levantine"""
    
    # More comprehensive diacritic patterns for Levantine
    patterns = {
        # Common Levantine words with proper diacritics
        'بدي': 'بِدّي',     # biddi (I want)
        'بدك': 'بِدَّك',     # biddak (you want)
        'بدو': 'بِدُّو',     # biddo (he wants) 
        'بدها': 'بِدْها',    # bidha (she wants)
        'بدنا': 'بِدْنا',    # bidna (we want)
        'بدكم': 'بِدْكُم',    # bidkum (you all want)
        'بدهن': 'بِدْهُن',    # bidhun (they want)
        
        'لازم': 'لازِم',     # lazim (must/need to)
        'ممكن': 'مُمْكِن',    # mumkin (possible)
        
        # Location words
        'هون': 'هوُن',      # hon (here)
        'هونيك': 'هونيك',   # honeek (there)
        'وين': 'وِين',      # wen (where)
        'فين': 'فِين',      # fen (where - alternative)
        
        # Question words
        'شو': 'شُو',        # shu (what)
        'ليش': 'ليش',       # lesh (why) 
        'كيف': 'كيف',       # kif (how)
        'إيمتى': 'إيْمتى',  # emta (when)
        'أديش': 'أدِيش',    # adesh (how much)
        
        # Pronouns
        'إنت': 'إنْت',      # inta (you masc)
        'إنتي': 'إنْتي',    # inti (you fem)
        'إحنا': 'إحْنا',    # ehna (we)
        'إنتوا': 'إنْتوا',  # intua (you plural)
        'هنن': 'هِنِّن',    # hinnen (they)
        
        # Common verbs
        'بروح': 'بْروح',    # bruh (I go)
        'بآجي': 'بآجي',     # baji (I come)
        'بحب': 'بْحِبّ',    # b7ebb (I love)
        'بكره': 'بْكره',    # bakrah (I hate)
        'بعرف': 'بْعرف',    # ba3ref (I know)
        'بفهم': 'بْفهم',    # bafham (I understand)
        
        # Present continuous prefix
        'عم ': 'عَم ',       # 3am (present continuous marker)
        
        # Prepositions
        'على': 'عَلى',      # 3ala (on)
        'في': 'في',        # fi (in)
        'من': 'مِن',        # min (from)
        'لل': 'لَلْ',       # lal (to the)
        'عن': 'عَن',        # 3an (about)
        
        # Common nouns
        'بيت': 'بيت',       # bet (house)
        'شغل': 'شُغْل',     # shughul (work)
        'أكل': 'أكْل',      # akl (food)
        'مي': 'مَي',        # may (water)
        'ولد': 'وَلَد',     # walad (boy)
        'بنت': 'بِنْت',     # bint (girl)
        
        # Time expressions
        'اليوم': 'اليوم',    # alyom (today)
        'بكرا': 'بُكْرا',    # bukra (tomorrow) 
        'امبارح': 'أمْبارِح', # embareh (yesterday)
        
        # Greetings
        'أهلا': 'أهْلاً',    # ahlan (hello)
        'مرحبا': 'مَرْحَبا',  # marhaba (hello)
        'شلونك': 'شْلونَك',   # shlonak (how are you)
        'كيفك': 'كيفَك',     # kifak (how are you)
        
        # Negation
        'ما': 'ما',         # ma (not)
        'مش': 'مِش',        # mish (not)
        'مو': 'مو',         # mo (not)
        
        # Articles and connectors
        'هاد': 'هاد',       # had (this masc)
        'هاي': 'هاي',       # hay (this fem)
        'هدول': 'هَدولْ',    # hadol (these)
        'هداك': 'هْداك',     # hadak (that masc)
        'هديك': 'هْديك',     # hadik (that fem)
    }
    
    # Apply diacritic patterns
    text_with_diacritics = arabic_text
    for pattern, replacement in patterns.items():
        # Use word boundaries to avoid partial matches
        text_with_diacritics = re.sub(r'\b' + re.escape(pattern) + r'\b', replacement, text_with_diacritics)
    
    return text_with_diacritics

def make_more_levantine(arabic_text):
    """Post-process MSA to make it more Levantine/colloquial"""
    # Common MSA to Levantine replacements
    replacements = {
        # Pronouns and common words
        'أنا': 'أنا',  # Keep as is
        'أنت': 'إنت',
        'أنتِ': 'إنتي',
        'هو': 'هو',   # Keep as is
        'هي': 'هي',   # Keep as is
        'نحن': 'إحنا',
        'أنتم': 'إنتوا',
        'هم': 'هنن',
        'هذا': 'هاد',
        'هذه': 'هاي',
        'ذلك': 'هاداك',
        'تلك': 'هاديك',
        'الذي': 'اللي', # Relatve pronoun
        'التي': 'اللي',
        'الذين': 'اللي',
        'اللاتي': 'اللي',

        # Verbs - make them more colloquial (more comprehensive)
        'أريد': 'بدي',
        'تريد': 'بدك',
        'يريد': 'بدو',
        'نريد': 'بدنا',
        'تريدون': 'بدكوا',
        'يريدون': 'بدهن',
        'أستطيع': 'بقدر',
        'تستطيع': 'بتقدر',
        'يستطيع': 'بيقدر',
        'نستطيع': 'منقدر',
        'تستطيعون': 'بتقدرو',
        'يستطيعون': 'بيقدروا',

        'يجب': 'لازم',
        'ينبغي': 'لازم',
        'يتوجب': 'لازم',

        'سوف': 'رح',
        'سأ': 'رح',

        # Common phrases
        'كيف حالك': 'كيفك',
        'ما اسمك': 'شو اسمك',
        'أين': 'وين',
        'متى': 'إيمتى',
        'لماذا': 'ليش',
        'ماذا': 'شو',
        'كيف': 'كيف',  # Keep as is

        # Remove case endings (i'rab)
        'ً': '',  # tanween fath
        'ٌ': '',  # tanween damm
        'ٍ': '',  # tanween kasr
        'َ': '',  # fatha
        'ُ': '',  # damma
        'ِ': '',  # kasra
        'ْ': '',  # sukun
        'ّ': '',  # shadda
    }

    result = arabic_text
    for msa, levantine in replacements.items():
        # Use word boundaries to replace whole words only
        result = re.sub(r'\b' + re.escape(msa) + r'\b', levantine, result)

    return result

# Request model for JSON body
class TranslationRequest(BaseModel):
    text: str
    target_lang: str = "apc_Arab"  # Default to North Levantine Arabic

@app.get("/")
def read_root():
    return {"message": "NLLB-200 Levantine Arabic Translation Service is running"}

@app.post("/translate/")
def translate_text(request: TranslationRequest):
    # Set the source language to English
    src_lang = "eng_Latn"
    target_lang = request.target_lang

    # Log the received request
    print(f"Received translation request: text='{request.text}', target_lang='{target_lang}'")

    # Explicitly set src_lang and tgt_lang for the tokenizer
    local_tokenizer = AutoTokenizer.from_pretrained(model_name, src_lang=src_lang, tgt_lang=target_lang)

    # Log the target language and its token ID
    try:
        target_lang_id = local_tokenizer.convert_tokens_to_ids(target_lang)
        print(f"Target language '{target_lang}' corresponds to token ID: {target_lang_id}")
    except KeyError:
        print(f"Error: Target language '{target_lang}' not found in tokenizer vocabulary.")
        # You might want to return an error response here
        return {"error": f"Unsupported target language: {target_lang}"}

    # Tokenize the input text
    encoded_input = local_tokenizer(request.text, return_tensors="pt")

    print("Encoded input:", encoded_input)

    # Generate the translation
    generated_ids = model.generate(
        input_ids=encoded_input.input_ids,
        attention_mask=encoded_input.attention_mask,
        max_length=150,
        forced_bos_token_id=target_lang_id
    )

    # Decode the generated tokens
    translated_text = local_tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
    
    # Post-process for more Levantine colloquialism
    translated_text_levantine = make_more_levantine(translated_text)
    
    # Add comprehensive diacritics for better readability
    translated_text_with_diacritics = add_comprehensive_diacritics(translated_text_levantine)
    
    # Generate transliteration using the improved function
    transliterated_text = transliterate_arabic_chat_alphabet(translated_text_levantine)

    return {
        "translated_text": translated_text_with_diacritics,
        "transliteration": transliterated_text,
        "target_language": target_lang,
        "model": "NLLB-200"
    }

# Load alphabet mappings on startup
@app.on_event("startup")
async def startup_event():
    load_alphabet_mappings()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 