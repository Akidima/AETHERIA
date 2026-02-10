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
      const error = await response.json();
      analytics.trackError(error.error || 'Interpretation failed', 'interpret');
      throw new Error(error.error || 'Failed to interpret emotion');
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
    throw new Error('Failed to create share link');
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
  const response = await fetch(
    `${API_URL}/api/gallery?sort=${sort}&limit=${limit}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch gallery');
  }

  const data = await response.json();
  return { items: data.items, total: data.total };
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
