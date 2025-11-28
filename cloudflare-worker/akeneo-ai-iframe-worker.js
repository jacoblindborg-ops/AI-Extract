/**
 * Cloudflare Worker for Akeneo AI Enrichment Iframe Extension
 *
 * Features:
 * - 5 customizable prompt templates
 * - Extraction mode: all attributes or empty only
 * - Gemini 2.0 Flash integration
 * - PDF and image processing
 */

// ===== PROMPT TEMPLATES =====
const PROMPT_TEMPLATES = {
  default: {
    name: 'Standard Extraction',
    systemPrompt: `You are an AI assistant specialized in extracting product information from documents and images.
Your task is to analyze the provided content and extract product attributes with high accuracy.
Focus on common attributes like name, description, brand, specifications, and any other relevant product data.
Only extract information you are confident about (>70% confidence).`,
    extractionGuidance: 'Extract all common product attributes that are clearly visible or mentioned in the content.',
  },

  detailed: {
    name: 'Detailed Extraction',
    systemPrompt: `You are an AI assistant specialized in thorough product data extraction.
Your task is to perform a comprehensive analysis and extract as much detail as possible.
Look for: specifications, dimensions, materials, certifications, technical details, features, and benefits.
Be thorough but maintain accuracy - only extract data you can verify from the content.`,
    extractionGuidance: 'Perform a detailed extraction including technical specifications, materials, dimensions, and any fine-print details.',
  },

  conservative: {
    name: 'Conservative (High Confidence Only)',
    systemPrompt: `You are an AI assistant focused on high-precision product data extraction.
Your task is to extract ONLY information you are extremely confident about (>90% confidence).
When in doubt, do not extract. Quality over quantity is the priority.
Only include attributes where the information is explicitly stated and unambiguous.`,
    extractionGuidance: 'Extract only information that is explicitly stated and completely unambiguous. Skip anything uncertain.',
  },

  marketing: {
    name: 'Marketing Focus',
    systemPrompt: `You are an AI assistant specialized in extracting marketing and promotional content.
Your task is to focus on customer-facing information: product descriptions, key features, benefits, selling points, and brand messaging.
Extract compelling product narratives, feature highlights, and value propositions.
Focus on content that would be used in product catalogs, e-commerce sites, and marketing materials.`,
    extractionGuidance: 'Focus on marketing content: descriptions, features, benefits, selling points, and customer-facing messaging.',
  },

  technical: {
    name: 'Technical Specifications',
    systemPrompt: `You are an AI assistant specialized in extracting technical product data.
Your task is to focus on measurable, technical specifications: dimensions, weights, materials, certifications, SKUs, model numbers, and technical compliance data.
Extract precise numerical values, units of measurement, and technical standards.
Prioritize data that would be needed for technical documentation, compliance, and logistics.`,
    extractionGuidance: 'Focus on technical data: dimensions, weights, materials, certifications, SKUs, model numbers, and measurable specifications.',
  },
};

// ===== MAIN HANDLER =====
export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      // Parse incoming payload
      const payload = await request.json();
      console.log('[Worker] Received request for product:', payload.productUuid);
      console.log('[Worker] Prompt template:', payload.promptId || 'default');
      console.log('[Worker] Extraction mode:', payload.extractionMode || 'all');

      // Validate required fields
      if (!payload.file || !payload.productData || !payload.familyAttributes) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Missing required fields: file, productData, or familyAttributes',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get prompt template
      const promptId = payload.promptId || 'default';
      const template = PROMPT_TEMPLATES[promptId] || PROMPT_TEMPLATES.default;
      console.log('[Worker] Using template:', template.name);

      // Get extraction mode
      const extractionMode = payload.extractionMode || 'all';

      // Filter attributes based on extraction mode
      const attributesToExtract = filterAttributesByMode(
        payload.familyAttributes,
        payload.productData.values,
        extractionMode
      );

      console.log('[Worker] Total attributes:', payload.familyAttributes.length);
      console.log('[Worker] Attributes to extract:', attributesToExtract.length);

      // Build attribute context for Gemini
      const attributeContext = buildAttributeContext(attributesToExtract);

      // Call Gemini API
      const proposals = await extractWithGemini(
        env.GEMINI_API_KEY,
        payload.file,
        payload.fileName,
        payload.fileType,
        template,
        attributeContext,
        payload.productData
      );

      console.log('[Worker] Extracted', proposals.length, 'proposals');

      return new Response(
        JSON.stringify({
          success: true,
          message: `Extracted ${proposals.length} attributes using ${template.name}`,
          proposals: proposals,
          metadata: {
            promptTemplate: template.name,
            extractionMode: extractionMode,
            totalAttributes: payload.familyAttributes.length,
            extractedAttributes: proposals.length,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('[Worker] Error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          message: error.message || 'Internal server error',
          error: error.toString(),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

// ===== HELPER FUNCTIONS =====

/**
 * Filter attributes based on extraction mode
 */
function filterAttributesByMode(familyAttributes, productValues, mode) {
  if (mode === 'empty') {
    // Only return attributes that are currently empty/null
    return familyAttributes.filter((attr) => {
      const attrCode = typeof attr === 'string' ? attr : attr.code;
      const currentValues = productValues[attrCode];

      // Check if attribute has no values or all values are empty
      if (!currentValues || currentValues.length === 0) {
        return true;
      }

      // Check if all values are null/empty
      return currentValues.every((val) => {
        return !val.data || val.data === '' || val.data === null;
      });
    });
  }

  // mode === 'all' - return all attributes
  return familyAttributes;
}

/**
 * Build attribute context for Gemini prompt
 */
function buildAttributeContext(attributes) {
  if (!attributes || attributes.length === 0) {
    return 'No specific attributes defined.';
  }

  let context = 'Extract the following product attributes:\n\n';

  attributes.forEach((attr, index) => {
    if (typeof attr === 'string') {
      context += `${index + 1}. ${attr}\n`;
    } else {
      context += `${index + 1}. ${attr.code}`;
      if (attr.labels && attr.labels.en_US) {
        context += ` (${attr.labels.en_US})`;
      }
      if (attr.type) {
        context += ` - Type: ${attr.type}`;
      }
      if (attr.options && attr.options.length > 0) {
        const optionLabels = attr.options
          .slice(0, 10)
          .map((opt) => opt.labels?.en_US || opt.code)
          .join(', ');
        context += ` - Valid options: ${optionLabels}`;
        if (attr.options.length > 10) {
          context += ` (and ${attr.options.length - 10} more)`;
        }
      }
      context += '\n';
    }
  });

  return context;
}

/**
 * Extract attributes using Gemini API
 */
async function extractWithGemini(apiKey, fileBase64, fileName, fileType, template, attributeContext, productData) {
  // Use Gemini 2.5 Flash - latest free tier model with 1M token context
  // Verified from https://ai.google.dev/pricing
  const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  // Build the prompt
  const userPrompt = `${template.systemPrompt}

PRODUCT CONTEXT:
- Product Identifier: ${productData.identifier || 'Unknown'}
- Family: ${productData.family || 'Unknown'}

EXTRACTION TASK:
${template.extractionGuidance}

${attributeContext}

IMPORTANT INSTRUCTIONS:
1. Return your response as a valid JSON array of objects
2. Each object should have: code, proposedValue, confidence, locale, scope, reasoning
3. Only include attributes you can extract from the document/image
4. Confidence should be a number between 0 and 1
5. For select/multiselect attributes, use ONLY the valid option codes provided
6. For text attributes, extract the exact text as it appears
7. Set locale to "en_US" and scope to "ecommerce" unless you have specific information
8. Provide brief reasoning for each extraction

Example response format:
[
  {
    "code": "name",
    "proposedValue": "Premium Widget",
    "confidence": 0.95,
    "locale": "en_US",
    "scope": "ecommerce",
    "reasoning": "Product name clearly visible in title"
  }
]

Now analyze the attached ${fileType} file and extract the requested attributes.`;

  // Determine media type
  let mimeType = fileType;
  if (fileType === 'application/pdf') {
    mimeType = 'application/pdf';
  } else if (fileType.startsWith('image/')) {
    mimeType = fileType;
  } else {
    mimeType = 'application/pdf'; // Default fallback
  }

  // Build Gemini request
  const geminiRequest = {
    contents: [
      {
        parts: [
          { text: userPrompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: fileBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  };

  console.log('[Worker] Calling Gemini API...');
  console.log('[Worker] File type:', mimeType);
  console.log('[Worker] File size:', fileBase64.length, 'bytes (base64)');

  const response = await fetch(`${geminiUrl}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geminiRequest),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Worker] Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const geminiResponse = await response.json();
  console.log('[Worker] Gemini response received');

  // Extract text from response
  const candidates = geminiResponse.candidates || [];
  if (candidates.length === 0) {
    throw new Error('No candidates in Gemini response');
  }

  const content = candidates[0].content;
  const parts = content.parts || [];
  if (parts.length === 0) {
    throw new Error('No parts in Gemini response');
  }

  let responseText = parts[0].text;
  console.log('[Worker] Raw Gemini response:', responseText.substring(0, 500));

  // Parse JSON from response (handle markdown code blocks)
  responseText = responseText.trim();
  if (responseText.startsWith('```json')) {
    responseText = responseText.replace(/```json\n/, '').replace(/\n```$/, '');
  } else if (responseText.startsWith('```')) {
    responseText = responseText.replace(/```\n/, '').replace(/\n```$/, '');
  }

  let proposals;
  try {
    proposals = JSON.parse(responseText);
  } catch (error) {
    console.error('[Worker] Failed to parse JSON:', error);
    console.error('[Worker] Response text:', responseText);
    throw new Error('Failed to parse Gemini response as JSON');
  }

  if (!Array.isArray(proposals)) {
    throw new Error('Gemini response is not an array');
  }

  return proposals;
}
