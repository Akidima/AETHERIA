// Collections API endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  try {
    if (req.method === 'GET') {
      const { id, userId: queryUserId } = req.query;

      if (id) {
        // Get single collection
        const { data: collection, error } = await supabase
          .from('collections')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !collection) {
          return res.status(404).json({ error: 'Collection not found' });
        }

        // Check access
        if (!collection.is_public && collection.user_id !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Get items
        const { data: items } = await supabase
          .from('collection_items')
          .select(`
            visualization_id,
            added_at,
            shared_visualizations (
              id,
              share_id,
              input,
              params
            )
          `)
          .eq('collection_id', id);

        return res.status(200).json({
          collection: {
            ...collection,
            items: items?.map(item => ({
              id: (item.shared_visualizations as any)?.id,
              shareId: (item.shared_visualizations as any)?.share_id,
              name: (item.shared_visualizations as any)?.input,
              params: (item.shared_visualizations as any)?.params,
              addedAt: item.added_at,
            })) || [],
          },
        });
      }

      // Get user's collections
      const targetUserId = queryUserId || userId;
      if (!targetUserId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      let query = supabase
        .from('collections')
        .select('*')
        .eq('user_id', targetUserId);

      // If not the owner, only show public
      if (targetUserId !== userId) {
        query = query.eq('is_public', true);
      }

      const { data: collections, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ collections: collections || [] });
    }

    // Require auth for mutations
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const { name, description, isPublic, visualizationId, collectionId } = req.body;

      // Add item to collection
      if (collectionId && visualizationId) {
        // Verify ownership
        const { data: collection } = await supabase
          .from('collections')
          .select('user_id')
          .eq('id', collectionId)
          .single();

        if (!collection || collection.user_id !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const { error } = await supabase
          .from('collection_items')
          .insert({
            collection_id: collectionId,
            visualization_id: visualizationId,
          });

        if (error) {
          if (error.code === '23505') {
            return res.status(400).json({ error: 'Already in collection' });
          }
          throw error;
        }

        return res.status(201).json({ success: true });
      }

      // Create new collection
      if (!name) {
        return res.status(400).json({ error: 'Name required' });
      }

      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: userId,
          name,
          description,
          is_public: isPublic || false,
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ collection: data });
    }

    if (req.method === 'PUT') {
      const { id, name, description, isPublic } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Collection ID required' });
      }

      const { data, error } = await supabase
        .from('collections')
        .update({
          name,
          description,
          is_public: isPublic,
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ collection: data });
    }

    if (req.method === 'DELETE') {
      const { id, visualizationId } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Collection ID required' });
      }

      // Remove item from collection
      if (visualizationId) {
        const { error } = await supabase
          .from('collection_items')
          .delete()
          .eq('collection_id', id)
          .eq('visualization_id', visualizationId);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      // Delete collection
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Collections API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
