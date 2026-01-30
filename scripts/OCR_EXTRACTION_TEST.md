# OCR Text Extraction Testing

Simple guide to test OCR text extraction providers.

## 🎯 What This Tests
- **AWS Textract** - Text extraction
- **Google Gemini** - Text extraction  
- **Tesseract** - Text extraction (free, no API key needed)

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

Edit `scripts/standalone-ocr-test.js` if needed (default tests all 3 providers):
```javascript
const CONFIG = {
  OCR_PROVIDERS: ['aws-textract', 'google-gemini', 'tesseract'],
};
```

## ⚙️ Environment Variables

### Quick Setup (Recommended)
```bash
source setup-ocr-env.sh
```

### Manual Setup (if needed)
```bash
# AWS Textract
export AWS_TEXTRACT_AWS_REGION=us-east-1
export AWS_TEXTRACT_ACCESS_KEY_ID=your-key
export AWS_TEXTRACT_SECRET_ACCESS_KEY=your-secret

# Google Gemini
export GEMINI_API_KEY=your-gemini-key
export GEMINI_OCR_MODEL=gemini-1.5-flash

# Tesseract (no setup needed - works out of the box)
```

## 🚀 Run Test

```bash
node scripts/standalone-ocr-test.js
```

## 📊 Results

### Console Output
```
📄 Testing: marksheet-english.jpg
   Provider: aws-textract
   ✅ Success (1234ms) - 856 chars, Confidence: 95%
   Language: english
```

### JSON Report
Results saved in: `test-results/ocr-test-TIMESTAMP.json`

Contains:
- Processing time for each provider
- Text extraction success/failure
- Character count and confidence
- Language detection
- Recommendations for best provider per language

## 🎯 What to Look For

- ✅ **Success Rate** - Which provider extracts text successfully?
- ⚡ **Speed** - Which provider is fastest?
- 🎯 **Accuracy** - Which provider has highest confidence?
- 🌍 **Language Support** - Which provider works best for Hindi/English?

## 💡 Quick Tips

- **No API keys?** Tesseract works without any setup
- **Hindi documents?** Google Gemini usually performs best
- **English documents?** AWS Textract is typically fastest and most accurate
- **Budget conscious?** Tesseract is free but less accurate
