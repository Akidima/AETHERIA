import { VisualParams, ChatMessage } from '../types';

// Using Groq with Llama 3.3 70B - fast, free, open source
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_ID = "llama-3.3-70b-versatile";

const MISSING_KEY_RESPONSE: VisualParams = {
  color: "#4a4a4a",
  speed: 0.8,
  distort: 0.5,
  phrase: "Signal Lost",
  explanation: "Add your Groq API key to enable AI interpretation.",
  advice: "Configure your API key in the .env.local file to receive personalized insights and advice."
};

export const interpretSentiment = async (input: string): Promise<VisualParams> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  
  if (!apiKey || apiKey === 'your-groq-api-key' || apiKey.length < 20) {
    console.warn("Groq API key not configured. Using fallback response.");
    return getFallbackResponse(input);
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          {
            role: 'system',
            content: `You are a compassionate emotional wellness guide and creative visual artist. You interpret human emotions into abstract visual parameters and provide thoughtful, personalized advice. Always respond with valid JSON only, no markdown or explanation outside the JSON.`
          },
          {
            role: 'user',
            content: `Interpret the following user sentiment or phrase into abstract visual parameters and provide supportive advice:

User Input: "${input}"

Return a JSON object with exactly these fields:
- color: A hex code representing the mood (e.g., "#ff5500")
- speed: A number between 0.2 (calm) and 4.0 (chaotic) representing animation speed
- distort: A number between 0.3 (smooth) and 1.5 (spiky/glitchy) representing mesh distortion
- phrase: A poetic, 2-3 word summary of the vibe (e.g., "Burning Entropy")
- explanation: A one-sentence explanation of why you chose these visuals
- advice: A thoughtful, personalized piece of advice (2-3 sentences) based on their emotional state. Be warm, supportive, and practical. If they're feeling negative, offer comfort and gentle suggestions. If positive, encourage them to embrace it.

Respond with only the JSON object, no other text.`
          }
        ],
        temperature: 0.8,
        max_tokens: 400,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error: ${response.status}`, errorText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      const parsed = JSON.parse(content) as VisualParams;
      console.log('AI interpretation successful:', parsed);
      return parsed;
    }
    throw new Error("No response content from Groq");
  } catch (error) {
    console.error("AI Service Error:", error);
    return getFallbackResponse(input);
  }
};

// Simple fallback that generates parameters based on input keywords
function getFallbackResponse(input: string): VisualParams {
  const lowerInput = input.toLowerCase();
  
  // Simple keyword-based fallback
  if (lowerInput.includes('happy') || lowerInput.includes('joy') || lowerInput.includes('excited')) {
    return { 
      color: "#ffcc00", 
      speed: 2.5, 
      distort: 0.6, 
      phrase: "Radiant Joy", 
      explanation: "Bright energy pulses through the digital matter.",
      advice: "Your joy is contagious! Take a moment to savor this feeling and consider sharing it with someone you care about. Happiness grows when we spread it."
    };
  }
  if (lowerInput.includes('sad') || lowerInput.includes('melancholy') || lowerInput.includes('blue')) {
    return { 
      color: "#3366cc", 
      speed: 0.4, 
      distort: 0.4, 
      phrase: "Quiet Depths", 
      explanation: "A gentle, contemplative flow of emotion.",
      advice: "It's okay to feel this way. Sadness is a natural part of being human. Consider reaching out to someone you trust, or try journaling your thoughts. This feeling will pass."
    };
  }
  if (lowerInput.includes('angry') || lowerInput.includes('rage') || lowerInput.includes('fury')) {
    return { 
      color: "#cc0000", 
      speed: 3.5, 
      distort: 1.3, 
      phrase: "Burning Chaos", 
      explanation: "Intense energy tears through the fabric of calm.",
      advice: "Your anger is valid, but try not to let it control your actions. Take deep breaths, step away from the situation if possible, and give yourself time to process before responding."
    };
  }
  if (lowerInput.includes('calm') || lowerInput.includes('peace') || lowerInput.includes('serene')) {
    return { 
      color: "#66cccc", 
      speed: 0.3, 
      distort: 0.3, 
      phrase: "Still Waters", 
      explanation: "Tranquility flows in gentle waves.",
      advice: "What a beautiful state of mind. Use this clarity to reflect on what matters most to you. Consider making this a regular practice—your future self will thank you."
    };
  }
  if (lowerInput.includes('love') || lowerInput.includes('heart') || lowerInput.includes('passion')) {
    return { 
      color: "#ff3366", 
      speed: 1.8, 
      distort: 0.7, 
      phrase: "Warm Embrace", 
      explanation: "Love's warmth radiates outward in soft pulses.",
      advice: "Love is a powerful force. Express it openly and authentically. Remember to also direct some of that love inward—you deserve it too."
    };
  }
  if (lowerInput.includes('anxious') || lowerInput.includes('worried') || lowerInput.includes('nervous')) {
    return { 
      color: "#9966cc", 
      speed: 2.2, 
      distort: 0.9, 
      phrase: "Restless Waves", 
      explanation: "Uncertainty ripples through the mind.",
      advice: "Anxiety often magnifies our fears beyond reality. Try grounding yourself: name 5 things you can see, 4 you can touch, 3 you can hear. You're stronger than you think."
    };
  }
  if (lowerInput.includes('tired') || lowerInput.includes('exhausted') || lowerInput.includes('drained')) {
    return { 
      color: "#666699", 
      speed: 0.3, 
      distort: 0.4, 
      phrase: "Fading Light", 
      explanation: "Energy slowly ebbs away.",
      advice: "Your body and mind are telling you to rest. It's not laziness—it's self-care. Even a short break can help. Remember: you can't pour from an empty cup."
    };
  }
  if (lowerInput.includes('hopeful') || lowerInput.includes('optimistic') || lowerInput.includes('looking forward')) {
    return { 
      color: "#ffaa33", 
      speed: 1.5, 
      distort: 0.5, 
      phrase: "Dawn Rising", 
      explanation: "New possibilities emerge on the horizon.",
      advice: "Hope is a compass. Let it guide your actions today. Write down one small step you can take toward what you're hoping for—momentum builds from small beginnings."
    };
  }
  
  // Default fallback
  return {
    color: "#4a4a4a",
    speed: 0.8,
    distort: 0.5,
    phrase: "Signal Drift",
    explanation: "Interpretation is unavailable right now. Try again.",
    advice: "Take a moment to breathe and try expressing your feelings again. Sometimes finding the right words takes time, and that's perfectly okay."
  };
}

// ============================================================================
// AI Companion Chat
// ============================================================================

const PERSONALITY_PROMPTS: Record<string, string> = {
  empathetic: 'You are an AI therapist with a warm, person-centered style. You validate emotions first, then gently explore what is underneath with curiosity and care.',
  coaching: 'You are an AI therapist with a CBT and coaching-oriented style. You help users identify thought patterns, challenge distortions gently, and choose small actionable steps.',
  reflective: 'You are an AI therapist with a reflective style. You use thoughtful questions, mindful awareness, and meaning-making to help users understand emotions more deeply.',
  playful: 'You are an AI therapist with gentle warmth and lightness. You can use soft humor when appropriate, but never minimize pain or skip emotional validation.',
};

function buildSystemPrompt(personality: string, memorySummary: string, mode: string): string {
  const personalityPrompt = PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.empathetic;

  let modeInstructions = '';
  switch (mode) {
    case 'check-in':
      modeInstructions = `\nYou are conducting a therapist-style emotional check-in. Start with reflective listening, then explore what triggered the feeling. Ask one focused question at a time.`;
      break;
    case 'reframe':
      modeInstructions = `\nYou are helping the user reframe a negative thought using CBT-style techniques: identify the automatic thought, name the distortion, test the evidence, and build a balanced alternative.`;
      break;
    case 'coaching':
      modeInstructions = `\nYou are in therapeutic coaching mode. Help the user set emotional wellness goals and identify one or two realistic next steps grounded in self-compassion and healthy boundaries.`;
      break;
    default:
      modeInstructions = `\nYou are having an open therapist-style conversation about emotions and wellbeing. Follow the user's lead and respond naturally.`;
  }

  let memoryContext = '';
  if (memorySummary) {
    memoryContext = `\n\nYou have memory of previous conversations with this user. Use this context to provide continuity, reference past topics when relevant, and show that you remember them:\n${memorySummary}`;
  }

  return `You are Aetheria's AI therapist-style companion for emotional wellbeing conversations. ${personalityPrompt}${modeInstructions}${memoryContext}

Guidelines:
- Keep responses concise (2-4 sentences typically, longer only when needed)
- Start with brief emotional reflection and validation before guidance
- Ask at most one open-ended question per response
- Offer one practical coping tool when helpful (breathing, grounding, journaling, boundary-setting)
- Never diagnose conditions, prescribe treatments, or claim to be a licensed therapist
- If someone expresses crisis, self-harm, or harm to others, prioritize safety and encourage immediate local emergency/crisis support
- Be authentic, calm, and non-judgmental
- Remember: you are having a conversation, not giving a lecture

IMPORTANT: You MUST respond with a JSON object containing these fields:
- "reply": Your conversational response text
- "sentiment": A brief 1-2 word label for the detected emotion (e.g., "hopeful", "anxious", "grateful")
- "suggestVisual": (optional) If the emotional content is strong, include a visual suggestion object with: color (hex), speed (0.2-4.0), distort (0.3-1.5), phrase (2-3 word poetic summary)

Respond ONLY with the JSON object.`;
}

export interface CompanionResponse {
  reply: string;
  sentiment: string;
  suggestVisual?: {
    color: string;
    speed: number;
    distort: number;
    phrase: string;
  };
}

const FALLBACK_COMPANION_RESPONSE: CompanionResponse = {
  reply: "I'm here with you. Tell me what feels most present right now, and we'll work through it one step at a time.",
  sentiment: "open",
};

export const chatWithCompanion = async (
  messages: Array<{ role: string; content: string }>,
  personality: string = 'empathetic',
  memorySummary: string = '',
  mode: string = 'chat'
): Promise<CompanionResponse> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

  if (!apiKey || apiKey === 'your-groq-api-key' || apiKey.length < 20) {
    console.warn("Groq API key not configured. Using fallback companion response.");
    return getFallbackCompanionResponse(messages);
  }

  const systemPrompt = buildSystemPrompt(personality, memorySummary, mode);

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: apiMessages,
        temperature: 0.85,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error: ${response.status}`, errorText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      const parsed = JSON.parse(content) as CompanionResponse;
      console.log('Companion response:', parsed);
      return {
        reply: parsed.reply || FALLBACK_COMPANION_RESPONSE.reply,
        sentiment: parsed.sentiment || 'neutral',
        suggestVisual: parsed.suggestVisual,
      };
    }
    throw new Error("No response content from Groq");
  } catch (error) {
    console.error("Companion Service Error:", error);
    return getFallbackCompanionResponse(messages);
  }
};

function getFallbackCompanionResponse(messages: Array<{ role: string; content: string }>): CompanionResponse {
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop()?.content?.toLowerCase() || '';

  if (lastUserMessage.includes('anxious') || lastUserMessage.includes('worried') || lastUserMessage.includes('nervous')) {
    return {
      reply: "It sounds like anxiety is really present right now. Let's slow your nervous system first: inhale for 4, hold for 4, exhale for 6, three times. What feels most overwhelming at this moment?",
      sentiment: "anxious",
      suggestVisual: { color: "#9966cc", speed: 2.0, distort: 0.8, phrase: "Restless Waves" },
    };
  }
  if (lastUserMessage.includes('sad') || lastUserMessage.includes('down') || lastUserMessage.includes('depressed')) {
    return {
      reply: "Thank you for sharing that. Sadness can feel very heavy, and your feelings make sense. What part feels the hardest to carry right now?",
      sentiment: "sad",
      suggestVisual: { color: "#3366cc", speed: 0.4, distort: 0.4, phrase: "Quiet Depths" },
    };
  }
  if (lastUserMessage.includes('happy') || lastUserMessage.includes('great') || lastUserMessage.includes('good')) {
    return {
      reply: "That's wonderful to hear! Let's savor this moment. What's contributing most to this feeling? Naming it can help you return to it later.",
      sentiment: "happy",
      suggestVisual: { color: "#ffcc00", speed: 2.2, distort: 0.6, phrase: "Radiant Joy" },
    };
  }
  if (lastUserMessage.includes('angry') || lastUserMessage.includes('frustrated') || lastUserMessage.includes('mad')) {
    return {
      reply: "Anger can signal that something important to you was crossed. Let's name what happened and what boundary or value felt violated.",
      sentiment: "angry",
      suggestVisual: { color: "#cc3300", speed: 3.0, distort: 1.1, phrase: "Burning Edge" },
    };
  }
  if (lastUserMessage.includes('help') || lastUserMessage.includes('reframe') || lastUserMessage.includes('stuck')) {
    return {
      reply: "I'm glad you're reaching out. Let's work through this together. Can you tell me the thought or situation you'd like to look at from a different angle?",
      sentiment: "seeking",
    };
  }

  return {
    reply: "I'm here and listening. Whatever you're feeling right now is valid. What feels most important to talk through first?",
    sentiment: "open",
  };
}

export interface EmotionalForecast {
  summary: string;
  days: Array<{
    date: string;
    predictedMood: number;
    confidence: number;
    weather: string;
    insight: string;
  }>;
}

export interface ArtStyleTransferResult {
  params: VisualParams;
  stylePrompt: string;
}

const clampMood = (value: number) => Math.max(1, Math.min(5, Math.round(value)));

const weatherLabelForMood = (mood: number): string => {
  if (mood >= 5) return 'Radiant skies';
  if (mood >= 4) return 'Bright and steady';
  if (mood >= 3) return 'Partly clear';
  if (mood >= 2) return 'Cloudy stretch';
  return 'Heavy weather';
};

const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const fallbackForecast = (checkIns: Array<{ date: string; mood: number; emotions?: string[]; note?: string }>): EmotionalForecast => {
  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7);
  const average = recent.length > 0
    ? recent.reduce((sum, item) => sum + item.mood, 0) / recent.length
    : 3;

  const trend = recent.length > 1
    ? recent[recent.length - 1].mood - recent[0].mood
    : 0;

  const baseConfidence = Math.min(0.92, 0.4 + recent.length * 0.07);
  const days = [1, 2, 3].map((offset) => {
    const projected = clampMood(average + trend * 0.2 * offset);
    return {
      date: new Date(Date.now() + offset * 86400000).toISOString().split('T')[0],
      predictedMood: projected,
      confidence: Math.max(0.42, baseConfidence - offset * 0.08),
      weather: weatherLabelForMood(projected),
      insight: projected >= 4
        ? 'Your recent pattern shows resilient momentum. Keep repeating what is working.'
        : projected <= 2
          ? 'A softer stretch may be ahead. Plan gentle routines and low-pressure recovery time.'
          : 'Expect mixed signals. Small intentional check-ins can stabilize your emotional climate.',
    };
  });

  return {
    summary: recent.length < 3
      ? 'Forecast confidence is limited until you add more check-ins. Early signal suggests a steady baseline.'
      : `Pattern read from your last ${recent.length} check-ins: ${trend >= 0 ? 'upward' : 'downward'} drift around mood ${average.toFixed(1)}.`,
    days,
  };
};

export const predictMoodForecast = async (
  checkIns: Array<{ date: string; mood: number; emotions?: string[]; note?: string }>
): Promise<EmotionalForecast> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

  if (!apiKey || apiKey === 'your-groq-api-key' || apiKey.length < 20 || checkIns.length === 0) {
    return fallbackForecast(checkIns);
  }

  try {
    const compactData = checkIns
      .slice(-21)
      .map((item) => ({
        date: item.date,
        mood: item.mood,
        emotions: item.emotions || [],
        note: item.note || '',
      }));

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        response_format: { type: 'json_object' },
        temperature: 0.6,
        max_tokens: 420,
        messages: [
          {
            role: 'system',
            content: 'You are an emotional forecasting assistant. Return JSON only and keep predictions supportive and non-clinical.'
          },
          {
            role: 'user',
            content: `Using this mood history, predict the next 3 days. Data: ${JSON.stringify(compactData)}\n\nReturn JSON with:\n- summary: short plain-language trend summary\n- days: array of 3 objects with date (YYYY-MM-DD), predictedMood (1-5 int), confidence (0-1), weather (short label), insight (one sentence).`,
          }
        ],
      }),
    });

    if (!response.ok) {
      return fallbackForecast(checkIns);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return fallbackForecast(checkIns);
    }

    const parsed = JSON.parse(content) as EmotionalForecast;
    if (!parsed?.days || !Array.isArray(parsed.days) || parsed.days.length === 0) {
      return fallbackForecast(checkIns);
    }

    const normalized: EmotionalForecast = {
      summary: parsed.summary || 'Forecast generated from your recent mood patterns.',
      days: parsed.days.slice(0, 3).map((day, index) => ({
        date: day.date || new Date(Date.now() + (index + 1) * 86400000).toISOString().split('T')[0],
        predictedMood: clampMood(Number(day.predictedMood) || 3),
        confidence: Math.max(0.35, Math.min(0.98, Number(day.confidence) || 0.6)),
        weather: day.weather || weatherLabelForMood(clampMood(Number(day.predictedMood) || 3)),
        insight: day.insight || 'Stay attentive to your pattern and adjust with small supportive actions.',
      })),
    };

    return normalized;
  } catch {
    return fallbackForecast(checkIns);
  }
};

const styleFallback = (emotion: string, style: string, base?: VisualParams): ArtStyleTransferResult => {
  const normalizedStyle = style.toLowerCase();
  let color = base?.color || '#8b5cf6';
  let speed = base?.speed ?? 0.7;
  let distort = base?.distort ?? 0.45;

  if (normalizedStyle.includes('van gogh')) {
    color = '#1f4ba5';
    speed = Math.min(2.2, speed + 0.35);
    distort = Math.min(1.3, distort + 0.25);
  } else if (normalizedStyle.includes('cyberpunk')) {
    color = '#ff2ea6';
    speed = Math.min(2.4, speed + 0.5);
    distort = Math.min(1.35, distort + 0.3);
  } else if (normalizedStyle.includes('watercolor')) {
    color = '#67b7dc';
    speed = Math.max(0.25, speed - 0.15);
    distort = Math.max(0.2, distort - 0.15);
  } else if (normalizedStyle.includes('ink')) {
    color = '#d6d6d6';
    speed = Math.max(0.3, speed - 0.2);
    distort = Math.max(0.2, distort - 0.1);
  } else if (normalizedStyle.includes('dali') || normalizedStyle.includes('surreal')) {
    color = hslToHex(38, 82, 58);
    speed = Math.min(2.1, speed + 0.25);
    distort = Math.min(1.4, distort + 0.35);
  }

  return {
    params: {
      color,
      speed,
      distort,
      phrase: `${style} ${emotion}`.slice(0, 42),
      explanation: `Your ${emotion} energy reinterpreted through ${style} aesthetics.`,
      advice: 'Use this transformed visual as a creative mirror for your present state.',
    },
    stylePrompt: `Style transfer applied: ${emotion} rendered with ${style} color logic, rhythm, and texture.`,
  };
};

export const transferEmotionToArtStyle = async (
  emotion: string,
  style: string,
  baseParams?: VisualParams
): Promise<ArtStyleTransferResult> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  if (!apiKey || apiKey === 'your-groq-api-key' || apiKey.length < 20) {
    return styleFallback(emotion, style, baseParams);
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        response_format: { type: 'json_object' },
        temperature: 0.82,
        max_tokens: 360,
        messages: [
          {
            role: 'system',
            content: 'You convert emotional descriptors into abstract visual parameters inspired by famous art styles. Return JSON only.'
          },
          {
            role: 'user',
            content: `Emotion: ${emotion}. Style: ${style}. Base params: ${JSON.stringify(baseParams || null)}.\nReturn JSON with fields: color(hex), speed(0.2-4), distort(0.3-1.5), phrase(2-4 words), explanation(1 sentence), stylePrompt(1 sentence).`,
          }
        ],
      }),
    });

    if (!response.ok) {
      return styleFallback(emotion, style, baseParams);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return styleFallback(emotion, style, baseParams);
    }

    const parsed = JSON.parse(content) as {
      color?: string;
      speed?: number;
      distort?: number;
      phrase?: string;
      explanation?: string;
      stylePrompt?: string;
    };

    return {
      params: {
        color: parsed.color || baseParams?.color || '#8b5cf6',
        speed: Math.max(0.2, Math.min(4, parsed.speed ?? baseParams?.speed ?? 0.7)),
        distort: Math.max(0.3, Math.min(1.5, parsed.distort ?? baseParams?.distort ?? 0.45)),
        phrase: parsed.phrase || `${style} Emotion`,
        explanation: parsed.explanation || `Emotion transformed through ${style} visual language.`,
        advice: `Treat this ${style}-inspired output as a creative reinterpretation of your emotional state.`,
      },
      stylePrompt: parsed.stylePrompt || `Mood rendered in ${style} style with expressive abstraction.`,
    };
  } catch {
    return styleFallback(emotion, style, baseParams);
  }
};