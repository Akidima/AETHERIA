import { VisualParams } from '../types';

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