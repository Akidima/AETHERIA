// Vercel Serverless Function - AI Interpretation Proxy
// This hides the API key from the client and adds rate limiting

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Rate limiting state (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

// AI Provider configurations
const AI_PROVIDERS = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    getHeaders: (apiKey: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }),
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    getHeaders: (apiKey: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }),
  },
};

type Provider = keyof typeof AI_PROVIDERS;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function getSystemPrompt(): string {
  return `You are a compassionate emotional wellness guide and creative visual artist. You interpret human emotions into abstract visual parameters and provide thoughtful, personalized advice. Always respond with valid JSON only, no markdown or explanation outside the JSON.`;
}

function getUserPrompt(input: string): string {
  return `Interpret the following user sentiment or phrase into abstract visual parameters and provide supportive advice:

User Input: "${input}"

Return a JSON object with exactly these fields:
- color: A hex code representing the mood (e.g., "#ff5500")
- speed: A number between 0.2 (calm) and 4.0 (chaotic) representing animation speed
- distort: A number between 0.3 (smooth) and 1.5 (spiky/glitchy) representing mesh distortion
- phrase: A poetic, 2-3 word summary of the vibe (e.g., "Burning Entropy")
- explanation: A one-sentence explanation of why you chose these visuals
- advice: A thoughtful, personalized piece of advice (2-3 sentences) based on their emotional state. Be warm, supportive, and practical. If they're feeling negative, offer comfort and gentle suggestions. If positive, encourage them to embrace it.

Respond with only the JSON object, no other text.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  }

  const { input, provider = 'groq' } = req.body;

  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Input is required' });
  }

  // Get API key based on provider
  const providerConfig = AI_PROVIDERS[provider as Provider];
  if (!providerConfig) {
    return res.status(400).json({ error: 'Invalid provider' });
  }

  const apiKey = provider === 'groq' 
    ? process.env.GROQ_API_KEY 
    : process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch(providerConfig.url, {
      method: 'POST',
      headers: providerConfig.getHeaders(apiKey),
      body: JSON.stringify({
        model: providerConfig.model,
        messages: [
          { role: 'system', content: getSystemPrompt() },
          { role: 'user', content: getUserPrompt(input) },
        ],
        temperature: 0.8,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', errorText);
      return res.status(response.status).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    const params = JSON.parse(content);
    
    return res.status(200).json({
      success: true,
      params,
      provider,
    });
  } catch (error) {
    console.error('Interpretation error:', error);
    return res.status(500).json({ error: 'Failed to interpret emotion' });
  }
}
