# Document Processing

The beneficiary backend processes various document types (certificates, IDs, forms) through an automated pipeline that extracts, validates, and stores information.

## Key Features

- 📸 Upload any document (JPEG, PNG, PDF)
- 🔍 Extract text using OCR (supports English and Hindi)
- 🤖 AI-powered field extraction
- ☁️ Secure cloud storage
- ✅ Automatic validation
- 🌐 Multi-language support (English, Hindi, regional languages)

> [!IMPORTANT]
> **Language Support**: Different OCR providers have different language capabilities. Google Gemini is recommended for Hindi/regional language documents, while AWS Textract excels with English-only documents. See OCR Provider Comparison for detailed analysis.

## Processing Flow

### Standard Document Upload
```
Upload → OCR Processing → AI Mapping → Storage → Database
Time: 5-15 seconds
```

### Profile Picture Upload
```
Upload → Storage → Database
Time: 0.5-2 seconds
```

### Registration with Document
```
Upload → OCR → Mapping → Validation → Storage → User Creation
Time: 6-18 seconds
```

## Service Independence

Each service is built using the **Adapter Pattern**, meaning:
- ✅ Services work independently or together
- ✅ Easy to switch providers via configuration
- ✅ No tight coupling between services
- ✅ Testable and maintainable

## Pages in This Section

- **Service Adapters** - Adapter pattern and architecture
- **OCR Processing** - Text extraction from images/PDFs
- **OCR Mapping** - AI-powered field extraction
- **File Storage** - Cloud storage (S3, GCS, Azure)
- **OCR Provider Comparison** - Detailed test results and provider selection guide

## Quick Reference

### Choosing an OCR Provider

| Your Scenario | Recommended Provider | Why |
|---------------|---------------------|-----|
| Hindi/Regional language documents | **Google Gemini** | Only reliable option for Hindi (90% accuracy) |
| English-only documents | **AWS Textract** | Fastest (4.7s) with 95-99% accuracy |
| Mixed/Unknown language | **Google Gemini** | Handles all languages reliably |
| Production system | **Google Gemini** | Best overall reliability |
| Development/Testing | **Tesseract** | Free, but not for production |

📊 **See detailed analysis**: OCR Provider Comparison Report

