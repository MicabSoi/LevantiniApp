# Custom Levantine Translation Service

A self-improving, fine-tunable translation service specifically designed for Levantine Arabic. This service creates your own language model database that learns and improves over time.

## 🎯 Key Features

- **Custom Fine-tunable Model**: Uses T5-small as a base, fine-tuned for Levantine Arabic
- **Learning Database**: SQLite database that accumulates translation pairs for training
- **User Correction System**: Accept and learn from user corrections
- **Automatic Improvement**: Model gets better with usage and corrections
- **Quality Tracking**: Tracks translation quality and confidence scores
- **Retraining API**: Easily retrain the model with new data

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements_custom_translation.txt
```

Or run the setup script:
```bash
python setup_custom_translation.py
```

### 2. Start the Service

```bash
python custom_translation_service.py
```

The service will start on `http://127.0.0.1:5002`

### 3. Test the Service

```bash
curl -X POST http://127.0.0.1:5002/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "ball", "context": "sports"}'
```

## 📡 API Endpoints

### Translation

**POST** `/translate`
```json
{
  "text": "hello",
  "context": "greeting"
}
```

Response:
```json
{
  "english": "hello",
  "arabic": "مرحبا",
  "transliteration": "marhaba",
  "confidence": 0.85,
  "context": "greeting",
  "model_version": "custom-levantine-v1"
}
```

### Add Correction

**POST** `/correct_translation`
```json
{
  "original_english": "ball",
  "original_arabic": "كرة",
  "corrected_arabic": "طابة",
  "corrected_transliteration": "taabeh",
  "reason": "More commonly used Levantine word"
}
```

### Retrain Model

**POST** `/retrain`
```json
{
  "min_quality": 0.5,
  "epochs": 3
}
```

### View Training Data

**GET** `/training_data`

Returns statistics about your accumulated training data.

### Add Training Pair

**POST** `/add_training_pair`
```json
{
  "english": "Good morning",
  "arabic": "صباح الخير",
  "transliteration": "sabah el-kheir",
  "context": "greeting",
  "quality_score": 0.9
}
```

## 🔄 How It Works

### 1. **Initial Model**
- Starts with T5-small (lightweight, fast)
- Pre-loaded with basic Levantine vocabulary
- Includes words like "طابة" (taabeh) for ball

### 2. **Learning Process**
- Every translation is stored in the database
- User corrections are marked as high-quality training data
- Quality scores help filter training data

### 3. **Model Improvement**
- Periodic retraining with accumulated data
- Higher quality translations get more weight
- Model learns from corrections and usage patterns

### 4. **Database Structure**
- `translation_pairs`: Stores all translations with quality scores
- `user_corrections`: Tracks user improvements
- `training_history`: Logs model training sessions

## 🔧 Integration with Your Frontend

Replace your current Gemini API calls with the custom service:

```javascript
// Instead of calling Gemini API
const response = await fetch('http://127.0.0.1:5002/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    text: word, 
    context: context 
  })
});

const result = await response.json();
```

## 📈 Improving Your Model

### 1. **Add Corrections**
When users notice incorrect translations:
```javascript
await fetch('http://127.0.0.1:5002/correct_translation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    original_english: "ball",
    original_arabic: "كرة",
    corrected_arabic: "طابة",
    corrected_transliteration: "taabeh",
    reason: "More commonly used in Levantine"
  })
});
```

### 2. **Regular Retraining**
Schedule weekly/monthly retraining:
```javascript
await fetch('http://127.0.0.1:5002/retrain', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    min_quality: 0.6,
    epochs: 5
  })
});
```

### 3. **Monitor Progress**
Check your training data quality:
```javascript
const stats = await fetch('http://127.0.0.1:5002/training_data')
  .then(r => r.json());
console.log(`${stats.high_quality_pairs} high-quality pairs ready for training`);
```

## 🎯 Advantages Over External APIs

1. **Complete Control**: Own your model and data
2. **Cost Effective**: No per-request API costs
3. **Customizable**: Fine-tune for your specific vocabulary
4. **Privacy**: All data stays on your server
5. **Offline Capable**: Works without internet connection
6. **Learning**: Gets better with your specific use cases

## 📊 Quality Metrics

The service tracks several quality indicators:

- **Confidence Score**: Model's confidence in translation (0-1)
- **Quality Score**: Human-assessed quality (0-1)
- **Usage Count**: How often corrections are applied
- **Training Loss**: How well the model is learning

## 🔍 Monitoring and Maintenance

### View Model Performance
```bash
# Check training data
curl http://127.0.0.1:5002/training_data

# Check vocabulary stats
curl http://127.0.0.1:5002/stats
```

### Database Locations
- **Training Database**: `levantine_translations.db`
- **Model Files**: `levantine_model/`
- **Training Logs**: `levantine_model/logs/`

## 🚨 Troubleshooting

### Common Issues

1. **"CUDA not available"**: The service will use CPU, which is slower but functional
2. **Low translation quality**: Add more training data and corrections
3. **Out of memory**: Reduce batch size in retraining

### Performance Tips

1. **Start Small**: Begin with the basic model and gradually add data
2. **Quality Over Quantity**: Focus on high-quality training pairs
3. **Regular Retraining**: Retrain weekly with new corrections
4. **Monitor Metrics**: Keep track of quality scores and confidence

## 🔮 Future Enhancements

- **Larger Base Models**: Upgrade to T5-base or mT5 for better quality
- **Automatic Transliteration**: Improve the transliteration system
- **Batch Processing**: Handle multiple translations simultaneously
- **A/B Testing**: Compare model versions
- **Export/Import**: Share trained models between deployments

## 🤝 Contributing Training Data

Your service will improve over time as you:
- Correct translations through the API
- Add high-quality translation pairs
- Provide context for translations
- Regular retraining cycles

Each correction you make helps build a better Levantine Arabic translator specifically tailored to your needs!

---

**Note**: This is a complete replacement for external APIs like Gemini or OpenAI for translation. The model starts basic but becomes increasingly sophisticated with use and training. 