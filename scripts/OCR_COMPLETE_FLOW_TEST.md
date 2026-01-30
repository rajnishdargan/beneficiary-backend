# OCR Complete Flow Testing (Extraction + Mapping)

Simple guide to test the complete OCR pipeline: Text Extraction → Field Mapping.

## 🎯 What This Tests

### Step 1: OCR Text Extraction
- **AWS Textract** - Extract text from document
- **Google Gemini** - Extract text from document
- **Tesseract** - Extract text from document

### Step 2: OCR Mapping
- **AWS Bedrock** - Map extracted text to structured fields
- **Google Gemini** - Map extracted text to structured fields (currently disabled)

Tests all combinations: 3 OCR providers × 1 mapping provider = **3 combinations**

## 📁 Setup Test Documents

Place your test documents in this structure:
```
Test_Docs/
  └── Marksheet/
      ├── English/
      │   ├── marksheet1.jpg
      │   └── marksheet2.pdf
      └── Hindi/
          ├── marksheet1.jpg
          └── marksheet2.pdf
```

## 🔧 Configuration

Edit `scripts/test-complete-ocr-flow.js` (lines 15-25):
```javascript
const CONFIG = {
  // OCR Text Extraction Providers
  OCR_PROVIDERS: ['aws-textract', 'google-gemini', 'tesseract'],
  
  // OCR Mapping Providers (Google Gemini disabled due to model issues - need payment details)
  MAPPING_PROVIDERS: ['bedrock'],
};
```

### Common Configurations

**Test only AWS Textract + Bedrock (fastest):**
```javascript
OCR_PROVIDERS: ['aws-textract'],
MAPPING_PROVIDERS: ['bedrock'],
```

**Enable Google Gemini mapping (when fixed):**
```javascript
OCR_PROVIDERS: ['aws-textract', 'google-gemini', 'tesseract'],
MAPPING_PROVIDERS: ['bedrock', 'google-gemini'],
```

## ⚙️ Environment Variables

### Quick Setup (Recommended)
```bash
source setup-ocr-env.sh
```

### Manual Setup (if needed)
```bash
# OCR Providers
export AWS_TEXTRACT_AWS_REGION=us-east-1
export AWS_TEXTRACT_ACCESS_KEY_ID=your-key
export AWS_TEXTRACT_SECRET_ACCESS_KEY=your-secret
export GEMINI_API_KEY=your-gemini-key
export GEMINI_OCR_MODEL=gemini-1.5-flash

# Mapping Providers
export OCR_MAPPING_BEDROCK_REGION=ap-south-1
export OCR_MAPPING_BEDROCK_ACCESS_KEY_ID=your-bedrock-key
export OCR_MAPPING_BEDROCK_SECRET_ACCESS_KEY=your-bedrock-secret
export OCR_MAPPING_BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
export OCR_MAPPING_GEMINI_API_KEY=your-gemini-key
export OCR_MAPPING_GEMINI_MODEL_NAME=gemini-1.5-flash
```

## 🚀 Run Test

```bash
# Step 1: Build the project
npm run build

# Step 2: Set environment variables
source setup-ocr-env.sh

# Step 3: Run the test
node scripts/test-complete-ocr-flow.js
```

## 📊 Results

### Console Output
```
📋 Test Configuration:
   OCR Providers: aws-textract, google-gemini, tesseract
   Mapping Providers: bedrock

📄 Testing: marksheet-english.jpg
   OCR: aws-textract | Mapping: bedrock
   ✅ OCR Success (2673ms) - 972 chars
   ✅ Mapping Success (1312ms) - 8 fields

🏆 RECOMMENDATIONS
   Best Overall: OCR=aws-textract, Mapping=bedrock
   Fastest: OCR=tesseract, Mapping=bedrock
   Best for Hindi: OCR=google-gemini, Mapping=bedrock
   Best for English: OCR=aws-textract, Mapping=bedrock
```

### JSON Report
Results saved in: `test-results/complete-ocr-flow-TIMESTAMP.json`

Contains:
- **OCR Metrics**: Processing time, confidence, character count, language
- **Mapping Metrics**: Fields mapped, missing fields, processing time
- **Combined Metrics**: Total time, success rate, recommendations
- **Provider Comparison**: Performance of each combination
- **Language Analysis**: Best provider for Hindi vs English

## 🎯 What to Look For

### OCR Extraction
- ✅ Which provider extracts text successfully?
- ⚡ Which provider is fastest?
- 🎯 Which has highest confidence?
- 🌍 Which works best for your language?

### OCR Mapping
- ✅ How many fields were mapped correctly?
- ❌ Which required fields are missing?
- ⚡ How long does mapping take?
- 🎯 Which combination gives best results?

### Overall
- 💰 **Cost vs Accuracy**: AWS Textract (paid, accurate) vs Tesseract (free, less accurate)
- 🌍 **Language Support**: Google Gemini better for Hindi, AWS Textract better for English
- ⚡ **Speed**: Tesseract fastest for extraction, but may need more mapping time

## 💡 Production Recommendations

Based on typical results:

### For English Documents
```
✅ RECOMMENDED: AWS Textract + Bedrock
- Fast extraction (1-2 seconds)
- High accuracy (95%+ confidence)
- Reliable field mapping
```

### For Hindi Documents
```
✅ RECOMMENDED: Google Gemini + Bedrock
- Better Hindi character recognition
- Good accuracy for Devanagari script
- Reliable field mapping
```

### For Budget-Conscious
```
⚡ OPTION: Tesseract + Bedrock
- Free OCR extraction
- Slower and less accurate
- May need manual verification
```

## 🔧 Troubleshooting

### Google Gemini Mapping Not Working?
**Issue**: Model returns 404 errors

**Solution**: Keep it disabled in CONFIG:
```javascript
MAPPING_PROVIDERS: ['bedrock'],  // Only Bedrock
```

### Want Faster Tests?
Test only one OCR provider:
```javascript
OCR_PROVIDERS: ['aws-textract'],  // Fastest
```

### Need More Details?
Check the JSON report in `test-results/` folder for complete metrics.

## 📝 Next Steps

1. ✅ Run test with your actual documents
2. ✅ Review the recommendations in the report
3. ✅ Choose the best provider combination for your use case
4. ✅ Update production configuration accordingly
5. ⏳ Re-test when Google Gemini mapping is fixed
