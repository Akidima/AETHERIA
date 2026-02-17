// API Service - Handles all backend communication
import { VisualParams } from '../types';
import { analytics } from './analyticsService';

const API_URL = import.meta.env.VITE_API_URL || '';

// Check if we should use the API proxy or direct calls
const USE_PROXY = !!API_URL;

// ============================================
// INTERPRETATION API
// ============================================
export async function interpretEmotion(
  input: string,
  provider: 'groq' | 'openai' = 'groq'
): Promise<VisualParams> {
  analytics.trackInterpretation(input, true);

  if (USE_PROXY) {
    // Use backend proxy
    const response = await fetch(`${API_URL}/api/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, provider }),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        analytics.trackError(error.error || 'Interpretation failed', 'interpret');
        throw new Error(error.error || 'Failed to interpret emotion');
      } catch (e) {
        analytics.trackError('Interpretation failed', 'interpret');
        throw new Error(`Failed to interpret emotion: ${response.statusText || 'Unknown error'}`);
      }
    }

    const data = await response.json();
    return data.params;
  } else {
    // Fallback to direct API call (development only)
    const { interpretSentiment } = await import('./aiService');
    return interpretSentiment(input);
  }
}

// ============================================
// SHARE API
// ============================================
export async function createShare(
  input: string,
  params: VisualParams,
  userId?: string
): Promise<{ shareId: string; url: string }> {
  const response = await fetch(`${API_URL}/api/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, params, userId }),
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create share link');
    } catch (e) {
      throw new Error(`Failed to create share link: ${response.statusText || 'Unknown error'}`);
    }
  }

  const data = await response.json();
  analytics.trackShare(data.shareId);
  return data;
}

export async function getShare(shareId: string): Promise<{
  input: string;
  params: VisualParams;
  views: number;
  createdAt: string;
} | null> {
  const response = await fetch(`${API_URL}/api/share?id=${shareId}`);

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.data;
}

// ============================================
// GALLERY API
// ============================================
export interface GalleryItem {
  shareId: string;
  input: string;
  params: VisualParams;
  createdAt: string;
  views: number;
  likes: number;
}

export async function getGallery(
  sort: 'recent' | 'popular' | 'liked' = 'recent',
  limit = 20,
  offset = 0
): Promise<{ items: GalleryItem[]; total: number }> {
  if (USE_PROXY) {
    // Use backend API
    const response = await fetch(
      `${API_URL}/api/gallery?sort=${sort}&limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch gallery');
      } catch (e) {
        throw new Error(`Failed to fetch gallery: ${response.statusText || 'Unknown error'}`);
      }
    }

    const data = await response.json();
    return { items: data.items, total: data.total };
  } else {
    // Query Supabase directly
    const { supabase } = await import('../lib/supabase');
    
    let query = supabase
      .from('shared_visualizations')
      .select('share_id, input, params, created_at, views, likes')
      .eq('is_public', true);

    // Sorting
    if (sort === 'popular') {
      query = query.order('views', { ascending: false });
    } else if (sort === 'liked') {
      query = query.order('likes', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Gallery error:', error);
      throw new Error('Failed to fetch gallery');
    }

    const items = (data as any[])?.map((item: any) => ({
      shareId: item.share_id,
      input: item.input,
      params: item.params,
      createdAt: item.created_at,
      views: item.views,
      likes: item.likes,
    })) || [];

    return {
      items,
      total: count || 0,
    };
  }
}

// ============================================
// HISTORY API (Authenticated)
// ============================================
export async function saveToHistory(
  input: string,
  params: VisualParams,
  token: string
): Promise<void> {
  const response = await fetch(`${API_URL}/api/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ input, params }),
  });

  if (!response.ok) {
    console.warn('Failed to save to cloud history');
  }
}

export async function getCloudHistory(
  token: string,
  limit = 50,
  offset = 0
): Promise<{ id: string; input: string; params: VisualParams; createdAt: string }[]> {
  const response = await fetch(
    `${API_URL}/api/history?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.items;
}

export async function clearCloudHistory(token: string): Promise<void> {
  await fetch(`${API_URL}/api/history`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

// ============================================
// PROFILE API
// ============================================
export interface ProfileData {
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  joinedAt?: string;
  visualizationsCount?: number;
  followersCount?: number;
  followingCount?: number;
}

export async function getProfile(
  userId?: string,
  username?: string
): Promise<ProfileData> {
  if (!USE_PROXY) {
    throw new Error('Profile API is not configured. Please set VITE_API_URL.');
  }

  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (username) params.append('username', username);

  const response = await fetch(`${API_URL}/api/profile?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch profile');
    } catch (e) {
      // If response is not valid JSON, throw a generic error
      throw new Error(`Failed to fetch profile: ${response.statusText || 'Unknown error'}`);
    }
  }

  const data = await response.json();
  return data.profile;
}

export async function updateProfile(
  token: string,
  updates: {
    username?: string | null;
    displayName?: string | null;
    bio?: string | null;
  }
): Promise<void> {
  if (!USE_PROXY) {
    throw new Error('Profile API is not configured. Please set VITE_API_URL.');
  }

  const response = await fetch(`${API_URL}/api/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    } catch (e) {
      // If response is not valid JSON, throw a generic error
      throw new Error(`Failed to update profile: ${response.statusText || 'Unknown error'}`);
    }
  }

  analytics.track('profile_updated', updates);
}
