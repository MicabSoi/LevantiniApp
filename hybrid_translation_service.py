from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os
import requests
from datetime import datetime
import logging
from typing import List, Dict, Tuple, Optional
import unicodedata
import re

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class LevantineHybridDB:
    def __init__(self, db_path='levantine_hybrid.db'):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the SQLite database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Word replacements table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS word_replacements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_arabic TEXT NOT NULL,
                original_transliteration TEXT NOT NULL,
                replacement_arabic TEXT NOT NULL,
                replacement_transliteration TEXT NOT NULL,
                context TEXT,
                reason TEXT,
                usage_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(original_arabic)
            )
        ''')
        
        # Translation history for review
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS translation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                english_text TEXT NOT NULL,
                context_text TEXT,
                gemini_arabic TEXT NOT NULL,
                gemini_transliteration TEXT NOT NULL,
                final_arabic TEXT NOT NULL,
                final_transliteration TEXT NOT NULL,
                replacements_made TEXT, -- JSON string of replacements
                status TEXT DEFAULT 'pending', -- pending, approved, declined
                reviewed_by TEXT,
                review_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP
            )
        ''')
        
        # Training data for future model
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS approved_translations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                english_text TEXT NOT NULL,
                arabic_text TEXT NOT NULL,
                transliteration TEXT NOT NULL,
                context TEXT,
                quality_score REAL DEFAULT 1.0,
                source TEXT DEFAULT 'approved', -- approved, manual_addition
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Hybrid database initialized successfully")
    
    def add_word_replacement(self, original_arabic: str, original_transliteration: str,
                           replacement_arabic: str, replacement_transliteration: str,
                           context: str = "", reason: str = ""):
        """Add or update a word replacement"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO word_replacements 
            (original_arabic, original_transliteration, replacement_arabic, replacement_transliteration, context, reason)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (original_arabic, original_transliteration, replacement_arabic, replacement_transliteration, context, reason))
        
        conn.commit()
        conn.close()
        logger.info(f"Added word replacement: {original_arabic} -> {replacement_arabic}")
    
    def get_word_replacements(self) -> Dict[str, Dict]:
        """Get all word replacements"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT original_arabic, original_transliteration, replacement_arabic, 
                   replacement_transliteration, context, reason, usage_count
            FROM word_replacements
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        replacements = {}
        for row in rows:
            replacements[row[0]] = {
                'original_transliteration': row[1],
                'replacement_arabic': row[2],
                'replacement_transliteration': row[3],
                'context': row[4],
                'reason': row[5],
                'usage_count': row[6]
            }
        
        return replacements
    
    def _strip_arabic_diacritics(self, text: str) -> str:
        """Removes Arabic diacritics (tashkeel) from a string"""
        # Normalize to NFD to decompose characters into base + diacritics
        normalized_text = unicodedata.normalize('NFD', text)
        # Filter out characters in the Arabic diacritic range (U+064B to U+0652)
        stripped_text = ''.join(char for char in normalized_text if not '\u064b' <= char <= '\u0652')
        return stripped_text

    def apply_word_replacements(self, arabic_text: str, transliteration_text: str) -> Tuple[str, str, List[str]]:
        """Apply word replacements to Arabic and transliteration, ignoring diacritics for matching"""
        replacements = self.get_word_replacements()
        replacements_made = []
        new_arabic = arabic_text # Work with a mutable copy
        new_transliteration = transliteration_text # Work with a mutable copy
        
        # Sort replacements by length in descending order to handle longer phrases first
        sorted_replacements = sorted(replacements.items(), key=lambda item: len(item[0]), reverse=True)

        for original_arabic, replacement_data in sorted_replacements:
            # Create a regex pattern that matches original_arabic characters with optional diacritics in between
            # Escape special regex characters in the original_arabic word
            escaped_original_arabic = ''.join(re.escape(char) + '[\u064b-\u0652]*' for char in original_arabic)
            
            # Use regex to find the word in the new_arabic text, ignoring diacritics in the text
            # This pattern looks for the sequence of non-diacritic characters from original_arabic,
            # allowing any diacritics in between.
            # Add word boundaries (\b) to ensure full word match, but be cautious with Arabic
            # word boundaries can be tricky due to ligatures and connected letters.
            # A simpler, possibly more reliable approach for basic words is to just check presence
            # and replace, but let's try with a more robust regex for exact words.

            # Alternative regex pattern: Match the exact characters of original_arabic, allowing diacritics after each.
            # This might be too strict if the original_arabic in DB is missing diacritics that Gemini adds.
            # Let's try stripping diacritics from both for comparison and use regex on the original string.

            stripped_original_arabic = self._strip_arabic_diacritics(original_arabic)
            stripped_new_arabic_lower = self._strip_arabic_diacritics(new_arabic).lower()
            stripped_original_arabic_lower = stripped_original_arabic.lower()

            # Check if the stripped original word exists within the stripped current translation
            if stripped_original_arabic_lower in stripped_new_arabic_lower:
                # If found, construct a regex to replace the word in the original text (with diacritics)
                # This regex will match the original_arabic characters with any diacritics following them.
                pattern = ''.join(re.escape(char) + '[\u064b-\u0652]*' for char in original_arabic)
                
                # Perform replacement using the compiled regex
                # We use a function in sub to preserve case in the rest of the string if needed, but for Arabic it's less relevant.
                # We need to be careful not to replace partial words incorrectly.
                # Let's refine the regex to ensure it matches word boundaries more safely.
                # Using lookarounds might be too complex. A simpler approach is needed.

                # Revert to a simpler check and replace, but after stripping diacritics for comparison.
                # We already did the stripped check. Now replace in the original string.
                # This naive replace might replace parts of words if not careful, but it's a starting point.
                # For more accuracy, we would need a more sophisticated Arabic word tokenization.

                # Let's try replacing the *stripped* version in the *stripped* text first, 
                # then find the index in the original and replace there.
                # This is also complex. The simplest is a regex that matches the characters but ignores diacritics in the source string.

                # Refined regex pattern: Match the sequence of characters from original_arabic, allowing any diacritics in the source string.
                # This requires building the regex character by character.
                
                # Let's rebuild the pattern to match original_arabic characters but allow diacritics in the input string.
                regex_pattern = ''.join(
                    f'{re.escape(char)}[\u064b-\u0652]*' 
                    for char in original_arabic 
                    if '\u0600' <= char <= '\u06FF' # Only process Arabic letters/numbers
                )
                # Add word boundaries for more safety, though imperfect for Arabic.
                # If original_arabic is a phrase, don't use boundaries.
                if len(original_arabic.split()) == 1:
                    regex_pattern = r'\b' + regex_pattern + r'\b'

                # Check if the pattern exists in the *original* new_arabic text
                if re.search(regex_pattern, new_arabic):
                    # Perform the replacement using regex
                    new_arabic = re.sub(
                        regex_pattern, 
                        replacement_data['replacement_arabic'], 
                        new_arabic, 
                        count=1 # Replace only the first occurrence per replacement rule
                    )
                    
                    # Replace corresponding transliteration (simpler string replace is usually sufficient here)
                    # Ensure case-insensitivity for transliteration replacement
                    original_translit_lower = replacement_data['original_transliteration'].lower()
                    replacement_translit = replacement_data['replacement_transliteration']
                    
                    # Use regex for transliteration replacement with word boundaries and case insensitivity
                    translit_pattern = r'\b' + re.escape(original_translit_lower) + r'\b'
                    new_transliteration = re.sub(
                        translit_pattern, 
                        replacement_translit, 
                        new_transliteration, 
                        flags=re.IGNORECASE, 
                        count=1
                    )
                    
                    replacements_made.append(f"{original_arabic} → {replacement_data['replacement_arabic']}")
                    
                    # Increment usage count (assuming the replacement happened)
                    self.increment_usage_count(original_arabic)

        return new_arabic, new_transliteration, replacements_made
    
    def increment_usage_count(self, original_arabic: str):
        """Increment usage count for a replacement"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE word_replacements 
            SET usage_count = usage_count + 1 
            WHERE original_arabic = ?
        ''', (original_arabic,))
        
        conn.commit()
        conn.close()
    
    def save_translation_for_review(self, english: str, context: str, gemini_arabic: str, 
                                  gemini_transliteration: str, final_arabic: str, 
                                  final_transliteration: str, replacements_made: List[str]):
        """Save translation for manual review"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO translation_history 
            (english_text, context_text, gemini_arabic, gemini_transliteration, 
             final_arabic, final_transliteration, replacements_made)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (english, context, gemini_arabic, gemini_transliteration, 
              final_arabic, final_transliteration, json.dumps(replacements_made)))
        
        conn.commit()
        conn.close()
    
    def get_pending_reviews(self, limit: int = 50) -> List[Dict]:
        """Get translations pending review"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, english_text, context_text, gemini_arabic, gemini_transliteration,
                   final_arabic, final_transliteration, replacements_made, created_at
            FROM translation_history 
            WHERE status = 'pending'
            ORDER BY created_at DESC
            LIMIT ?
        ''', (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [
            {
                'id': row[0],
                'english': row[1],
                'context': row[2],
                'gemini_arabic': row[3],
                'gemini_transliteration': row[4],
                'final_arabic': row[5],
                'final_transliteration': row[6],
                'replacements_made': json.loads(row[7]) if row[7] else [],
                'created_at': row[8]
            }
            for row in rows
        ]
    
    def approve_translation(self, translation_id: int, reviewer: str = "admin", notes: str = ""):
        """Approve a translation and add to training data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get the translation
        cursor.execute('''
            SELECT english_text, final_arabic, final_transliteration, context_text
            FROM translation_history WHERE id = ?
        ''', (translation_id,))
        
        row = cursor.fetchone()
        if row:
            # Update status
            cursor.execute('''
                UPDATE translation_history 
                SET status = 'approved', reviewed_by = ?, review_notes = ?, reviewed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (reviewer, notes, translation_id))
            
            # Add to approved translations
            cursor.execute('''
                INSERT INTO approved_translations 
                (english_text, arabic_text, transliteration, context)
                VALUES (?, ?, ?, ?)
            ''', (row[0], row[1], row[2], row[3]))
        
        conn.commit()
        conn.close()
        logger.info(f"Approved translation ID: {translation_id}")
    
    def decline_translation(self, translation_id: int, reviewer: str = "admin", notes: str = ""):
        """Decline a translation"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE translation_history 
            SET status = 'declined', reviewed_by = ?, review_notes = ?, reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (reviewer, notes, translation_id))
        
        conn.commit()
        conn.close()
        logger.info(f"Declined translation ID: {translation_id}")
    
    def get_approved_translations_count(self) -> int:
        """Get count of approved translations for training"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM approved_translations')
        count = cursor.fetchone()[0]
        
        conn.close()
        return count

class GeminiTranslator:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    
    def translate(self, text: str, context: str = "") -> Tuple[str, str]:
        """Translate using Gemini API"""
        prompt = f"""
Translate "{text}" to colloquial Levantine Arabic (Lebanese/Syrian/Palestinian/Jordanian), not MSA{f', context: "{context}"' if context else ''}.

CRITICAL: Use NATURAL DAILY SPEECH as actually spoken on the street, NOT formal or literary Arabic.

DIACRITICS REQUIREMENT: **ALL Arabic text MUST include FULL diacritics (tashkeel)** - fatha (َ), damma (ُ), kasra (ِ), sukun (ْ), shadda (ّ), tanween, etc.

Essential Levantine patterns:
• "بِدّي" (biddi) for "I want" - NEVER "أريد" (ureed)
• "لازِم" (lazim) for "need to/must" - NEVER "أنا بحاجة" (ana bi 7aja)  
• "عَم + verb" for present continuous: "عَم بآكُل" (3am beekol) = "I'm eating"
• Use common colloquial words: "كتير" (kteer) for "very/a lot", "هَلَّأ" (halla2) for "now", "هون" (hon) for "here"
• Question words: "شو" (shu) for "what", "وين" (wen) for "where", "كيف" (kif) for "how", "ليش" (lesh) for "why", "إيمتى" (emta) for "when", "أديش" (adesh) for "how much/many"
• Pronouns: "إنت" (inta/i) for "you", "إحنا" (ehna) for "we", "إنتوا" (entoo) for "you plural", "هنن" (hennen) for "they"
• Negation: Use "مش" (mish) or "مو" (mo) - avoid formal "لا" or "لم"

IMPORTANT: Respond ONLY with this exact format:
Arabic: [your Arabic translation with full diacritics]
Transliteration: [your chat-alphabet transliteration]

Example format:
Arabic: بِدّي آكُل هَلَّأ
Transliteration: biddi akul halla2

Your translation for "{text}"{f' with context "{context}"' if context else ''}:
"""
        
        try:
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            
            response = requests.post(
                f"{self.base_url}?key={self.api_key}",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result['candidates'][0]['content']['parts'][0]['text']
                
                # Parse response
                arabic = ""
                transliteration = ""
                
                # Try to extract Arabic and transliteration
                lines = response_text.split('\n')
                for line in lines:
                    line = line.strip()
                    if line.lower().startswith('arabic:'):
                        arabic = line.split(':', 1)[1].strip()
                    elif line.lower().startswith('transliteration:'):
                        transliteration = line.split(':', 1)[1].strip()
                
                return arabic, transliteration
            else:
                logger.error(f"Gemini API error: {response.status_code}")
                return "Translation error", "translation error"
                
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            return "Translation error", "translation error"

# Initialize components
db = LevantineHybridDB()

# Initialize with your custom vocabulary (including taabeh for ball)
def initialize_custom_vocabulary():
    """Initialize with custom Levantine vocabulary"""
    custom_words = [
        ("كُرة", "kura", "طابة", "taabeh", "sports", "More commonly used Levantine word for ball"),
        # Add more replacements here as you discover them
    ]
    
    for orig_ar, orig_tr, repl_ar, repl_tr, context, reason in custom_words:
        db.add_word_replacement(orig_ar, orig_tr, repl_ar, repl_tr, context, reason)
    
    logger.info("Initialized custom vocabulary")

# Initialize vocabulary if needed
try:
    if not db.get_word_replacements():
        initialize_custom_vocabulary()
except:
    pass

@app.route('/')
def index():
    return "Hybrid Levantine Translation Service (Gemini + Custom DB) is running!"

@app.route('/translate', methods=['POST'])
def translate_text():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    english_text = data.get('english_text')
    context = data.get('context')
    gemini_api_key = data.get('gemini_api_key')

    if not english_text:
        return jsonify({"error": "Missing english_text to translate"}), 400
    if not gemini_api_key:
        return jsonify({"error": "Missing gemini_api_key"}), 400

    try:
        # Step 1: Get translation from Gemini
        gemini = GeminiTranslator(gemini_api_key)
        gemini_arabic, gemini_transliteration = gemini.translate(english_text, context)
        
        # Step 2: Apply custom word replacements
        final_arabic, final_transliteration, replacements_made = db.apply_word_replacements(
            gemini_arabic, gemini_transliteration
        )
        
        # Step 3: Save for review (optional - can be disabled if you don't want to review everything)
        save_for_review = data.get('save_for_review', True)
        if save_for_review:
            db.save_translation_for_review(
                english_text, context, gemini_arabic, gemini_transliteration,
                final_arabic, final_transliteration, replacements_made
            )
        
        response = {
            'english': english_text,
            'arabic': final_arabic,
            'transliteration': final_transliteration,
            'context': context,
            'gemini_original': {
                'arabic': gemini_arabic,
                'transliteration': gemini_transliteration
            },
            'replacements_made': replacements_made,
            'has_replacements': len(replacements_made) > 0,
            'model_version': 'hybrid-gemini-custom-v1'
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return jsonify({'error': f'Translation failed: {str(e)}'}), 500

@app.route('/add_word_replacement', methods=['POST'])
def add_word_replacement():
    """Add a new word replacement"""
    data = request.get_json()
    
    required_fields = ['original_arabic', 'original_transliteration', 'replacement_arabic', 'replacement_transliteration']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400
    
    try:
        db.add_word_replacement(
            original_arabic=data['original_arabic'],
            original_transliteration=data['original_transliteration'],
            replacement_arabic=data['replacement_arabic'],
            replacement_transliteration=data['replacement_transliteration'],
            context=data.get('context', ''),
            reason=data.get('reason', '')
        )
        
        return jsonify({'message': 'Word replacement added successfully'})
        
    except Exception as e:
        logger.error(f"Error adding word replacement: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/pending_reviews', methods=['GET'])
def get_pending_reviews():
    """Get translations pending review"""
    limit = request.args.get('limit', 50, type=int)
    
    try:
        pending = db.get_pending_reviews(limit)
        return jsonify({
            'pending_reviews': pending,
            'count': len(pending)
        })
    except Exception as e:
        logger.error(f"Error getting pending reviews: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/approve_translation/<int:translation_id>', methods=['POST'])
def approve_translation(translation_id):
    """Approve a translation"""
    data = request.get_json() or {}
    reviewer = data.get('reviewer', 'admin')
    notes = data.get('notes', '')
    
    try:
        db.approve_translation(translation_id, reviewer, notes)
        return jsonify({'message': 'Translation approved successfully'})
    except Exception as e:
        logger.error(f"Error approving translation: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/decline_translation/<int:translation_id>', methods=['POST'])
def decline_translation(translation_id):
    """Decline a translation"""
    data = request.get_json() or {}
    reviewer = data.get('reviewer', 'admin')
    notes = data.get('notes', '')
    
    try:
        db.decline_translation(translation_id, reviewer, notes)
        return jsonify({'message': 'Translation declined successfully'})
    except Exception as e:
        logger.error(f"Error declining translation: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/word_replacements', methods=['GET'])
def get_word_replacements():
    """Get all word replacements"""
    try:
        replacements = db.get_word_replacements()
        return jsonify({
            'word_replacements': replacements,
            'count': len(replacements)
        })
    except Exception as e:
        logger.error(f"Error getting word replacements: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get service statistics"""
    try:
        word_replacements = db.get_word_replacements()
        approved_count = db.get_approved_translations_count()
        pending_count = len(db.get_pending_reviews())
        
        return jsonify({
            'word_replacements_count': len(word_replacements),
            'approved_translations': approved_count,
            'pending_reviews': pending_count,
            'total_usage': sum(r['usage_count'] for r in word_replacements.values()),
            'most_used_replacement': max(word_replacements.items(), 
                                       key=lambda x: x[1]['usage_count'], 
                                       default=(None, {'usage_count': 0}))
        })
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Hybrid Levantine Translation Service...")
    print("Features:")
    print("- Gemini API for heavy translation lifting")
    print("- Custom word replacement database")
    print("- Manual review and approval system")
    print("- Progressive vocabulary building")
    print("- 'kura' -> 'taabeh' replacement pre-loaded")
    print("Service will be available on http://127.0.0.1:5003")
    
    app.run(debug=True, port=5003) 