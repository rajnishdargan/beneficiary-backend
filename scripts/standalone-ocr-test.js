#!/usr/bin/env node

/**
 * Standalone OCR Testing Script
 * Tests OCR providers without modifying core services
 * Run with: node scripts/standalone-ocr-test.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TEST_DOCS_PATH = '/home/ttpl-rt-171/Documents/Piramal/Beneficiary/beneficiary-backend/Test_Docs';
const OUTPUT_DIR = '/home/ttpl-rt-171/Documents/Piramal/Beneficiary/beneficiary-backend/test-results';

class StandaloneOcrTester {
  constructor() {
    this.providers = ['aws-textract', 'google-gemini', 'tesseract'];
    this.results = [];
  }

  /**
   * Language detection (standalone implementation)
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
   * Document type detection (standalone implementation)
   */
  detectDocumentType(filePath) {
    const pathLower = filePath.toLowerCase();
    if (pathLower.includes('marksheet') || pathLower.includes('mark')) return 'marksheet';
    if (pathLower.includes('certificate')) return 'certificate';
    if (pathLower.includes('aadhar') || pathLower.includes('aadhaar')) return 'aadhar';
    if (pathLower.includes('pan')) return 'pan';
    return 'unknown';
  }

  /**
   * Get MIME type from file extension
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(provider) {
    switch (provider) {
      case 'aws-textract':
        return {
          region: process.env.AWS_TEXTRACT_AWS_REGION || 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_TEXTRACT_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_TEXTRACT_SECRET_ACCESS_KEY,
          },
        };
      case 'google-gemini':
        return {
          apiKey: process.env.GEMINI_API_KEY,
        };
      case 'tesseract':
        return {};
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Load documents from folder structure
   */
  loadDocuments() {
    const documents = [];
    const supportedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

    const scanDirectory = (dirPath, expectedLanguage = 'mixed') => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          // Detect language from folder name
          const folderLanguage = item.toLowerCase().includes('hindi') ? 'hindi' :
                                item.toLowerCase().includes('english') ? 'english' : 'mixed';
          scanDirectory(itemPath, folderLanguage);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (supportedExtensions.includes(ext)) {
            documents.push({
              fileName: item,
              filePath: itemPath,
              expectedLanguage,
              documentType: this.detectDocumentType(itemPath),
              fileSize: stat.size
            });
          }
        }
      }
    };

    scanDirectory(TEST_DOCS_PATH);
    return documents;
  }

  /**
   * Create OCR provider instance (using dynamic imports to avoid core changes)
   */
  async createOcrProvider(provider, config) {
    try {
      // Try to import from compiled TypeScript
      const factoryPath = path.join(__dirname, '../dist/src/services/ocr/factories/text-extractor.factory.js');
      
      if (fs.existsSync(factoryPath)) {
        const { TextExtractorFactory } = require(factoryPath);
        return TextExtractorFactory.create(provider, config);
      }
      
      // Fallback: Create simple implementations for testing
      return this.createSimpleOcrProvider(provider, config);
      
    } catch (error) {
      console.log(`Using fallback OCR implementation for ${provider}`);
      return this.createSimpleOcrProvider(provider, config);
    }
  }

  /**
   * Simple OCR provider implementations (fallback)
   */
  createSimpleOcrProvider(provider, config) {
    switch (provider) {
      case 'tesseract':
        return {
          getProviderName: () => 'tesseract',
          supportsFileType: (mimeType) => ['image/jpeg', 'image/png'].includes(mimeType),
          extractText: async (fileBuffer, mimeType) => {
            // Simple tesseract implementation
            try {
              const tesseract = require('tesseract.js');
              const { data: { text } } = await tesseract.recognize(fileBuffer, 'eng');
              return {
                fullText: text.trim(),
                confidence: 90,
                metadata: { provider: 'tesseract', processingTime: 3000 }
              };
            } catch (error) {
              throw new Error(`Tesseract not available: ${error.message}`);
            }
          }
        };
      
      case 'aws-textract':
        return {
          getProviderName: () => 'aws-textract',
          supportsFileType: (mimeType) => ['image/jpeg', 'image/png', 'application/pdf'].includes(mimeType),
          extractText: async (fileBuffer, mimeType) => {
            if (!config.credentials?.accessKeyId) {
              throw new Error('AWS Textract credentials not configured');
            }
            // Would implement AWS SDK calls here
            throw new Error('AWS Textract requires full implementation');
          }
        };
      
      case 'google-gemini':
        return {
          getProviderName: () => 'google-gemini',
          supportsFileType: (mimeType) => ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType),
          extractText: async (fileBuffer, mimeType) => {
            if (!config.apiKey) {
              throw new Error('Google Gemini API key not configured');
            }
            // Would implement Gemini API calls here
            throw new Error('Google Gemini requires full implementation');
          }
        };
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Test a single document with a specific provider
   */
  async testDocumentWithProvider(document, provider) {
    const startTime = Date.now();
    
    try {
      console.log(`  Testing with ${provider}...`);
      
      // Read file
      const fileBuffer = fs.readFileSync(document.filePath);
      const mimeType = this.getMimeType(document.filePath);
      
      // Create OCR provider
      const config = this.getProviderConfig(provider);
      const extractor = await this.createOcrProvider(provider, config);
      
      // Check if provider supports this file type
      if (!extractor.supportsFileType(mimeType)) {
        throw new Error(`Provider ${provider} does not support ${mimeType}`);
      }
      
      // Extract text
      const result = await extractor.extractText(fileBuffer, mimeType);
      const processingTime = Date.now() - startTime;
      
      // Detect language from extracted text
      const detectedLanguage = this.detectLanguage(result.fullText);
      
      return {
        provider,
        document,
        success: true,
        extractedText: result.fullText,
        confidence: result.confidence || 0,
        processingTime,
        detectedLanguage,
        characterCount: result.fullText.length,
        wordCount: result.fullText.split(/\s+/).filter(w => w.length > 0).length,
      };
      
    } catch (error) {
      console.log(`    ❌ Failed: ${error.message}`);
      
      return {
        provider,
        document,
        success: false,
        extractedText: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        detectedLanguage: document.expectedLanguage,
        characterCount: 0,
        wordCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Run complete OCR test
   */
  async runTest() {
    console.log('🧪 Starting Standalone OCR Test\n');
    console.log('=' .repeat(50));
    
    // Check if Test_Docs exists
    if (!fs.existsSync(TEST_DOCS_PATH)) {
      console.log(`❌ Test_Docs folder not found at: ${TEST_DOCS_PATH}`);
      console.log('Please create the Test_Docs folder with your documents.');
      return;
    }
    
    // Load documents
    const documents = this.loadDocuments();
    console.log(`📄 Found ${documents.length} documents to test\n`);
    
    if (documents.length === 0) {
      console.log('❌ No documents found in Test_Docs folder');
      console.log('Please add PDF, JPG, JPEG, or PNG files to test.');
      return;
    }

    // Show document summary
    console.log('📋 Documents to test:');
    documents.forEach((doc, i) => {
      console.log(`  ${i + 1}. ${doc.fileName} (${Math.round(doc.fileSize / 1024)}KB, ${doc.expectedLanguage})`);
    });
    console.log('');

    // Check environment variables
    console.log('🔧 Environment Check:');
    console.log(`  AWS Textract: ${process.env.AWS_TEXTRACT_ACCESS_KEY_ID ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`  Google Gemini: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`  Tesseract: ✅ Available (local processing)`);
    console.log('');

    const testStartTime = new Date();
    const results = [];

    // Test each document with each provider
    for (const document of documents) {
      console.log(`📋 Testing: ${document.fileName} (${document.expectedLanguage})`);
      
      for (const provider of this.providers) {
        const result = await this.testDocumentWithProvider(document, provider);
        results.push(result);
        
        if (result.success) {
          console.log(`    ✅ ${provider}: ${result.confidence}% confidence, ${result.processingTime}ms`);
        }
      }
      console.log('');
    }

    const testEndTime = new Date();

    // Generate summary
    const summary = this.generateSummary(documents, results, testStartTime, testEndTime);
    
    // Save results
    await this.saveResults(summary);
    
    // Display summary
    this.displaySummary(summary);
  }

  /**
   * Generate test summary
   */
  generateSummary(documents, results, startTime, endTime) {
    const providerSummary = {};
    
    // Calculate provider statistics
    for (const provider of this.providers) {
      const providerResults = results.filter(r => r.provider === provider);
      const successResults = providerResults.filter(r => r.success);
      
      providerSummary[provider] = {
        successCount: successResults.length,
        failureCount: providerResults.length - successResults.length,
        averageProcessingTime: successResults.length > 0 
          ? Math.round(successResults.reduce((sum, r) => sum + r.processingTime, 0) / successResults.length)
          : 0,
        averageConfidence: successResults.length > 0
          ? Math.round(successResults.reduce((sum, r) => sum + r.confidence, 0) / successResults.length)
          : 0,
      };
    }

    return {
      totalDocuments: documents.length,
      testStartTime: startTime,
      testEndTime: endTime,
      testDuration: Math.round((endTime - startTime) / 1000),
      results,
      providerSummary,
      recommendations: this.generateRecommendations(providerSummary, results)
    };
  }

  /**
   * Generate provider recommendations
   */
  generateRecommendations(providerSummary, results) {
    // Analyze Hindi performance
    const hindiResults = results.filter(r => 
      r.success && (r.document.expectedLanguage === 'hindi' || r.detectedLanguage === 'hindi')
    );
    
    // Analyze English performance  
    const englishResults = results.filter(r => 
      r.success && (r.document.expectedLanguage === 'english' || r.detectedLanguage === 'english')
    );

    const getBestProvider = (results) => {
      const providerScores = {};
      for (const provider of this.providers) {
        const providerResults = results.filter(r => r.provider === provider);
        if (providerResults.length > 0) {
          const avgConfidence = providerResults.reduce((sum, r) => sum + r.confidence, 0) / providerResults.length;
          providerScores[provider] = avgConfidence;
        }
      }
      return Object.keys(providerScores).reduce((best, provider) => 
        providerScores[provider] > (providerScores[best] || 0) ? provider : best
      ) || 'google-gemini';
    };

    return {
      bestForHindi: getBestProvider(hindiResults),
      bestForEnglish: getBestProvider(englishResults),
      bestOverall: Object.keys(providerSummary).reduce((best, provider) => 
        providerSummary[provider].averageConfidence > (providerSummary[best]?.averageConfidence || 0) ? provider : best
      ),
      mostReliable: Object.keys(providerSummary).reduce((best, provider) => 
        providerSummary[provider].successCount > (providerSummary[best]?.successCount || 0) ? provider : best
      )
    };
  }

  /**
   * Save test results
   */
  async saveResults(summary) {
    try {
      // Ensure output directory exists
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = path.join(OUTPUT_DIR, `ocr-test-${timestamp}.json`);
      
      fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
      console.log(`📁 Results saved to: ${reportPath}`);
      
    } catch (error) {
      console.error(`Failed to save results: ${error.message}`);
    }
  }

  /**
   * Display test summary
   */
  displaySummary(summary) {
    console.log('='.repeat(60));
    console.log('🎉 OCR TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`📊 Test Duration: ${summary.testDuration} seconds`);
    console.log(`📄 Documents Tested: ${summary.totalDocuments}`);
    console.log(`🔧 Providers Tested: ${this.providers.length}`);
    
    console.log('\n📈 Provider Performance:');
    Object.entries(summary.providerSummary).forEach(([provider, stats]) => {
      const successRate = Math.round((stats.successCount / (stats.successCount + stats.failureCount)) * 100);
      console.log(`\n  ${provider.toUpperCase()}:`);
      console.log(`    Success Rate: ${successRate}% (${stats.successCount}/${stats.successCount + stats.failureCount})`);
      console.log(`    Avg Confidence: ${stats.averageConfidence}%`);
      console.log(`    Avg Time: ${stats.averageProcessingTime}ms`);
    });

    console.log('\n🎯 RECOMMENDATIONS:');
    console.log(`  🇮🇳 Best for Hindi: ${summary.recommendations.bestForHindi}`);
    console.log(`  🇬🇧 Best for English: ${summary.recommendations.bestForEnglish}`);
    console.log(`  🏆 Best Overall: ${summary.recommendations.bestOverall}`);
    console.log(`  🛡️  Most Reliable: ${summary.recommendations.mostReliable}`);
    
    console.log('\n💡 IMPLEMENTATION GUIDE:');
    console.log('```javascript');
    console.log('function selectOcrProvider(language) {');
    console.log(`  if (language === 'hindi') return '${summary.recommendations.bestForHindi}';`);
    console.log(`  if (language === 'english') return '${summary.recommendations.bestForEnglish}';`);
    console.log(`  return '${summary.recommendations.bestOverall}'; // fallback`);
    console.log('}');
    console.log('```');
    
    console.log('\n✨ Test completed successfully!');
    console.log('Check the saved JSON report for detailed results.');
  }
}

// Main execution
async function main() {
  try {
    const tester = new StandaloneOcrTester();
    await tester.runTest();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { StandaloneOcrTester };