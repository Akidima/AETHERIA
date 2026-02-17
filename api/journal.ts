// Journal API endpoint - CRUD for journal entries with search
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get user from auth header
  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    userId = user?.id || null;
  }

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // GET - List/search journal entries
    if (req.method === 'GET') {
      const {
        search,
        tags,
        emotion,
        dateStart,
        dateEnd,
        sort = 'newest',
        limit = '50',
        offset = '0',
        id,
      } = req.query;

      // Get single entry by ID
      if (id) {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('id', id as string)
          .eq('user_id', userId)
          .single();

        if (error) {
          return res.status(404).json({ error: 'Journal entry not found' });
        }

        return res.status(200).json({ entry: data });
      }

      // Search/list entries
      const { data, error } = await supabase.rpc('search_journal_entries', {
        user_id_param: userId,
        search_query: search ? String(search) : null,
        tag_filter: tags ? (Array.isArray(tags) ? tags : [tags]) as string[] : null,
        emotion_filter: emotion ? String(emotion) : null,
        date_start: dateStart ? String(dateStart) : null,
        date_end: dateEnd ? String(dateEnd) : null,
        sort_by: String(sort),
        result_limit: parseInt(String(limit), 10),
        result_offset: parseInt(String(offset), 10),
      });

      if (error) {
        console.error('Journal search error:', error);
        // Fallback to basic query
        let query = supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: sort === 'oldest' })
          .range(
            parseInt(String(offset), 10),
            parseInt(String(offset), 10) + parseInt(String(limit), 10) - 1
          );

        if (emotion) {
          query = query.eq('detected_emotion', String(emotion));
        }

        const { data: fallbackData, error: fallbackError } = await query;

        if (fallbackError) throw fallbackError;

        return res.status(200).json({
          entries: fallbackData || [],
          total: fallbackData?.length || 0,
        });
      }

      return res.status(200).json({
        entries: data || [],
        total: data?.[0]?.total_count || 0,
      });
    }

    // POST - Create new journal entry
    if (req.method === 'POST') {
      const {
        title,
        blocks,
        plainText,
        tags,
        customTags,
        detectedEmotion,
        promptUsed,
        linkedVisualization,
        mood,
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: userId,
          title: title.trim(),
          blocks: blocks || [],
          plain_text: plainText || '',
          tags: tags || [],
          custom_tags: customTags || [],
          detected_emotion: detectedEmotion || null,
          prompt_used: promptUsed || null,
          linked_visualization: linkedVisualization || null,
          mood: mood || null,
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ entry: data });
    }

    // PUT - Update journal entry
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Entry ID is required' });
      }

      // Map camelCase to snake_case
      const dbUpdates: Record<string, any> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.blocks !== undefined) dbUpdates.blocks = updates.blocks;
      if (updates.plainText !== undefined) dbUpdates.plain_text = updates.plainText;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.customTags !== undefined) dbUpdates.custom_tags = updates.customTags;
      if (updates.detectedEmotion !== undefined) dbUpdates.detected_emotion = updates.detectedEmotion;
      if (updates.promptUsed !== undefined) dbUpdates.prompt_used = updates.promptUsed;
      if (updates.linkedVisualization !== undefined) dbUpdates.linked_visualization = updates.linkedVisualization;
      if (updates.mood !== undefined) dbUpdates.mood = updates.mood;

      const { data, error } = await supabase
        .from('journal_entries')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ entry: data });
    }

    // DELETE - Delete journal entry
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Entry ID is required' });
      }

      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id as string)
        .eq('user_id', userId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Journal API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
