from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os
import torch
from transformers import (
    AutoTokenizer, 
    AutoModelForSeq2SeqLM, 
    Trainer, 
    TrainingArguments,
    DataCollatorForSeq2Seq
)
from datasets import Dataset
import numpy as np
from datetime import datetime
import logging
from typing import List, Dict, Tuple, Optional
import threading
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class LevantineTranslationDB:
    def __init__(self, db_path='levantine_translations.db'):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the SQLite database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Translation pairs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS translation_pairs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                english_text TEXT NOT NULL,
                arabic_text TEXT NOT NULL,
                transliteration TEXT,
                context TEXT,
                quality_score REAL DEFAULT 0.0,
                user_feedback INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Model training history
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS training_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_version TEXT NOT NULL,
                training_data_count INTEGER,
                training_loss REAL,
                validation_loss REAL,
                training_time REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # User corrections and feedback
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_corrections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_english TEXT NOT NULL,
                original_arabic TEXT NOT NULL,
                corrected_arabic TEXT NOT NULL,
                corrected_transliteration TEXT,
                correction_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
    
    def add_translation_pair(self, english: str, arabic: str, transliteration: str = "", 
                           context: str = "", quality_score: float = 0.0):
        """Add a new translation pair to the database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO translation_pairs 
            (english_text, arabic_text, transliteration, context, quality_score)
            VALUES (?, ?, ?, ?, ?)
        ''', (english, arabic, transliteration, context, quality_score))
        
        conn.commit()
        conn.close()
        logger.info(f"Added translation pair: {english} -> {arabic}")
    
    def get_training_data(self, min_quality: float = 0.0) -> List[Dict]:
        """Get training data above a certain quality threshold"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT english_text, arabic_text, transliteration, context, quality_score
            FROM translation_pairs 
            WHERE quality_score >= ?
            ORDER BY quality_score DESC
        ''', (min_quality,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [
            {
                'english': row[0],
                'arabic': row[1],
                'transliteration': row[2],
                'context': row[3],
                'quality_score': row[4]
            }
            for row in rows
        ]
    
    def add_user_correction(self, original_english: str, original_arabic: str, 
                          corrected_arabic: str, corrected_transliteration: str = "",
                          reason: str = ""):
        """Add user correction to improve the model"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO user_corrections 
            (original_english, original_arabic, corrected_arabic, corrected_transliteration, correction_reason)
            VALUES (?, ?, ?, ?, ?)
        ''', (original_english, original_arabic, corrected_arabic, corrected_transliteration, reason))
        
        # Also add the corrected version as a high-quality training pair
        cursor.execute('''
            INSERT INTO translation_pairs 
            (english_text, arabic_text, transliteration, context, quality_score)
            VALUES (?, ?, ?, ?, ?)
        ''', (original_english, corrected_arabic, corrected_transliteration, "user_corrected", 0.9))
        
        conn.commit()
        conn.close()
        logger.info(f"Added user correction: {original_arabic} -> {corrected_arabic}")

class LevantineTranslationModel:
    def __init__(self, model_path='./levantine_model', base_model='t5-small'):
        self.model_path = model_path
        self.base_model = base_model
        self.tokenizer = None
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")
        
        self.load_or_initialize_model()
    
    def load_or_initialize_model(self):
        """Load existing fine-tuned model or initialize from base model"""
        try:
            if os.path.exists(self.model_path):
                logger.info(f"Loading existing model from {self.model_path}")
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
                self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_path).to(self.device)
            else:
                logger.info(f"Initializing new model from {self.base_model}")
                self.tokenizer = AutoTokenizer.from_pretrained(self.base_model)
                self.model = AutoModelForSeq2SeqLM.from_pretrained(self.base_model).to(self.device)
                
                # Save the initial model
                os.makedirs(self.model_path, exist_ok=True)
                self.save_model()
                
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    
    def save_model(self):
        """Save the current model and tokenizer"""
        self.model.save_pretrained(self.model_path)
        self.tokenizer.save_pretrained(self.model_path)
        logger.info(f"Model saved to {self.model_path}")
    
    def translate(self, text: str, max_length: int = 128) -> Tuple[str, float]:
        """Translate English text to Levantine Arabic"""
        try:
            # Prepare input with task prefix for T5
            input_text = f"translate English to Levantine Arabic: {text}"
            
            # Tokenize input
            inputs = self.tokenizer(
                input_text, 
                return_tensors="pt", 
                max_length=max_length,
                truncation=True,
                padding=True
            ).to(self.device)
            
            # Generate translation
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_length=max_length,
                    num_beams=4,
                    early_stopping=True,
                    do_sample=True,
                    temperature=0.7,
                    pad_token_id=self.tokenizer.pad_token_id
                )
            
            # Decode output
            translation = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Calculate confidence score (simplified)
            confidence = min(0.8, len(translation) / (len(text) * 1.5))
            
            return translation, confidence
            
        except Exception as e:
            logger.error(f"Translation error: {e}")
            return f"Translation error: {str(e)}", 0.0
    
    def prepare_training_data(self, training_pairs: List[Dict]) -> Dataset:
        """Prepare training data for fine-tuning"""
        inputs = []
        targets = []
        
        for pair in training_pairs:
            # Create input with task instruction
            input_text = f"translate English to Levantine Arabic: {pair['english']}"
            
            # Target is the Arabic translation
            target_text = pair['arabic']
            
            inputs.append(input_text)
            targets.append(target_text)
        
        # Tokenize the data
        model_inputs = self.tokenizer(
            inputs, 
            max_length=128, 
            truncation=True, 
            padding=True
        )
        
        # Tokenize targets
        with self.tokenizer.as_target_tokenizer():
            labels = self.tokenizer(
                targets, 
                max_length=128, 
                truncation=True, 
                padding=True
            )
        
        # Replace padding token id's in labels with -100
        labels["input_ids"] = [
            [-100 if token == self.tokenizer.pad_token_id else token for token in label]
            for label in labels["input_ids"]
        ]
        
        model_inputs["labels"] = labels["input_ids"]
        
        return Dataset.from_dict(model_inputs)
    
    def fine_tune(self, training_data: List[Dict], epochs: int = 3, batch_size: int = 4):
        """Fine-tune the model with new training data"""
        logger.info(f"Starting fine-tuning with {len(training_data)} examples")
        
        try:
            # Prepare dataset
            dataset = self.prepare_training_data(training_data)
            
            # Training arguments
            training_args = TrainingArguments(
                output_dir=f"{self.model_path}/training_checkpoints",
                num_train_epochs=epochs,
                per_device_train_batch_size=batch_size,
                per_device_eval_batch_size=batch_size,
                warmup_steps=100,
                weight_decay=0.01,
                logging_dir=f"{self.model_path}/logs",
                logging_steps=10,
                save_steps=500,
                evaluation_strategy="no",  # No validation set for now
                save_total_limit=2,
                load_best_model_at_end=False,
                dataloader_num_workers=0,  # Avoid multiprocessing issues
            )
            
            # Data collator
            data_collator = DataCollatorForSeq2Seq(
                self.tokenizer,
                model=self.model,
                padding=True
            )
            
            # Create trainer
            trainer = Trainer(
                model=self.model,
                args=training_args,
                train_dataset=dataset,
                data_collator=data_collator,
                tokenizer=self.tokenizer,
            )
            
            # Train
            start_time = time.time()
            training_result = trainer.train()
            training_time = time.time() - start_time
            
            # Save the fine-tuned model
            self.save_model()
            
            logger.info(f"Fine-tuning completed in {training_time:.2f} seconds")
            return {
                'training_loss': training_result.training_loss,
                'training_time': training_time,
                'epochs': epochs,
                'data_count': len(training_data)
            }
            
        except Exception as e:
            logger.error(f"Fine-tuning error: {e}")
            return {'error': str(e)}

# Initialize components
db = LevantineTranslationDB()
model = LevantineTranslationModel()

# Initialize with some basic Levantine translations
def initialize_basic_vocabulary():
    """Initialize the database with basic Levantine vocabulary"""
    basic_pairs = [
        ("ball", "طابة", "taabeh", "sports, games"),
        ("hello", "مرحبا", "marhaba", "greeting"),
        ("thank you", "شكراً", "shukran", "gratitude"),
        ("I want", "بدي", "biddi", "desire"),
        ("house", "بيت", "bayt", "home"),
        ("water", "مي", "mayy", "drink"),
        ("food", "أكل", "akl", "eating"),
        ("good", "منيح", "mneeh", "quality"),
        ("how are you", "كيفك", "kifak", "greeting"),
        ("what", "شو", "shu", "question"),
    ]
    
    for english, arabic, transliteration, context in basic_pairs:
        db.add_translation_pair(english, arabic, transliteration, context, 0.8)
    
    logger.info("Initialized basic vocabulary")

# Initialize basic vocabulary if database is empty
try:
    if len(db.get_training_data()) == 0:
        initialize_basic_vocabulary()
except:
    pass

@app.route('/')
def index():
    return "Custom Levantine Translation Service is running!"

@app.route('/translate', methods=['POST'])
def translate():
    """Translate text using the custom model"""
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'error': 'Missing text to translate'}), 400
    
    text = data['text'].strip()
    context = data.get('context', '')
    
    if not text:
        return jsonify({'error': 'Empty text provided'}), 400
    
    try:
        # Translate using custom model
        arabic_translation, confidence = model.translate(text)
        
        # For now, generate a simple transliteration (you can enhance this)
        transliteration = generate_simple_transliteration(arabic_translation)
        
        # Store the translation in database for future training
        db.add_translation_pair(text, arabic_translation, transliteration, context, confidence)
        
        response = {
            'english': text,
            'arabic': arabic_translation,
            'transliteration': transliteration,
            'confidence': confidence,
            'context': context,
            'model_version': 'custom-levantine-v1'
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return jsonify({'error': f'Translation failed: {str(e)}'}), 500

@app.route('/correct_translation', methods=['POST'])
def correct_translation():
    """Accept user corrections to improve the model"""
    data = request.get_json()
    
    required_fields = ['original_english', 'original_arabic', 'corrected_arabic']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400
    
    try:
        db.add_user_correction(
            original_english=data['original_english'],
            original_arabic=data['original_arabic'],
            corrected_arabic=data['corrected_arabic'],
            corrected_transliteration=data.get('corrected_transliteration', ''),
            reason=data.get('reason', '')
        )
        
        return jsonify({
            'message': 'Correction added successfully',
            'note': 'This will be used to improve the model in the next training cycle'
        })
        
    except Exception as e:
        logger.error(f"Error adding correction: {e}")
        return jsonify({'error': f'Failed to add correction: {str(e)}'}), 500

@app.route('/retrain', methods=['POST'])
def retrain_model():
    """Retrain the model with accumulated data"""
    data = request.get_json() or {}
    min_quality = data.get('min_quality', 0.5)
    epochs = data.get('epochs', 3)
    
    try:
        # Get training data
        training_data = db.get_training_data(min_quality=min_quality)
        
        if len(training_data) < 10:
            return jsonify({
                'error': f'Insufficient training data. Need at least 10 pairs, have {len(training_data)}'
            }), 400
        
        # Fine-tune the model
        result = model.fine_tune(training_data, epochs=epochs)
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 500
        
        return jsonify({
            'message': 'Model retrained successfully',
            'training_data_count': len(training_data),
            'training_loss': result.get('training_loss'),
            'training_time': result.get('training_time'),
            'epochs': result.get('epochs')
        })
        
    except Exception as e:
        logger.error(f"Retraining error: {e}")
        return jsonify({'error': f'Retraining failed: {str(e)}'}), 500

@app.route('/training_data', methods=['GET'])
def get_training_data():
    """Get current training data statistics"""
    try:
        all_data = db.get_training_data(min_quality=0.0)
        high_quality = db.get_training_data(min_quality=0.7)
        
        return jsonify({
            'total_pairs': len(all_data),
            'high_quality_pairs': len(high_quality),
            'recent_pairs': all_data[:10] if all_data else []
        })
        
    except Exception as e:
        logger.error(f"Error getting training data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/add_training_pair', methods=['POST'])
def add_training_pair():
    """Manually add a training pair"""
    data = request.get_json()
    
    required_fields = ['english', 'arabic']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400
    
    try:
        db.add_translation_pair(
            english=data['english'],
            arabic=data['arabic'],
            transliteration=data.get('transliteration', ''),
            context=data.get('context', ''),
            quality_score=data.get('quality_score', 0.8)
        )
        
        return jsonify({'message': 'Training pair added successfully'})
        
    except Exception as e:
        logger.error(f"Error adding training pair: {e}")
        return jsonify({'error': str(e)}), 500

def generate_simple_transliteration(arabic_text: str) -> str:
    """Generate a simple transliteration (placeholder - can be enhanced)"""
    # This is a very basic transliteration - you can enhance this
    transliteration_map = {
        'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': '7',
        'خ': 'kh', 'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's',
        'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': '3',
        'غ': 'gh', 'ف': 'f', 'ق': '2', 'ك': 'k', 'ل': 'l', 'م': 'm',
        'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'eh', 'ى': 'a'
    }
    
    result = ""
    for char in arabic_text:
        if char in transliteration_map:
            result += transliteration_map[char]
        elif char == ' ':
            result += ' '
        else:
            result += char  # Keep non-Arabic characters as is
    
    return result

if __name__ == '__main__':
    print("Starting Custom Levantine Translation Service...")
    print("Features:")
    print("- Custom fine-tunable translation model")
    print("- Training data accumulation")
    print("- User correction system")
    print("- Model retraining capabilities")
    print("Service will be available on http://127.0.0.1:5002")
    
    app.run(debug=True, port=5002) 