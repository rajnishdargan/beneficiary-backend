#!/usr/bin/env node

/**
 * Complete OCR + Mapping Flow Testing Script
 * ==========================================
 * 
 * Tests the entire document processing pipeline:
 * 1. OCR Text Extraction (AWS Textract, Google Gemini, Tesseract)
 * 2. OCR Mapping (Bedrock, Google Gemini)
 * 3. Generates comprehensive reports for production decisions
 * 
 * CONFIGURATION:
 * - Modify the CONFIG object below to control which providers to test
 * - OCR_PROVIDERS: Which text extraction providers to test
 * - MAPPING_PROVIDERS: Which mapping providers to test
 * 
 * USAGE:
 * 1. Set environment variables: source set-ocr-env-stable.sh
 * 2. Run: node scripts/test-complete-ocr-flow.js
 * 3. Check results in test-results/ folder
 */

const fs = require('fs');
const path = require('path');
const { TextExtractorFactory } = require('../dist/src/services/ocr/factories/text-extractor.factory');

// ============================================================================
// CONFIGURATION - Modify these to control which providers to test
// ============================================================================
const CONFIG = {
  // Test documents path
  TEST_DOCS_PATH: '/home/ttpl-rt-171/Documents/Piramal/Beneficiary/beneficiary-backend/Test_Docs',
  OUTPUT_DIR: '/home/ttpl-rt-171/Documents/Piramal/Beneficiary/beneficiary-backend/test-results',
  
  // OCR Text Extraction Providers to test
  // Options: 'aws-textract', 'google-gemini', 'tesseract'
  OCR_PROVIDERS: ['aws-textract', 'google-gemini', 'tesseract'],
  
  // OCR Mapping Providers to test
  // Options: 'bedrock', 'google-gemini'
  MAPPING_PROVIDERS: ['bedrock'], // Only Bedrock (Gemini has token limit issue using free model - need payement to use more tokens)
};

class CompleteOcrFlowTester {
  constructor() {
    this.ocrProviders = CONFIG.OCR_PROVIDERS;
    this.mappingProviders = CONFIG.MAPPING_PROVIDERS;
    this.results = [];
    this.mockVcFields = this.getMockVcFields();
    
    // Display configuration
    console.log('\n📋 Test Configuration:');
    console.log(`   OCR Providers: ${this.ocrProviders.join(', ')}`);
    console.log(`   Mapping Providers: ${this.mappingProviders.join(', ')}`);
    console.log(`   Test Docs Path: ${CONFIG.TEST_DOCS_PATH}`);
  }

  /**
   * Get mock vcFields for testing
   * This simulates the vcFields configuration from database
   */
  getMockVcFields() {
    return {
      marksheet: {
        studentName: { type: 'string', required: true, label: 'Student Name' },
        rollNumber: { type: 'string', required: true, label: 'Roll Number' },
        marks: { type: 'string', required: true, label: 'Marks' },
        percentage: { type: 'string', required: false, label: 'Percentage' },
        grade: { type: 'string', required: false, label: 'Grade' },
        passingYear: { type: 'string', required: false, label: 'Passing Year' },
        schoolName: { type: 'string', required: false, label: 'School Name' },
        boardName: { type: 'string', required: false, label: 'Board Name' },
      },
      casteCertificate: {
        name: { type: 'string', required: true, label: 'Name' },
        caste: { type: 'string', required: true, label: 'Caste' },
        certificateNumber: { type: 'string', required: true, label: 'Certificate Number' },
        issueDate: { type: 'date', required: false, label: 'Issue Date' },
      },
      incomeCertificate: {
        name: { type: 'string', required: true, label: 'Name' },
        income: { type: 'string', required: true, label: 'Annual Income' },
        certificateNumber: { type: 'string', required: true, label: 'Certificate Number' },
        issueDate: { type: 'date', required: false, label: 'Issue Date' },
      },
    };
  }

  /**
   * Get mock custom prompt template for testing
   * This simulates the ocrMappingPrompt from vcConfiguration
   * Returns null to use default prompts (since we don't have database access)
   */
  getMockCustomPrompt(documentType) {
    // In a real scenario, this would be fetched from vcConfiguration in the database
    // For testing, we return null to use the default prompt templates
    // You can add custom prompts here if needed for specific document types
    return null;
  }

  /**
   * Detect language from text
   */
  detectLanguage(text) {
    if (!text || text.trim().length === 0) return 'english';
    
    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    const totalChars = hindiChars + englishChars;
    
    if (totalChars === 0) return 'english';
    
    const hindiPercentage = hindiChars / totalChars;
    if (hindiPercentage > 0.7) return 'hindi';
    if (hindiPercentage < 0.3) return 'english';
    return 'mixed';
  }

  /**
   * Detect document type from file path
   */
  detectDocumentType(filePath) {
    const pathParts = filePath.split(path.sep);
    
    // Check folder names for document type
    for (const part of pathParts) {
      const lower = part.toLowerCase();
      if (lower.includes('marksheet')) return 'marksheet';
      if (lower.includes('caste')) return 'casteCertificate';
      if (lower.includes('income')) return 'incomeCertificate';
      if (lower.includes('aadhar') || lower.includes('aadhaar')) return 'aadhaar';
    }
    
    // Check filename
    const fileName = path.basename(filePath).toLowerCase();
    if (fileName.includes('marksheet')) return 'marksheet';
    if (fileName.includes('caste')) return 'casteCertificate';
    if (fileName.includes('income')) return 'incomeCertificate';
    if (fileName.includes('aadhar') || fileName.includes('aadhaar')) return 'aadhaar';
    
    return 'unknown';
  }

  /**
   * Get document type and subtype mapping
   */
  getDocTypeMapping(documentType) {
    const mapping = {
      'marksheet': { docType: 'marksProof', docSubType: 'marksheet', docName: 'Marksheet' },
      'casteCertificate': { docType: 'certificate', docSubType: 'casteCertificate', docName: 'Caste Certificate' },
      'incomeCertificate': { docType: 'certificate', docSubType: 'incomeCertificate', docName: 'Income Certificate' },
      'aadhaar': { docType: 'idProof', docSubType: 'aadhaar', docName: 'Aadhaar Card' },
    };
    
    return mapping[documentType] || { docType: 'unknown', docSubType: 'unknown', docName: 'Unknown' };
  }

  /**
   * Get MIME type from file extension
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.pdf': 'application/pdf',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Get provider configuration
   */
  getOcrProviderConfig(provider) {
    if (provider === 'aws-textract') {
      return {
        region: process.env.AWS_TEXTRACT_AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_TEXTRACT_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_TEXTRACT_SECRET_ACCESS_KEY,
        },
      };
    } else if (provider === 'google-gemini') {
      return {
        apiKey: process.env.GEMINI_API_KEY,
      };
    }
    return {};
  }

  /**
   * Get mapping provider configuration
   */
  getMappingProviderConfig(provider) {
    if (provider === 'bedrock') {
      return {
        region: process.env.OCR_MAPPING_BEDROCK_REGION,
        accessKeyId: process.env.OCR_MAPPING_BEDROCK_ACCESS_KEY_ID,
        secretAccessKey: process.env.OCR_MAPPING_BEDROCK_SECRET_ACCESS_KEY,
      };
    } else if (provider === 'google-gemini') {
      return {
        apiKey: process.env.OCR_MAPPING_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
      };
    }
    return {};
  }

  /**
   * Load documents from Test_Docs folder
   */
  loadDocuments() {
    const documents = [];
    
    if (!fs.existsSync(CONFIG.TEST_DOCS_PATH)) {
      console.error(`❌ Test documents folder not found: ${CONFIG.TEST_DOCS_PATH}`);
      return documents;
    }

    const scanDirectory = (dir, expectedLanguage = null) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          const folderName = item.toLowerCase();
          if (folderName === 'hindi' || folderName === 'english') {
            scanDirectory(fullPath, folderName);
          } else {
            scanDirectory(fullPath, expectedLanguage);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.pdf', '.webp'].includes(ext)) {
            const documentType = this.detectDocumentType(fullPath);
            documents.push({
              fileName: item,
              filePath: fullPath,
              expectedLanguage: expectedLanguage || 'unknown',
              documentType: documentType,
              fileSize: stat.size,
            });
          }
        }
      }
    };

    scanDirectory(CONFIG.TEST_DOCS_PATH);
    return documents;
  }

  /**
   * Test OCR extraction with a provider
   */
  async testOcrWithProvider(document, provider) {
    const startTime = Date.now();
    const config = this.getOcrProviderConfig(provider);
    
    try {
      // Check if provider is configured
      if (provider === 'aws-textract' && !config.credentials.accessKeyId) {
        return {
          success: false,
          error: 'AWS Textract credentials not configured',
          processingTime: Date.now() - startTime,
        };
      }
      
      if (provider === 'google-gemini' && !config.apiKey) {
        return {
          success: false,
          error: 'Google Gemini API key not configured',
          processingTime: Date.now() - startTime,
        };
      }

      const extractor = TextExtractorFactory.create(provider, config);
      const fileBuffer = fs.readFileSync(document.filePath);
      const mimeType = this.getMimeType(document.filePath);
      
      const result = await extractor.extractText(fileBuffer, mimeType);
      
      // Check if text was actually extracted (interface uses 'fullText', not 'text')
      const extractedText = result.fullText || result.text || '';
      const success = extractedText.trim().length > 0;
      
      if (!success && provider === 'aws-textract') {
        console.log(`   ⚠️  AWS Textract returned empty text but confidence: ${result.confidence}`);
      }
      
      return {
        success: success,
        extractedText: extractedText,
        confidence: result.confidence || 0,
        processingTime: Date.now() - startTime,
        detectedLanguage: this.detectLanguage(extractedText),
        characterCount: extractedText.length,
        wordCount: extractedText.split(/\s+/).filter(w => w.length > 0).length,
        error: !success ? 'No text extracted from document' : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Test OCR mapping with a provider
   */
  async testMappingWithProvider(extractedText, document, mappingProvider, issuer = 'jharseva') {
    const startTime = Date.now();
    
    try {
      // Check if provider is configured
      const config = this.getMappingProviderConfig(mappingProvider);
      if (mappingProvider === 'bedrock' && !config.accessKeyId) {
        return {
          success: false,
          error: 'AWS Bedrock credentials not configured (OCR_MAPPING_BEDROCK_ACCESS_KEY_ID)',
          processingTime: Date.now() - startTime,
        };
      }
      
      if (mappingProvider === 'google-gemini' && !config.apiKey) {
        return {
          success: false,
          error: 'Google Gemini API key not configured (OCR_MAPPING_GEMINI_API_KEY or GEMINI_API_KEY)',
          processingTime: Date.now() - startTime,
        };
      }

      // Get vcFields for the document type
      const vcFields = this.mockVcFields[document.documentType];
      
      if (!vcFields || Object.keys(vcFields).length === 0) {
        return {
          success: false,
          error: `No vcFields configuration found for document type: ${document.documentType}`,
          processingTime: Date.now() - startTime,
        };
      }

      // Use the mapping adapter directly
      const { BedrockAdapter } = require('../dist/src/services/ocr-mapping/adapters/bedrock.adapter');
      const { GeminiAdapter } = require('../dist/src/services/ocr-mapping/adapters/gemini.adapter');
      
      let adapter;
      if (mappingProvider === 'bedrock') {
        adapter = new BedrockAdapter();
      } else {
        adapter = new GeminiAdapter();
      }

      const docTypeMapping = this.getDocTypeMapping(document.documentType);
      
      // Prepare mapping input
      const mappingInput = {
        text: extractedText,
        docType: docTypeMapping.docType,
        docSubType: docTypeMapping.docSubType,
        issuer: issuer,
      };
      
      // Convert vcFields to schema format
      const schema = this.vcFieldsToSchema(vcFields);
      
      // Get custom prompt template (mock for standalone script)
      const customPromptTemplate = this.getMockCustomPrompt(document.documentType);
      
      // Call the adapter directly
      // Signature: mapTextToSchema(extractedText, schema, docType?, customPromptTemplate?)
      // Returns: Record<string, any> | null (just the mapped data, not a structured result)
      const mappedData = await adapter.mapTextToSchema(
        mappingInput.text,
        schema,
        docTypeMapping.docSubType, // docType parameter
        customPromptTemplate // customPromptTemplate parameter
      );
      
      if (!mappedData) {
        return {
          success: false,
          error: 'Adapter returned null - mapping failed',
          processingTime: Date.now() - startTime,
        };
      }
      
      // Calculate missing fields
      const requiredFields = Object.keys(vcFields).filter(key => vcFields[key].required);
      const missingFields = requiredFields.filter(field => !mappedData[field] || mappedData[field] === '');
      
      return {
        success: true,
        mappedData: mappedData,
        missingFields: missingFields,
        confidence: 85, // Mock confidence (adapters don't return this directly)
        processingMethod: mappingProvider,
        warnings: [],
        processingTime: Date.now() - startTime,
        fieldCount: Object.keys(mappedData).length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Convert vcFields to schema format for mapping
   */
  vcFieldsToSchema(vcFields) {
    const schema = {};
    for (const [key, field] of Object.entries(vcFields)) {
      schema[key] = {
        type: field.type || 'string',
        required: field.required || false,
        description: field.label || key,
      };
    }
    return schema;
  }

  /**
   * Test complete flow: OCR + Mapping
   */
  async testCompleteFlow(document, ocrProvider, mappingProvider) {
    console.log(`\n📄 Testing: ${document.fileName}`);
    console.log(`   OCR: ${ocrProvider} | Mapping: ${mappingProvider}`);
    
    // Step 1: OCR Extraction
    const ocrResult = await this.testOcrWithProvider(document, ocrProvider);
    
    if (!ocrResult.success) {
      console.log(`   ❌ OCR Failed: ${ocrResult.error}`);
      return {
        document,
        ocrProvider,
        mappingProvider,
        ocrResult,
        mappingResult: null,
        totalTime: ocrResult.processingTime,
        success: false,
      };
    }
    
    console.log(`   ✅ OCR Success (${ocrResult.processingTime}ms) - ${ocrResult.characterCount} chars`);
    
    // Check if we have text to map
    if (!ocrResult.extractedText || ocrResult.extractedText.trim().length === 0) {
      console.log(`   ⚠️  No text to map - skipping mapping step`);
      return {
        document,
        ocrProvider,
        mappingProvider,
        ocrResult,
        mappingResult: {
          success: false,
          error: 'No text extracted from OCR to map',
          processingTime: 0,
        },
        totalTime: ocrResult.processingTime,
        success: false,
      };
    }
    
    // Step 2: OCR Mapping
    const mappingResult = await this.testMappingWithProvider(
      ocrResult.extractedText,
      document,
      mappingProvider
    );
    
    if (!mappingResult.success) {
      console.log(`   ❌ Mapping Failed: ${mappingResult.error}`);
    } else {
      console.log(`   ✅ Mapping Success (${mappingResult.processingTime}ms) - ${mappingResult.fieldCount} fields`);
    }
    
    return {
      document,
      ocrProvider,
      mappingProvider,
      ocrResult,
      mappingResult,
      totalTime: ocrResult.processingTime + (mappingResult?.processingTime || 0),
      success: ocrResult.success && mappingResult.success,
    };
  }

  /**
   * Run complete test suite
   */
  async runTest() {
    console.log('\n🚀 Starting Complete OCR + Mapping Flow Test\n');
    console.log('═'.repeat(60));
    
    const startTime = Date.now();
    
    // Load documents
    const documents = this.loadDocuments();
    
    if (documents.length === 0) {
      console.log('❌ No documents found to test');
      return;
    }
    
    console.log(`\n📚 Found ${documents.length} documents to test`);
    documents.forEach(doc => {
      console.log(`   - ${doc.fileName} (${doc.expectedLanguage}, ${doc.documentType})`);
    });
    
    // Test all combinations
    console.log('\n🔄 Testing all OCR + Mapping combinations...\n');
    
    for (const document of documents) {
      for (const ocrProvider of this.ocrProviders) {
        for (const mappingProvider of this.mappingProviders) {
          const result = await this.testCompleteFlow(document, ocrProvider, mappingProvider);
          this.results.push(result);
        }
      }
    }
    
    const endTime = Date.now();
    
    // Generate summary
    const summary = this.generateSummary(documents, this.results, startTime, endTime);
    
    // Save results
    await this.saveResults(summary);
    
    // Display summary
    this.displaySummary(summary);
  }

  /**
   * Generate test summary
   */
  generateSummary(documents, results, startTime, endTime) {
    const summary = {
      testInfo: {
        totalDocuments: documents.length,
        totalTests: results.length,
        testStartTime: new Date(startTime).toISOString(),
        testEndTime: new Date(endTime).toISOString(),
        testDuration: Math.round((endTime - startTime) / 1000),
      },
      results: results,
      providerCombinations: {},
      recommendations: {},
    };
    
    // Analyze by provider combination
    for (const result of results) {
      const key = `${result.ocrProvider}+${result.mappingProvider}`;
      
      if (!summary.providerCombinations[key]) {
        summary.providerCombinations[key] = {
          ocrProvider: result.ocrProvider,
          mappingProvider: result.mappingProvider,
          successCount: 0,
          failureCount: 0,
          averageOcrTime: 0,
          averageMappingTime: 0,
          averageTotalTime: 0,
          averageOcrConfidence: 0,
          averageMappingConfidence: 0,
          averageFieldCount: 0,
          totalOcrTime: 0,
          totalMappingTime: 0,
          totalTotalTime: 0,
          totalOcrConfidence: 0,
          totalMappingConfidence: 0,
          totalFieldCount: 0,
        };
      }
      
      const combo = summary.providerCombinations[key];
      
      if (result.success) {
        combo.successCount++;
        combo.totalOcrTime += result.ocrResult.processingTime;
        combo.totalMappingTime += result.mappingResult.processingTime;
        combo.totalTotalTime += result.totalTime;
        combo.totalOcrConfidence += result.ocrResult.confidence;
        combo.totalMappingConfidence += result.mappingResult.confidence;
        combo.totalFieldCount += result.mappingResult.fieldCount;
      } else {
        combo.failureCount++;
      }
    }
    
    // Calculate averages
    for (const key in summary.providerCombinations) {
      const combo = summary.providerCombinations[key];
      if (combo.successCount > 0) {
        combo.averageOcrTime = Math.round(combo.totalOcrTime / combo.successCount);
        combo.averageMappingTime = Math.round(combo.totalMappingTime / combo.successCount);
        combo.averageTotalTime = Math.round(combo.totalTotalTime / combo.successCount);
        combo.averageOcrConfidence = Math.round(combo.totalOcrConfidence / combo.successCount);
        combo.averageMappingConfidence = Math.round(combo.totalMappingConfidence / combo.successCount);
        combo.averageFieldCount = Math.round(combo.totalFieldCount / combo.successCount);
      }
    }
    
    // Generate recommendations
    summary.recommendations = this.generateRecommendations(summary.providerCombinations, results);
    
    return summary;
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations(providerCombinations, results) {
    const recommendations = {
      bestOverall: null,
      bestForSpeed: null,
      bestForAccuracy: null,
      bestForHindi: null,
      bestForEnglish: null,
      byDocumentType: {},
      summary: [],
    };
    
    // Find best overall
    let bestScore = -1;
    for (const key in providerCombinations) {
      const combo = providerCombinations[key];
      if (combo.successCount === 0) continue;
      
      // Score = success rate * confidence - (time penalty)
      const successRate = combo.successCount / (combo.successCount + combo.failureCount);
      const avgConfidence = (combo.averageOcrConfidence + combo.averageMappingConfidence) / 2;
      const timePenalty = combo.averageTotalTime / 1000; // seconds
      const score = (successRate * 100) + avgConfidence - timePenalty;
      
      if (score > bestScore) {
        bestScore = score;
        recommendations.bestOverall = key;
      }
    }
    
    // Find best for speed
    let fastestTime = Infinity;
    for (const key in providerCombinations) {
      const combo = providerCombinations[key];
      if (combo.successCount === 0) continue;
      
      if (combo.averageTotalTime < fastestTime) {
        fastestTime = combo.averageTotalTime;
        recommendations.bestForSpeed = key;
      }
    }
    
    // Find best for accuracy
    let highestAccuracy = -1;
    for (const key in providerCombinations) {
      const combo = providerCombinations[key];
      if (combo.successCount === 0) continue;
      
      const avgConfidence = (combo.averageOcrConfidence + combo.averageMappingConfidence) / 2;
      if (avgConfidence > highestAccuracy) {
        highestAccuracy = avgConfidence;
        recommendations.bestForAccuracy = key;
      }
    }
    
    // Analyze by language
    const hindiResults = results.filter(r => r.document.expectedLanguage === 'hindi' && r.success);
    const englishResults = results.filter(r => r.document.expectedLanguage === 'english' && r.success);
    
    if (hindiResults.length > 0) {
      const hindiScores = {};
      for (const result of hindiResults) {
        const key = `${result.ocrProvider}+${result.mappingProvider}`;
        if (!hindiScores[key]) hindiScores[key] = [];
        hindiScores[key].push(result.totalTime);
      }
      
      let bestHindiKey = null;
      let bestHindiAvg = Infinity;
      for (const key in hindiScores) {
        const avg = hindiScores[key].reduce((a, b) => a + b, 0) / hindiScores[key].length;
        if (avg < bestHindiAvg) {
          bestHindiAvg = avg;
          bestHindiKey = key;
        }
      }
      recommendations.bestForHindi = bestHindiKey;
    }
    
    if (englishResults.length > 0) {
      const englishScores = {};
      for (const result of englishResults) {
        const key = `${result.ocrProvider}+${result.mappingProvider}`;
        if (!englishScores[key]) englishScores[key] = [];
        englishScores[key].push(result.totalTime);
      }
      
      let bestEnglishKey = null;
      let bestEnglishAvg = Infinity;
      for (const key in englishScores) {
        const avg = englishScores[key].reduce((a, b) => a + b, 0) / englishScores[key].length;
        if (avg < bestEnglishAvg) {
          bestEnglishAvg = avg;
          bestEnglishKey = key;
        }
      }
      recommendations.bestForEnglish = bestEnglishKey;
    }
    
    // Generate summary text
    if (recommendations.bestOverall) {
      const [ocr, mapping] = recommendations.bestOverall.split('+');
      recommendations.summary.push(`Best Overall: OCR=${ocr}, Mapping=${mapping}`);
    }
    
    if (recommendations.bestForSpeed) {
      const [ocr, mapping] = recommendations.bestForSpeed.split('+');
      recommendations.summary.push(`Fastest: OCR=${ocr}, Mapping=${mapping}`);
    }
    
    if (recommendations.bestForAccuracy) {
      const [ocr, mapping] = recommendations.bestForAccuracy.split('+');
      recommendations.summary.push(`Most Accurate: OCR=${ocr}, Mapping=${mapping}`);
    }
    
    if (recommendations.bestForHindi) {
      const [ocr, mapping] = recommendations.bestForHindi.split('+');
      recommendations.summary.push(`Best for Hindi: OCR=${ocr}, Mapping=${mapping}`);
    }
    
    if (recommendations.bestForEnglish) {
      const [ocr, mapping] = recommendations.bestForEnglish.split('+');
      recommendations.summary.push(`Best for English: OCR=${ocr}, Mapping=${mapping}`);
    }
    
    return recommendations;
  }

  /**
   * Save results to JSON file
   */
  async saveResults(summary) {
    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
      fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const fileName = `complete-ocr-flow-${timestamp}.json`;
    const filePath = path.join(CONFIG.OUTPUT_DIR, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2));
    console.log(`\n💾 Results saved to: ${filePath}`);
  }

  /**
   * Display summary in console
   */
  displaySummary(summary) {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    
    console.log(`\n⏱️  Total Duration: ${summary.testInfo.testDuration} seconds`);
    console.log(`📄 Documents Tested: ${summary.testInfo.totalDocuments}`);
    console.log(`🔄 Total Tests: ${summary.testInfo.totalTests}`);
    
    console.log('\n' + '─'.repeat(60));
    console.log('🏆 RECOMMENDATIONS');
    console.log('─'.repeat(60));
    
    if (summary.recommendations.summary.length > 0) {
      summary.recommendations.summary.forEach(rec => {
        console.log(`   ${rec}`);
      });
    } else {
      console.log('   ⚠️  No successful tests to generate recommendations');
    }
    
    console.log('\n' + '─'.repeat(60));
    console.log('📈 PROVIDER COMBINATIONS PERFORMANCE');
    console.log('─'.repeat(60));
    
    for (const key in summary.providerCombinations) {
      const combo = summary.providerCombinations[key];
      console.log(`\n${key}:`);
      console.log(`   Success: ${combo.successCount}/${combo.successCount + combo.failureCount}`);
      if (combo.successCount > 0) {
        console.log(`   Avg OCR Time: ${combo.averageOcrTime}ms`);
        console.log(`   Avg Mapping Time: ${combo.averageMappingTime}ms`);
        console.log(`   Avg Total Time: ${combo.averageTotalTime}ms`);
        console.log(`   Avg OCR Confidence: ${combo.averageOcrConfidence}%`);
        console.log(`   Avg Mapping Confidence: ${combo.averageMappingConfidence}%`);
        console.log(`   Avg Fields Mapped: ${combo.averageFieldCount}`);
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ Test Complete!');
    console.log('═'.repeat(60) + '\n');
  }
}

// Main execution
async function main() {
  try {
    const tester = new CompleteOcrFlowTester();
    await tester.runTest();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { CompleteOcrFlowTester };
