# OCR Testing Scripts

Two standalone scripts for testing OCR functionality.

## 📁 Scripts

### 1. `standalone-ocr-test.js` - OCR Text Extraction Only
Tests OCR text extraction from documents.

**Providers tested:**
- AWS Textract
- Google Gemini
- Tesseract

**Guide:** See [OCR_EXTRACTION_TEST.md](./OCR_EXTRACTION_TEST.md)

---

### 2. `test-complete-ocr-flow.js` - Complete OCR Pipeline ⭐ RECOMMENDED
Tests the complete flow: Text Extraction → Field Mapping

**OCR Extraction providers:**
- AWS Textract
- Google Gemini
- Tesseract

**OCR Mapping providers:**
- AWS Bedrock
- Google Gemini (currently disabled)

**Guide:** See [OCR_COMPLETE_FLOW_TEST.md](./OCR_COMPLETE_FLOW_TEST.md)

---

## 🚀 Quick Start

### Initial Setup (First Time Only)
```bash
# Create your environment configuration from the example
cp setup-ocr-env.example.sh setup-ocr-env.sh

# Edit setup-ocr-env.sh and replace placeholder values with your actual credentials
# Note: setup-ocr-env.sh is gitignored to prevent committing secrets
```

### Test OCR Extraction Only
```bash
# Setup environment
source setup-ocr-env.sh

# Run test
node scripts/standalone-ocr-test.js
```

### Test Complete Flow (Extraction + Mapping)
```bash
# Build project
npm run build

# Setup environment
source setup-ocr-env.sh

# Run test
node scripts/test-complete-ocr-flow.js
```

---

## 📊 Results

Results are saved in `test-results/` folder:
- `ocr-test-TIMESTAMP.json` - Extraction only results
- `complete-ocr-flow-TIMESTAMP.json` - Complete flow results

---

## 📝 Documentation

- **OCR Extraction Testing:** [OCR_EXTRACTION_TEST.md](./OCR_EXTRACTION_TEST.md)
- **Complete Flow Testing:** [OCR_COMPLETE_FLOW_TEST.md](./OCR_COMPLETE_FLOW_TEST.md)

---

## 🔧 Other Scripts

### `encrypt-fields-migration.ts`
Migrates existing database records to use field-level encryption.

**Guide:** See [ENCRYPTION-FIELD-MIGRATION.md](./ENCRYPTION-FIELD-MIGRATION.md)

### `key-rotation.ts`
Rotates encryption keys for encrypted fields.

**Guide:** See [KEY-ROTATION.md](./KEY-ROTATION.md)

### `check-unused-language-constants.js`
Checks for unused language constants in the codebase.

```bash
node scripts/check-unused-language-constants.js
```
