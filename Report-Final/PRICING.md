# OCR and Mapping Service Pricing Guide

> **Important:** Cloud service pricing changes frequently. Always refer to the official pricing pages linked below for the most current rates. The estimates provided here are for budgeting purposes only and may not reflect current pricing.

---

## Official Pricing Resources

### AWS Textract (OCR Service)

**Primary Resources:**
- [AWS Pricing Calculator - Textract](https://calculator.aws/#/createCalculator/Textract)
- [AWS Textract Documentation](https://docs.aws.amazon.com/textract/)

**Billing Model:**
- Per-page pricing (images count as 1 page; PDFs count per page)
- Different APIs have different rates (DetectDocumentText vs AnalyzeDocument)
- Pricing varies by AWS region

**Region Used:** Asia Pacific (Mumbai) - `ap-south-1`

---

### Google Gemini (OCR and Mapping Service)

**Primary Resources:**
- [Gemini API Pricing Documentation](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)

**Billing Model:**
- Token-based pricing (input tokens + output tokens)
- Pricing varies by model version (Flash, Pro, etc.)
- Free tier available with rate limits
- Image/PDF tokenization depends on resolution and content

**Models Used:**
- OCR: `gemini-2.0-flash-exp` (configurable)
- Mapping: `gemini-1.5-flash` (configurable)

---

### Amazon Bedrock (Mapping Service)

**Primary Resources:**
- [Amazon Bedrock Pricing Page](https://aws.amazon.com/bedrock/pricing/)
- [Bedrock Pricing Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-pricing.html)
- [AWS Pricing Calculator - Bedrock](https://calculator.aws/#/createCalculator/Bedrock)
- [Bedrock Model Pricing by Provider](https://docs.aws.amazon.com/bedrock/latest/userguide/model-pricing.html)

**Billing Model:**
- Token-based pricing (input tokens + output tokens)
- Pricing varies significantly by model provider (Anthropic, Meta, Amazon, etc.)
- Pricing varies by AWS region
- Some models support provisioned throughput pricing

**Region Used:** Asia Pacific (Mumbai) - `ap-south-1`

**Model Used:** `meta.llama3-8b-instruct-v1:0` (configurable via `OCR_MAPPING_BEDROCK_MODEL_ID`)

---

## Service Configuration Details

### AWS Textract Configuration

- **API Used:** `DetectDocumentText` (synchronous OCR)
- **SDK:** `@aws-sdk/client-textract`
- **Region:** `ap-south-1` (Asia Pacific - Mumbai)
- **Use Case:** English language document text extraction

### Google Gemini Configuration

- **API:** Google AI Generative Language API (`generativelanguge.googleapis.com`)
- **Endpoint:** `:generateContent` with inline image/PDF bytes
- **OCR Model:** Configurable via `GEMINI_OCR_MODEL` (default: `gemini-2.0-flash-exp`)
- **Mapping Model:** Configurable via `OCR_MAPPING_GEMINI_MODEL_NAME` (default: `gemini-1.5-flash`)
- **Use Case:** Hindi and mixed-language document processing

### Amazon Bedrock Configuration

- **API:** `InvokeModel` for text-to-JSON mapping
- **Model:** Configurable via `OCR_MAPPING_BEDROCK_MODEL_ID` (default: `meta.llama3-8b-instruct-v1:0`)
- **Region:** `ap-south-1` (Asia Pacific - Mumbai)
- **Use Case:** Mapping extracted OCR text to structured JSON

---

## Monthly Cost Estimates

> **Note:** These estimates are conservative and intended for budgeting purposes. Actual costs will vary based on document complexity, page count, text length, processing patterns, and current pricing at the time of processing.

### Production Assumptions

- Average document size: 2 pages per document
- All documents processed through selected OCR provider
- All documents processed through selected mapping provider
- Cost estimates include buffer for retries, failures, and production variability
- Exchange rate: 1 USD = 91.46 INR (approximate)

---

### Scenario 1: AWS Textract OCR + AWS Bedrock Mapping

**Recommended for:** English language documents

| Documents per month | AWS Textract OCR<br/>USD / INR | AWS Bedrock Mapping<br/>USD / INR | **Total Monthly Cost<br/>USD / INR** |
|---:|---:|---:|---:|
| 1,000 | $3 – $8<br/>₹274 – ₹732 | $3 – $15<br/>₹274 – ₹1,372 | **$8 – $30**<br/>**₹732 – ₹2,744** |
| 10,000 | $30 – $80<br/>₹2,744 – ₹7,317 | $30 – $150<br/>₹2,744 – ₹13,719 | **$60 – $300**<br/>**₹5,488 – ₹27,438** |
| 100,000 | $300 – $800<br/>₹27,438 – ₹73,168 | $300 – $1,500<br/>₹27,438 – ₹137,190 | **$600 – $3,000**<br/>**₹54,876 – ₹274,380** |

**Pricing References:**
- [AWS Pricing Calculator - Textract](https://calculator.aws/#/createCalculator/Textract)
- [Amazon Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)

---

### Scenario 2: Google Gemini OCR + AWS Bedrock Mapping

**Recommended for:** Hindi and mixed-language documents

| Documents per month | Google Gemini OCR<br/>USD / INR | AWS Bedrock Mapping<br/>USD / INR | **Total Monthly Cost<br/>USD / INR** |
|---:|---:|---:|---:|
| 1,000 | $2 – $20<br/>₹183 – ₹1,829 | $3 – $15<br/>₹274 – ₹1,372 | **$8 – $50**<br/>**₹732 – ₹4,573** |
| 10,000 | $20 – $200<br/>₹1,829 – ₹18,292 | $30 – $150<br/>₹2,744 – ₹13,719 | **$50 – $500**<br/>**₹4,573 – ₹45,730** |
| 100,000 | $200 – $2,000<br/>₹18,292 – ₹183,200 | $300 – $1,500<br/>₹27,438 – ₹137,190 | **$500 – $5,000**<br/>**₹45,730 – ₹457,300** |

**Pricing References:**
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Amazon Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)

---

### Scenario 3: Google Gemini OCR + Google Gemini Mapping

**Recommended for:** Hindi and mixed-language documents (unified provider)

| Documents per month | Google Gemini OCR<br/>USD / INR | Google Gemini Mapping<br/>USD / INR | **Total Monthly Cost<br/>USD / INR** |
|---:|---:|---:|---:|
| 1,000 | $2 – $20<br/>₹183 – ₹1,829 | $3 – $15<br/>₹274 – ₹1,372 | **$8 – $50**<br/>**₹732 – ₹4,573** |
| 10,000 | $20 – $200<br/>₹1,829 – ₹18,292 | $30 – $150<br/>₹2,744 – ₹13,719 | **$50 – $500**<br/>**₹4,573 – ₹45,730** |
| 100,000 | $200 – $2,000<br/>₹18,292 – ₹183,200 | $300 – $1,500<br/>₹27,438 – ₹137,190 | **$500 – $5,000**<br/>**₹45,730 – ₹457,300** |

**Pricing References:**
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)

---

### Scenario Comparison Summary

| Scenario | OCR Provider | Mapping Provider | Use Case | Estimated Monthly Cost<br/>(1,000 documents) |
|----------|--------------|-------------------|----------|-----------------------------------------------|
| **Scenario 1** | AWS Textract | AWS Bedrock | English language documents | **$8 – $30**<br/>₹732 – ₹2,744 |
| **Scenario 2** | Google Gemini | AWS Bedrock | Hindi and mixed-language documents | **$8 – $50**<br/>₹732 – ₹4,573 |
| **Scenario 3** | Google Gemini | Google Gemini | Hindi and mixed-language documents (unified provider) | **$8 – $50**<br/>₹732 – ₹4,573 |

---

## Cost Factors

The following factors influence total processing costs:

### Document Characteristics

- **Page count**: Multi-page PDFs cost more than single-page images
- **Document quality**: Low-quality scans and complex layouts may require additional processing
- **Text density**: Documents with more text increase token usage for mapping services
- **Image resolution**: Higher resolution images increase token costs for Gemini OCR

### Processing Patterns

- **Language distribution**: Higher proportion of Hindi/mixed-language documents increases Gemini usage
- **Retry scenarios**: Network failures and API retries increase total API calls
- **Mapping complexity**: Longer extracted text and larger JSON outputs increase mapping costs
- **Concurrent processing**: High concurrency may affect pricing tiers or require provisioned throughput

### Service-Specific Factors

**AWS Textract:**
- Different APIs have different per-page rates
- Regional pricing variations
- Volume discounts may apply at scale

**Google Gemini:**
- Model version affects pricing (Flash vs Pro)
- Token counting varies by content type (text vs images)
- Free tier limitations and rate limits

**Amazon Bedrock:**
- Model provider significantly affects pricing
- Regional pricing variations
- Provisioned throughput options for high-volume use cases

---

## Additional Resources

### Cost Estimation Tools

- [AWS Pricing Calculator](https://calculator.aws/)
- [AWS Cost Explorer](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/)
- [Google Cloud Pricing Calculator](https://cloud.google.com/products/calculator)
- [Google Cloud Billing](https://cloud.google.com/billing/docs)

### Monitoring and Optimization

- **AWS Cost Management:** Monitor Textract and Bedrock usage through AWS Cost Explorer
- **Google Cloud Billing:** Track Gemini API usage through Google Cloud Console
- **Best Practices:** Implement retry logic, caching, and error handling to minimize unnecessary API calls

### Support and Documentation

- [AWS Textract Documentation](https://docs.aws.amazon.com/textract/)
- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)

---

## Important Notes

1. **Pricing Changes:** Cloud service pricing is subject to change. Always verify current rates using the official pricing links provided above.

2. **Regional Variations:** Pricing may vary significantly by region. Ensure you check pricing for your specific deployment region (`ap-south-1` for AWS services).

3. **Account Plans:** Enterprise agreements, reserved capacity, and volume discounts may affect actual pricing. Contact AWS or Google Cloud sales for custom pricing.

4. **Exchange Rates:** INR conversions are approximate and based on current exchange rates. Actual billing will be in USD for AWS services.

5. **Free Tiers:** Both AWS and Google Cloud offer free tiers with limitations. Review free tier eligibility and limits before production deployment.

6. **Model Selection:** Different models within the same service may have different pricing. Verify pricing for your specific model configuration.

---

*Last Updated: 2026-02-02*  
*For the most current pricing information, always refer to the official pricing pages linked above.*
