# OCR Processing

## Overview

The OCR (Optical Character Recognition) service extracts text from images and PDF documents. It's an independent service that works standalone or combined with other adapters.

## Purpose

- Extract text from document images and PDFs
- Support multiple file formats (JPEG, PNG, PDF)
- Provide confidence scores for extraction quality
- Support multiple OCR providers (AWS, Google, Tesseract)

## Use Cases

### Document Upload & Verification
```
Upload → OCR Processing → OCR Mapping → Storage → Database
```

### User Registration
```
Registration → OCR → Mapping → Validation → User Creation
```

### Quick Text Extraction
```
Upload → OCR Processing → Return Text
```

## Supported Providers

> [!NOTE]
> **Test Results**: Tested with 4 marksheet documents (English & Hindi). AWS Textract: 95-99% for English, 60-68% for Hindi (garbled). Google Gemini: 90% for both. Tesseract: 25% failure rate. See OCR Provider Comparison Report for full details.

### 1. AWS Textract

**Status**: ✅ Production Ready (English documents)

**Strengths**:
- Excellent English accuracy (95-99%)
- Fast processing (~2 seconds)
- Handles tables and forms well

**Limitations**:
- Poor Hindi/regional language support (60-68% confidence, garbled output)
- Higher cost

**Best For**: English-only production workloads

---

### 2. Google Gemini

**Status**: ✅ Production Ready (Recommended)

**Strengths**:
- Excellent multilingual support (English & Hindi: 90%)
- Handles Devanagari script perfectly
- AI-powered context understanding
- Consistent accuracy across languages

**Limitations**:
- Slower than Textract (~5-6 seconds)

**Best For**: Hindi/regional languages, mixed language documents, production systems

---

### 3. Tesseract

**Status**: ⚠️ Development/Testing Only

**Strengths**:
- Free and open-source
- Runs locally (no API costs)
- Offline processing

**Limitations**:
- 25% failure rate in testing
- Poor Hindi support (complete failure)
- Unreliable with complex layouts

**Best For**: Development/testing, not recommended for production

---

## Configuration

### Environment Variables

```bash
# Choose provider
OCR_PROVIDER=aws-textract    # For English documents
OCR_PROVIDER=google-gemini   # For Hindi/multilingual (recommended)
OCR_PROVIDER=tesseract       # For dev/testing only
```

### AWS Textract

```bash
OCR_PROVIDER=aws-textract
AWS_TEXTRACT_AWS_REGION=us-east-1
AWS_TEXTRACT_ACCESS_KEY_ID=your-key
AWS_TEXTRACT_SECRET_ACCESS_KEY=your-secret
```

### Google Gemini

```bash
OCR_PROVIDER=google-gemini
GEMINI_API_KEY=your-api-key
```

### Tesseract

```bash
OCR_PROVIDER=tesseract
# No additional config needed
```

## Supported File Types

| File Type | AWS Textract | Google Gemini | Tesseract |
|-----------|--------------|---------------|-----------|
| JPEG      | ✅           | ✅            | ✅        |
| PNG       | ✅           | ✅            | ✅        |
| PDF       | ✅           | ✅            | ❌        |
| WebP      | ❌           | ✅            | ❌        |

## Output Format

```json
{
  "fullText": "CERTIFICATE\nName: John Doe\nID: 123456...",
  "confidence": 95,
  "metadata": {
    "pageCount": 1,
    "language": "en",
    "processingTime": 2500
  }
}
```

## Provider Selection Guide

### Use AWS Textract When:
- All documents are in **English only**
- Need fastest processing (4-5 seconds)
- Processing CBSE, ICSE, English medium certificates
- Already using AWS infrastructure

⚠️ **Do not use** for Hindi/regional language documents

### Use Google Gemini When:
- Documents contain **Hindi or regional languages**
- Mixed language content (Hindi + English)
- Document language is unknown
- Need reliable accuracy across all document types
- **Production systems** (recommended default)

### Use Tesseract When:
- Development and testing environments only
- Budget constraints (no API costs)
- Simple prototyping

⚠️ **Not recommended for production**

## Performance

### Actual Test Results (4 Documents)

| Metric | AWS Textract | Google Gemini | Tesseract |
|--------|--------------|---------------|-----------|
| **OCR Time** | 2.1s | 5.8s | 2.5s |
| **Total Time** | 4.7s | 7.4s | 3.7s |
| **Success Rate** | 100% | 100% | 75% |
| **English Accuracy** | 95-99% | 90% | Unreliable |
| **Hindi Accuracy** | 60-68% (garbled) | 90% | Failed |

## Best Practices

1. **Language-Based Routing**: Detect language and use appropriate provider
2. **Validate File Types**: Check file type before processing
3. **Handle Errors Gracefully**: Return user-friendly error messages
4. **Log Performance**: Track provider and processing times
5. **Implement Retry Logic**: Retry failed extractions with exponential backoff

## Quality Tips

### Improve Accuracy:
- Use high-resolution images (300+ DPI)
- Ensure good contrast and lighting
- Upload straight, non-skewed documents
- Use clean backgrounds

### Choose Right Provider:
- English documents → AWS Textract
- Hindi/Unknown → Google Gemini
- Production → Google Gemini (safest choice)

## Troubleshooting

### Low Confidence / Garbled Text
**Cause**: Using AWS Textract on Hindi documents

**Solution**: Switch to Google Gemini
```bash
OCR_PROVIDER=google-gemini
```

### Slow Processing
**Solution**: For English-only, use AWS Textract for faster processing

### Provider Not Supported Error
**Solution**: Check exact provider name:
- `aws-textract` (not `textract`)
- `google-gemini` (not `gemini`)
- `tesseract` (not `tesseract-ocr`)

## Security

1. **Validate file types** to prevent abuse
2. **Limit file size** (e.g., 10MB max)
3. **Sanitize extracted text** before storing
4. **Store credentials** in environment variables only

## Summary

The OCR service extracts text from documents using configurable providers:

- **AWS Textract**: Best for English documents (fast, accurate)
- **Google Gemini**: Best for Hindi/multilingual (reliable, recommended)
- **Tesseract**: Development/testing only (not production-ready)

**Recommendation**: Use Google Gemini as default for production systems to handle all document types reliably.

---

## Related Documentation

- **OCR Provider Comparison Report** - Detailed test results and analysis
- **Service Adapters** - Adapter pattern architecture
- **OCR Mapping** - AI-powered field extraction
- **File Storage** - Cloud storage integration
