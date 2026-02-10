import { VisualParams } from '../types';

// Using Groq with Llama 3.3 70B - fast, free, open source
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_ID = "llama-3.3-70b-versatile";

export const interpretSentiment = async (input: string): Promise<VisualParams> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    console.warn("Groq API key not configured. Using fallback.");
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
            content: `You are a creative coder and visual artist. You interpret human emotions and phrases into abstract visual parameters for a WebGL fluid sphere simulation. Always respond with valid JSON only, no markdown or explanation outside the JSON.`
          },
          {
            role: 'user',
            content: `Interpret the following user sentiment or phrase into abstract visual parameters:

User Input: "${input}"

Return a JSON object with exactly these fields:
- color: A hex code representing the mood (e.g., "#ff5500")
- speed: A number between 0.2 (calm) and 4.0 (chaotic) representing animation speed
- distort: A number between 0.3 (smooth) and 1.5 (spiky/glitchy) representing mesh distortion
- phrase: A poetic, 2-3 word summary of the vibe (e.g., "Burning Entropy")
- explanation: A one-sentence explanation of why you chose these visuals

Respond with only the JSON object, no other text.`
          }
        ],
        temperature: 0.8,
        max_tokens: 256,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      return JSON.parse(content) as VisualParams;
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
    return { color: "#ffcc00", speed: 2.5, distort: 0.6, phrase: "Radiant Joy", explanation: "Bright energy pulses through the digital matter." };
  }
  if (lowerInput.includes('sad') || lowerInput.includes('melancholy') || lowerInput.includes('blue')) {
    return { color: "#3366cc", speed: 0.4, distort: 0.4, phrase: "Quiet Depths", explanation: "A gentle, contemplative flow of emotion." };
  }
  if (lowerInput.includes('angry') || lowerInput.includes('rage') || lowerInput.includes('fury')) {
    return { color: "#cc0000", speed: 3.5, distort: 1.3, phrase: "Burning Chaos", explanation: "Intense energy tears through the fabric of calm." };
  }
  if (lowerInput.includes('calm') || lowerInput.includes('peace') || lowerInput.includes('serene')) {
    return { color: "#66cccc", speed: 0.3, distort: 0.3, phrase: "Still Waters", explanation: "Tranquility flows in gentle waves." };
  }
  if (lowerInput.includes('love') || lowerInput.includes('heart') || lowerInput.includes('passion')) {
    return { color: "#ff3366", speed: 1.8, distort: 0.7, phrase: "Warm Embrace", explanation: "Love's warmth radiates outward in soft pulses." };
  }
  
  // Default fallback
  return {
    color: "#4a4a4a",
    speed: 0.8,
    distort: 0.5,
    phrase: "Signal Lost",
    explanation: "Add your Groq API key to enable AI interpretation."
  };
}