from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import re
from typing import Dict, List, Tuple

app = Flask(__name__)
CORS(app)  # Allow CORS for all routes

class LevantineVocabularyReplacer:
    def __init__(self, vocabulary_file='levantine_vocabulary.json'):
        self.vocabulary_file = vocabulary_file
        self.vocabulary_map = self.load_vocabulary()
        
    def load_vocabulary(self) -> Dict[str, Dict[str, str]]:
        """Load vocabulary replacements from JSON file"""
        if os.path.exists(self.vocabulary_file):
            try:
                with open(self.vocabulary_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading vocabulary file: {e}")
                return {}
        return {}
    
    def save_vocabulary(self):
        """Save vocabulary replacements to JSON file"""
        try:
            with open(self.vocabulary_file, 'w', encoding='utf-8') as f:
                json.dump(self.vocabulary_map, f, ensure_ascii=False, indent=2)
            print(f"Vocabulary saved to {self.vocabulary_file}")
        except Exception as e:
            print(f"Error saving vocabulary file: {e}")
    
    def add_replacement(self, original_arabic: str, original_transliteration: str, 
                       new_arabic: str, new_transliteration: str, 
                       context: str = "", notes: str = ""):
        """Add a new word replacement to the vocabulary"""
        # Use original Arabic as the key
        self.vocabulary_map[original_arabic] = {
            "original_transliteration": original_transliteration,
            "new_arabic": new_arabic,
            "new_transliteration": new_transliteration,
            "context": context,
            "notes": notes,
            "usage_count": 0
        }
        self.save_vocabulary()
        
    def replace_words(self, arabic_text: str, transliteration_text: str) -> Tuple[str, str, List[str]]:
        """
        Replace words in both Arabic and transliteration text
        Returns: (new_arabic, new_transliteration, list_of_replacements_made)
        """
        replacements_made = []
        new_arabic = arabic_text
        new_transliteration = transliteration_text
        
        for original_arabic, replacement_data in self.vocabulary_map.items():
            # Replace in Arabic text (exact word match with word boundaries)
            if self._contains_arabic_word(new_arabic, original_arabic):
                new_arabic = self._replace_arabic_word(new_arabic, original_arabic, replacement_data["new_arabic"])
                
                # Replace corresponding transliteration
                original_translit = replacement_data["original_transliteration"]
                new_translit = replacement_data["new_transliteration"]
                
                # Case-insensitive replacement for transliteration
                new_transliteration = re.sub(
                    r'\b' + re.escape(original_translit) + r'\b', 
                    new_translit, 
                    new_transliteration, 
                    flags=re.IGNORECASE
                )
                
                replacements_made.append(f"{original_arabic} → {replacement_data['new_arabic']}")
                
                # Increment usage count
                self.vocabulary_map[original_arabic]["usage_count"] += 1
        
        # Save updated usage counts
        if replacements_made:
            self.save_vocabulary()
            
        return new_arabic, new_transliteration, replacements_made
    
    def _contains_arabic_word(self, text: str, word: str) -> bool:
        """Check if Arabic text contains the word as a separate word"""
        # Arabic word boundary detection is more complex due to connected letters
        # This is a simplified approach - you might need to refine based on your needs
        return word in text
    
    def _replace_arabic_word(self, text: str, old_word: str, new_word: str) -> str:
        """Replace Arabic word in text"""
        return text.replace(old_word, new_word)
    
    def get_vocabulary_stats(self) -> Dict:
        """Get statistics about the vocabulary"""
        total_words = len(self.vocabulary_map)
        total_usage = sum(item["usage_count"] for item in self.vocabulary_map.values())
        most_used = max(self.vocabulary_map.items(), 
                       key=lambda x: x[1]["usage_count"], 
                       default=(None, {"usage_count": 0}))
        
        return {
            "total_words": total_words,
            "total_usage": total_usage,
            "most_used_word": most_used[0] if most_used[0] else None,
            "most_used_count": most_used[1]["usage_count"]
        }

# Initialize the vocabulary replacer
vocab_replacer = LevantineVocabularyReplacer()

# Initialize with the ball example
vocab_replacer.add_replacement(
    original_arabic="كُرة",
    original_transliteration="kura", 
    new_arabic="طابة",
    new_transliteration="taabeh",
    context="sports, games",
    notes="More commonly used Levantine word for ball"
)

@app.route('/')
def index():
    return "Levantine Vocabulary Replacement Service is running!"

@app.route('/process_translation', methods=['POST'])
def process_translation():
    """Process a translation and apply vocabulary replacements"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
    
    arabic = data.get('arabic', '')
    transliteration = data.get('transliteration', '')
    
    if not arabic or not transliteration:
        return jsonify({'error': 'Missing arabic or transliteration text'}), 400
    
    try:
        # Apply replacements
        new_arabic, new_transliteration, replacements = vocab_replacer.replace_words(
            arabic, transliteration
        )
        
        response = {
            'original': {
                'arabic': arabic,
                'transliteration': transliteration
            },
            'processed': {
                'arabic': new_arabic,
                'transliteration': new_transliteration
            },
            'replacements_made': replacements,
            'has_changes': len(replacements) > 0
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error processing translation: {e}")
        return jsonify({'error': 'An error occurred during processing'}), 500

@app.route('/add_replacement', methods=['POST'])
def add_replacement():
    """Add a new word replacement to the vocabulary"""
    data = request.get_json()
    
    required_fields = ['original_arabic', 'original_transliteration', 'new_arabic', 'new_transliteration']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        vocab_replacer.add_replacement(
            original_arabic=data['original_arabic'],
            original_transliteration=data['original_transliteration'],
            new_arabic=data['new_arabic'],
            new_transliteration=data['new_transliteration'],
            context=data.get('context', ''),
            notes=data.get('notes', '')
        )
        
        return jsonify({
            'message': 'Replacement added successfully',
            'vocabulary_stats': vocab_replacer.get_vocabulary_stats()
        })
        
    except Exception as e:
        print(f"Error adding replacement: {e}")
        return jsonify({'error': 'An error occurred while adding replacement'}), 500

@app.route('/vocabulary', methods=['GET'])
def get_vocabulary():
    """Get all vocabulary replacements"""
    try:
        return jsonify({
            'vocabulary': vocab_replacer.vocabulary_map,
            'stats': vocab_replacer.get_vocabulary_stats()
        })
    except Exception as e:
        print(f"Error getting vocabulary: {e}")
        return jsonify({'error': 'An error occurred while fetching vocabulary'}), 500

@app.route('/vocabulary/<original_word>', methods=['DELETE'])
def delete_replacement(original_word):
    """Delete a word replacement"""
    try:
        if original_word in vocab_replacer.vocabulary_map:
            del vocab_replacer.vocabulary_map[original_word]
            vocab_replacer.save_vocabulary()
            return jsonify({
                'message': f'Replacement for "{original_word}" deleted successfully',
                'vocabulary_stats': vocab_replacer.get_vocabulary_stats()
            })
        else:
            return jsonify({'error': 'Word not found in vocabulary'}), 404
            
    except Exception as e:
        print(f"Error deleting replacement: {e}")
        return jsonify({'error': 'An error occurred while deleting replacement'}), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get vocabulary statistics"""
    try:
        return jsonify(vocab_replacer.get_vocabulary_stats())
    except Exception as e:
        print(f"Error getting stats: {e}")
        return jsonify({'error': 'An error occurred while fetching stats'}), 500

if __name__ == '__main__':
    print("Starting Levantine Vocabulary Replacement Service...")
    print("Initializing with 'kura' → 'taabeh' replacement for ball")
    print("Service will be available on http://127.0.0.1:5001")
    app.run(debug=True, port=5001) 