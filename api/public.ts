// Public API endpoint - Developer access to Aetheria
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Rate limiting (simple in-memory, use Redis in production)
const rateLimits: Map<string, { count: number; resetAt: number }> = new Map();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(apiKey: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(apiKey);
  
  if (!limit || now > limit.resetAt) {
    rateLimits.set(apiKey, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT) {
    return false;
  }
  
  limit.count++;
  return true;
}

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get API key from header
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key required',
      docs: 'https://aetheria.app/api/docs',
    });
  }

  // Rate limit check
  if (!checkRateLimit(apiKey)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      retryAfter: 60,
    });
  }

  // Validate API key
  const keyHash = hashApiKey(apiKey);
  const { data: keyData, error: keyError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .single();

  if (keyError || !keyData) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Check expiration
  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    return res.status(401).json({ error: 'API key expired' });
  }

  // Update usage count
  await supabase
    .from('api_keys')
    .update({ 
      usage_count: keyData.usage_count + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', keyData.id);

  const permissions = keyData.permissions || ['read'];
  const { action } = req.query;

  try {
    // ============================================
    // GET /api/public?action=gallery
    // Get public gallery visualizations
    // ============================================
    if (req.method === 'GET' && action === 'gallery') {
      if (!permissions.includes('read')) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const { limit = '20', offset = '0', sort = 'recent' } = req.query;

      let query = supabase
        .from('shared_visualizations')
        .select('share_id, input, params, views, likes, created_at')
        .eq('is_public', true);

      if (sort === 'popular') {
        query = query.order('views', { ascending: false });
      } else if (sort === 'liked') {
        query = query.order('likes', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (error) throw error;

      return res.status(200).json({
        data: data || [],
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      });
    }

    // ============================================
    // GET /api/public?action=visualization&id=xxx
    // Get specific visualization by share_id
    // ============================================
    if (req.method === 'GET' && action === 'visualization') {
      if (!permissions.includes('read')) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'ID required' });
      }

      const { data, error } = await supabase
        .from('shared_visualizations')
        .select('share_id, input, params, views, likes, created_at')
        .eq('share_id', id)
        .eq('is_public', true)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Visualization not found' });
      }

      return res.status(200).json({ data });
    }

    // ============================================
    // POST /api/public?action=interpret
    // Interpret emotion (requires 'interpret' permission)
    // ============================================
    if (req.method === 'POST' && action === 'interpret') {
      if (!permissions.includes('interpret')) {
        return res.status(403).json({ error: 'Permission denied - interpret permission required' });
      }

      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text required' });
      }

      // Forward to interpretation endpoint
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        return res.status(500).json({ error: 'Interpretation service not configured' });
      }

      const prompt = `You are an emotion-to-visual interpreter for an artistic experience.
Given this emotional input: "${text}"

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "color": "#hexcolor",
  "speed": 0.0-2.0,
  "distort": 0.0-1.0,
  "phrase": "2-3 word essence",
  "explanation": "Brief poetic description"
}`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error('Interpretation failed');
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      
      try {
        const parsed = JSON.parse(content);
        return res.status(200).json({ data: parsed });
      } catch {
        return res.status(500).json({ error: 'Failed to parse interpretation' });
      }
    }

    // ============================================
    // POST /api/public?action=share
    // Create a shared visualization (requires 'write' permission)
    // ============================================
    if (req.method === 'POST' && action === 'share') {
      if (!permissions.includes('write')) {
        return res.status(403).json({ error: 'Permission denied - write permission required' });
      }

      const { input, params, isPublic = true } = req.body;
      if (!input || !params) {
        return res.status(400).json({ error: 'Input and params required' });
      }

      // Generate share ID
      const shareId = crypto.randomBytes(4).toString('hex');

      const { data, error } = await supabase
        .from('shared_visualizations')
        .insert({
          share_id: shareId,
          user_id: keyData.user_id,
          input,
          params,
          is_public: isPublic,
        })
        .select('share_id, input, params, created_at')
        .single();

      if (error) throw error;

      return res.status(201).json({ 
        data,
        url: `https://aetheria.app/v/${shareId}`,
      });
    }

    // Unknown action
    return res.status(400).json({ 
      error: 'Invalid action',
      validActions: ['gallery', 'visualization', 'interpret', 'share'],
    });

  } catch (error) {
    console.error('Public API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
