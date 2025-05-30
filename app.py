# app.py

from flask import Flask, request, jsonify
from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer
import torch
import os

app = Flask(__name__)

# Load the M2M100 model and tokenizer
# Using the 418M parameter version as a starting point
model_name = "facebook/m2m100_418M"

# Check if a CUDA GPU is available and use it, otherwise use CPU
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load tokenizer first
print(f"Loading tokenizer {model_name}...")
tokenizer = M2M100Tokenizer.from_pretrained(model_name)
print("Tokenizer loaded.")

# Load model
print(f"Loading model {model_name}... This may take a while.")
model = M2M100ForConditionalGeneration.from_pretrained(model_name).to(device)
model.eval() # Set the model to evaluation mode
print("Model loaded.")

# Define language codes
# M2M100 uses ISO 639-1 codes
SOURCE_LANG = "en" # English
# Levantine Arabic doesn't have a specific ISO 639-1 code.
# 'ar' is the code for Modern Standard Arabic (MSA). M2M100 might lean towards MSA.
# We will use 'ar' for now, and may need prompt engineering or fine-tuning 
# if the results are not colloquial enough.
TARGET_LANG = "ar" # Arabic (MSA, as a proxy for Levantine)

tokenizer.src_lang = SOURCE_LANG

# API Endpoint for Translation
@app.route('/translate', methods=['POST'])
def translate():
    data = request.get_json()
    text_to_translate = data.get('text')
    context_text = data.get('context', '') # Optional context

    if not text_to_translate:
        return jsonify({'error': 'Missing text to translate'}), 400

    print(f"Received translation request: \"{text_to_translate}\" (Context: \"{context_text}\")")

    try:
        # Prepare input for the model
        # M2M100 expects source text prefixed with source language code
        # We will include the context in the input text for the model
        # You might need to experiment with prompt formatting here too.
        if context_text:
             # Example prompt engineering: include context instruction
            input_text = f"Translate to {TARGET_LANG} in Levantine dialect considering this context: {context_text}. Text: {text_to_translate}"
        else:
            input_text = text_to_translate

        # Tokenize the input text
        encoded = tokenizer(input_text, return_tensors="pt").to(device)

        # Generate translation
        # Force the target language id as the first generated token
        # See Hugging Face docs: https://huggingface.co/docs/transformers/model_doc/m2m_100
        forced_bos_token_id = tokenizer.get_lang_id(TARGET_LANG)
        generated_tokens = model.generate(
            **encoded,
            forced_bos_token_id=forced_bos_token_id,
            max_length=512, # Limit output length
            num_beams=5, # Use beam search for better quality
            early_stopping=True
        )

        # Decode the generated tokens
        translated_text = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]

        print(f"Translation result: {translated_text}")

        # --- Placeholder for generating other required fields ---
        # M2M100 primarily provides the main translation.
        # Generating transliteration, example sentences, etc., directly from M2M100
        # might require a more complex setup or a different approach.
        # For now, we'll return the main Arabic translation and placeholders.
        # You might need to use a separate library or model for transliteration 
        # or generate example sentences based on the translated text.
        # Alternatively, you could try to heavily prompt M2M100 to return JSON, 
        # similar to what you did with Gemini, but this is not its primary use case.
        # Let's just return the core Arabic translation for now.
        
        # Basic attempt to return the core translation
        response_data = {
            "arabic": translated_text,
            "transliteration": "Transliteration Placeholder", # M2M100 doesn't provide this directly
            "exampleArabic": "Example Sentence Placeholder",
            "exampleTransliteration": "Example Transliteration Placeholder",
        }
        # If context was provided, add context translation placeholders
        if context_text:
             response_data["contextArabic"] = "Context Arabic Placeholder"
             response_data["contextTransliteration"] = "Context Transliteration Placeholder"
        # --- End Placeholder Section ---

        return jsonify(response_data)

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'An error occurred during translation'}), 500

# Add a simple root route
@app.route('/')
def index():
    return "M2M100 Translation Backend is running!"

# To run the Flask app (in a development server):
if __name__ == '__main__':
    # You can change the port if needed
    app.run(debug=True, port=5000)

# Note: Running with `debug=True` is useful for development but should be 
# turned off for production.

# To run this, save it as `app.py` and run `python app.py` in your terminal.
# You'll then need to update your frontend to send requests to http://127.0.0.1:5000/translate 