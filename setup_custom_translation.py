#!/usr/bin/env python3
"""
Setup script for the Custom Levantine Translation Service
This script helps initialize and test the custom translation model backend.
"""

import subprocess
import sys
import os
import requests
import json
import time

def install_requirements():
    """Install required packages"""
    print("Installing required packages...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements_custom_translation.txt"
        ])
        print("✅ Requirements installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False

def check_service_running(port=5002, max_retries=10):
    """Check if the translation service is running"""
    for i in range(max_retries):
        try:
            response = requests.get(f"http://127.0.0.1:{port}/")
            if response.status_code == 200:
                print(f"✅ Service is running on port {port}")
                return True
        except requests.exceptions.ConnectionError:
            if i == 0:
                print(f"⏳ Waiting for service to start on port {port}...")
            time.sleep(2)
    
    print(f"❌ Service not responding on port {port}")
    return False

def test_translation_api():
    """Test the translation API with sample data"""
    print("\n🧪 Testing translation API...")
    
    test_cases = [
        {"text": "ball", "context": "sports"},
        {"text": "hello", "context": "greeting"},
        {"text": "I want water", "context": "request"}
    ]
    
    for test_case in test_cases:
        try:
            response = requests.post(
                "http://127.0.0.1:5002/translate",
                json=test_case,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ '{test_case['text']}' -> '{result['arabic']}' ({result['transliteration']})")
            else:
                print(f"❌ Translation failed for '{test_case['text']}': {response.text}")
                
        except Exception as e:
            print(f"❌ Error testing '{test_case['text']}': {e}")

def test_training_data_api():
    """Test the training data API"""
    print("\n📊 Testing training data API...")
    
    try:
        response = requests.get("http://127.0.0.1:5002/training_data")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Training data: {data['total_pairs']} total pairs, {data['high_quality_pairs']} high quality")
        else:
            print(f"❌ Failed to get training data: {response.text}")
    except Exception as e:
        print(f"❌ Error getting training data: {e}")

def add_sample_training_data():
    """Add some sample training data for testing"""
    print("\n📝 Adding sample training data...")
    
    sample_pairs = [
        {
            "english": "Good morning",
            "arabic": "صباح الخير",
            "transliteration": "sabah el-kheir",
            "context": "greeting",
            "quality_score": 0.9
        },
        {
            "english": "How much",
            "arabic": "أديش",
            "transliteration": "adesh",
            "context": "question",
            "quality_score": 0.9
        },
        {
            "english": "Where are you",
            "arabic": "وينك",
            "transliteration": "wenak",
            "context": "question",
            "quality_score": 0.9
        }
    ]
    
    for pair in sample_pairs:
        try:
            response = requests.post(
                "http://127.0.0.1:5002/add_training_pair",
                json=pair,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                print(f"✅ Added: '{pair['english']}' -> '{pair['arabic']}'")
            else:
                print(f"❌ Failed to add: '{pair['english']}': {response.text}")
                
        except Exception as e:
            print(f"❌ Error adding '{pair['english']}': {e}")

def test_correction_api():
    """Test the correction API"""
    print("\n🔧 Testing correction API...")
    
    correction_data = {
        "original_english": "ball",
        "original_arabic": "كرة",
        "corrected_arabic": "طابة",
        "corrected_transliteration": "taabeh",
        "reason": "More commonly used Levantine word"
    }
    
    try:
        response = requests.post(
            "http://127.0.0.1:5002/correct_translation",
            json=correction_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✅ Correction API working - added 'kura' -> 'taabeh' correction")
        else:
            print(f"❌ Correction failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing correction: {e}")

def print_usage_instructions():
    """Print instructions for using the service"""
    print("\n" + "="*60)
    print("🎉 CUSTOM LEVANTINE TRANSLATION SERVICE SETUP COMPLETE!")
    print("="*60)
    print("\n📋 How to use your custom translation service:")
    print("\n1. 🚀 START THE SERVICE:")
    print("   python custom_translation_service.py")
    print("\n2. 🔗 API ENDPOINTS:")
    print("   • Translate: POST http://127.0.0.1:5002/translate")
    print("     Body: {'text': 'hello', 'context': 'greeting'}")
    print("   • Add correction: POST http://127.0.0.1:5002/correct_translation")
    print("   • Retrain model: POST http://127.0.0.1:5002/retrain")
    print("   • View training data: GET http://127.0.0.1:5002/training_data")
    print("\n3. 🔄 IMPROVING THE MODEL:")
    print("   • Each translation is automatically saved to the database")
    print("   • Add corrections using the correction API")
    print("   • Retrain the model periodically to improve quality")
    print("\n4. 🎯 NEXT STEPS:")
    print("   • Integrate with your frontend by changing the API endpoint")
    print("   • Add more training data manually or through corrections")
    print("   • Schedule periodic retraining (weekly/monthly)")
    print("   • Monitor model performance and training data quality")
    print("\n5. 📂 FILES CREATED:")
    print("   • levantine_translations.db - Your training database")
    print("   • levantine_model/ - Your custom model files")
    print("   • Training logs and checkpoints in model directory")

def main():
    print("🚀 Setting up Custom Levantine Translation Service...")
    print("=" * 60)
    
    # Check if we should install requirements
    install_deps = input("\n📦 Install Python dependencies? (y/n): ").lower().strip() == 'y'
    
    if install_deps:
        if not install_requirements():
            print("❌ Failed to install requirements. Please install manually.")
            return
    
    # Check if service should be tested
    test_service = input("\n🧪 Test the service? (requires service to be running) (y/n): ").lower().strip() == 'y'
    
    if test_service:
        print("\n⚠️  Make sure to start the service first:")
        print("   python custom_translation_service.py")
        input("Press Enter when the service is running...")
        
        if check_service_running():
            test_translation_api()
            test_training_data_api()
            add_sample_training_data()
            test_correction_api()
        else:
            print("❌ Service is not running. Please start it and try again.")
    
    print_usage_instructions()

if __name__ == "__main__":
    main() 