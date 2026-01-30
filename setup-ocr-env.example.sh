#!/bin/bash

# OCR Testing Environment Variables Setup Script
# Usage: 
#   1. Copy this file: cp setup-ocr-env.example.sh setup-ocr-env.sh
#   2. Replace placeholder values with your actual credentials
#   3. Run: source setup-ocr-env.sh

echo "🔧 Setting up OCR Testing Environment Variables..."

# ============================================
# OCR PROVIDERS (Text Extraction)
# ============================================

# AWS Textract
export AWS_TEXTRACT_AWS_REGION=ap-south-1
export AWS_TEXTRACT_ACCESS_KEY_ID=your-aws-access-key-id
export AWS_TEXTRACT_SECRET_ACCESS_KEY=your-aws-secret-access-key

# Google Gemini OCR (using stable model)
export GEMINI_API_KEY=your-gemini-api-key
export GEMINI_OCR_MODEL=gemini-3-pro-preview

# Tesseract (no configuration needed - runs locally)

# ============================================
# MAPPING PROVIDERS (Data Structuring)
# ============================================

# AWS Bedrock (for OCR Mapping)
export OCR_MAPPING_BEDROCK_REGION=ap-south-1
export OCR_MAPPING_BEDROCK_ACCESS_KEY_ID=your-aws-access-key-id
export OCR_MAPPING_BEDROCK_SECRET_ACCESS_KEY=your-aws-secret-access-key
export OCR_MAPPING_BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

# Google Gemini (for OCR Mapping) - using stable model
export OCR_MAPPING_GEMINI_API_KEY=your-gemini-api-key
export OCR_MAPPING_GEMINI_MODEL_NAME=gemini-3-flash-preview

echo "✅ Environment variables set successfully!"
echo ""
echo "📋 Configured Providers:"
echo "   OCR Extraction: AWS Textract, Google Gemini (gemini-2.5-flash-lite), Tesseract"
echo "   OCR Mapping: AWS Bedrock (Claude 3 Haiku), Google Gemini (gemini-3-flash-preview)"
echo ""
echo "🚀 You can now run:"
echo "   node scripts/standalone-ocr-test.js          # Test OCR extraction only"
echo "   node scripts/test-complete-ocr-flow.js       # Test complete flow (recommended)"
echo ""
