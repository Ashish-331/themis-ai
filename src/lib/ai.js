const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
const { bedrockClient } = require('./aws');

const LANGUAGE_NAMES = {
  bengali: 'Bengali (বাংলা)',
  hindi: 'Hindi (हिंदी)',
  marathi: 'Marathi (मराठी)'
};

function parseRobustJson(text) {
  if (!text) return null;
  // Remove markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Attempt regex extraction of outermost JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerErr) {
        console.warn('Regex JSON parse failed:', innerErr.message);
      }
    }
    return null;
  }
}

function buildPrompt(extractedText, language) {
  const langName = LANGUAGE_NAMES[language] || LANGUAGE_NAMES.bengali;
  return `You are Themis (न्याय सहायक), an expert Indian legal assistant.
Analyze this document text extracted from an Indian legal notice, deed, contract, assignment, or letter:
"""
${extractedText.slice(0, 12000)}
"""

Tasks:
1. Identify the document type:
   - Genuine legal notice/contract/deed -> set isScam = false
   - Fraudulent/cyber crime scam (e.g. digital arrest, fake CBI, extortion, unverified bank transfer) -> set isScam = true
   - Joke/parody/prank document (e.g. funny notices between family/friends) -> set isScam = true
   - Educational/academic assignment or personal non-legal document -> set isScam = false
2. Write a 5-point simplification written completely in ${langName}. Make it easy to understand for ordinary citizens.
3. If it is a scam or parody: explain precisely why in ${langName}. If legitimate: explain why in ${langName}.
4. Provide a confidence score between 0.80 and 0.99.
5. Provide the required statutory urgency or deadline in ${langName}. If it is a joke/academic work, state clearly there is no legal urgency!
6. List 3 practical, actionable next steps in ${langName}.

Output STRICTLY valid JSON with no conversational text or markdown fences, using this exact schema:
{
  "summary": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "isScam": false,
  "confidence": 0.95,
  "scamReason": "explanation in ${langName}",
  "urgency": "statutory timeline in ${langName}",
  "nextSteps": ["step 1", "step 2", "step 3"]
}`;
}

// 1. AWS Bedrock Provider (uses Converse API)
async function callBedrock(extractedText, language) {
  const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  const prompt = buildPrompt(extractedText, language);

  console.log(`[Themis AI] Invoking AWS Bedrock model: ${modelId}`);
  const command = new ConverseCommand({
    modelId,
    messages: [
      {
        role: 'user',
        content: [{ text: prompt }]
      }
    ],
    inferenceConfig: {
      temperature: 0.2,
      maxTokens: 1500
    }
  });

  const response = await bedrockClient.send(command);
  const textOutput = response.output?.message?.content?.[0]?.text;
  const parsed = parseRobustJson(textOutput);
  if (!parsed || !parsed.summary) {
    throw new Error('Bedrock returned invalid JSON structure');
  }
  return { ...parsed, provider: `AWS Bedrock (${modelId})` };
}

// 2. Groq / xAI Grok Provider (OpenAI-compatible)
async function callGroqOrGrok(extractedText, language) {
  const groqKey = process.env.GROQ_API_KEY;
  const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

  let endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  let apiKey = groqKey;
  let model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
  let providerName = `Groq (${model})`;

  if (!groqKey && grokKey) {
    endpoint = 'https://api.x.ai/v1/chat/completions';
    apiKey = grokKey;
    model = process.env.GROK_MODEL || 'grok-beta';
    providerName = `xAI Grok (${model})`;
  }

  if (!apiKey) {
    return null;
  }

  console.log(`[Themis AI] Invoking ${providerName}...`);
  const prompt = buildPrompt(extractedText, language);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are Themis, a legal AI assistant for Indian citizens. You output only valid JSON without markdown fences.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${providerName} error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawText = data.choices?.[0]?.message?.content || '';
  const parsed = parseRobustJson(rawText);
  if (!parsed || !parsed.summary) {
    throw new Error(`${providerName} returned unparseable JSON`);
  }
  return { ...parsed, provider: providerName };
}

/**
 * Universal Unified AI Dispatcher:
 * 1. Tries AWS Bedrock if enabled/configured
 * 2. Seamlessly falls back to Groq/Grok if Bedrock is locked/fails
 * 3. Falls back to heuristic knowledge base if no active LLM keys
 */
async function generateLegalAnalysis(extractedText, language, fallbackAnalyzer) {
  const useBedrockFirst = process.env.USE_BEDROCK === 'true';

  // Priority 1: Try AWS Bedrock if preferred
  if (useBedrockFirst) {
    try {
      return await callBedrock(extractedText, language);
    } catch (bedrockErr) {
      console.warn('[Themis AI] AWS Bedrock unavailable or restricted:', bedrockErr.message);
      console.log('[Themis AI] Automatically routing to secondary generative provider (Groq/Grok)...');
    }
  }

  // Priority 2: Try Groq / xAI Grok
  try {
    const groqResult = await callGroqOrGrok(extractedText, language);
    if (groqResult) {
      return groqResult;
    }
  } catch (groqErr) {
    console.warn('[Themis AI] Groq/Grok invocation error:', groqErr.message);
  }

  // Priority 3: Try Bedrock as backup if not tried first
  if (!useBedrockFirst) {
    try {
      return await callBedrock(extractedText, language);
    } catch (bedrockErr) {
      console.warn('[Themis AI] Backup AWS Bedrock call also failed:', bedrockErr.message);
    }
  }

  // Priority 4: Fallback to Themis Rule-Based Legal & Academic NLP Analyzer
  console.log('[Themis AI] Falling back to dynamic rule-based knowledge base analyzer.');
  const heuristicResult = fallbackAnalyzer(extractedText, language);
  return { ...heuristicResult, provider: 'Themis Rule-Based NLP' };
}

module.exports = {
  generateLegalAnalysis,
  callBedrock,
  callGroqOrGrok,
  parseRobustJson
};
