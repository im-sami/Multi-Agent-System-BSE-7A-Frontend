/**
 * Response Formatter - Converts JSON responses to natural chat format using Gemini API
 */

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

/**
 * Formats a JSON response into natural, conversational text using Gemini API
 * @param jsonResponse - The JSON object or string to format
 * @param context - Optional context about the response (e.g., "error", "quiz result", "general")
 * @returns Formatted natural language response
 */
export async function formatResponseToChat(
  jsonResponse: any,
  context?: string
): Promise<string> {
  try {
    // If it's already a simple string, return it
    if (typeof jsonResponse === "string" && !isJsonString(jsonResponse)) {
      return jsonResponse;
    }

    // Convert to string if it's an object
    const jsonString = typeof jsonResponse === "string" 
      ? jsonResponse 
      : JSON.stringify(jsonResponse, null, 2);

    // Check if API key is available
    if (!GEMINI_API_KEY) {
      console.warn("Gemini API key not found, returning formatted JSON");
      return formatJsonFallback(jsonResponse, context);
    }

    // Create prompt for Gemini to convert JSON to natural language
    const prompt = createPrompt(jsonString, context);

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      console.error("Gemini API error:", response.statusText);
      return formatJsonFallback(jsonResponse, context);
    }

    const data = await response.json();
    
    // Extract the generated text from Gemini response
    if (data.candidates && data.candidates.length > 0) {
      const generatedText = data.candidates[0].content.parts[0].text;
      return generatedText.trim();
    }

    return formatJsonFallback(jsonResponse, context);
  } catch (error) {
    console.error("Error formatting response:", error);
    return formatJsonFallback(jsonResponse, context);
  }
}

/**
 * Creates an appropriate prompt for Gemini based on context
 */
function createPrompt(jsonString: string, context?: string): string {
  const basePrompt = `Convert the following JSON response into a natural, conversational message that a student would easily understand. Make it friendly, clear, and concise. Do not include the JSON structure in your response - just provide the natural language explanation.`;

  const contextPrompts: Record<string, string> = {
    error: `${basePrompt}\n\nThis is an error message. Explain what went wrong in a helpful and friendly way, and suggest how to fix it if possible.`,
    quiz: `You are a friendly tutor presenting a quiz. Convert this JSON quiz data into a natural, engaging message. Format it as:
1. Start with a brief greeting mentioning the topic and difficulty level
2. Present each question clearly with its options labeled (A, B, C, D or True/False)
3. Use emojis sparingly (📝 for quiz, ✏️ for questions)
4. Make it conversational and encouraging
5. Do NOT reveal the correct answers
6. End with an encouraging note

Keep the formatting clean and easy to read.`,
    general: basePrompt,
  };

  const selectedPrompt = context ? contextPrompts[context] || basePrompt : basePrompt;

  return `${selectedPrompt}\n\nJSON Response:\n${jsonString}\n\nNatural Language Response:`;
}

/**
 * Fallback formatter when Gemini API is not available
 */
function formatJsonFallback(jsonResponse: any, context?: string): string {
  try {
    const data = typeof jsonResponse === "string" 
      ? JSON.parse(jsonResponse) 
      : jsonResponse;

    // Handle common response structures
    if (data.error || context === "error") {
      return `❌ Error: ${data.error?.message || data.message || data.detail || "An error occurred"}`;
    }

    // Handle quiz/assessment responses with quiz_content structure
    if (data.quiz_content && data.quiz_content.questions) {
      const quiz = data.quiz_content;
      const meta = data.response_metadata || {};
      const adaptation = data.adaptation_summary || {};
      
      let formatted = `📝 **${quiz.topic.charAt(0).toUpperCase() + quiz.topic.slice(1)} Quiz**\n\n`;
      
      if (adaptation.difficulty_adjusted_to) {
        formatted += `Difficulty: ${adaptation.difficulty_adjusted_to} | `;
      }
      formatted += `Questions: ${quiz.total_questions}\n`;
      
      if (adaptation.adaptation_reason) {
        formatted += `_${adaptation.adaptation_reason}_\n`;
      }
      
      formatted += `\n---\n\n`;
      
      quiz.questions.forEach((q: any, idx: number) => {
        formatted += `**Question ${idx + 1}:**\n${q.question_text}\n\n`;
        
        if (q.options && Array.isArray(q.options)) {
          q.options.forEach((opt: string, optIdx: number) => {
            const label = q.type === "true_false" ? opt : String.fromCharCode(65 + optIdx);
            formatted += `   ${label}${q.type !== "true_false" ? '.' : ''} ${opt}\n`;
          });
        }
        formatted += `\n`;
      });
      
      formatted += `\n✨ Good luck! Take your time and think through each question carefully.`;
      return formatted;
    }

    // Handle older quiz format
    if (data.questions && Array.isArray(data.questions)) {
      let formatted = data.title ? `📝 ${data.title}\n\n` : "📝 Quiz\n\n";
      data.questions.forEach((q: any, idx: number) => {
        formatted += `${idx + 1}. ${q.question || q.question_text}\n`;
        if (q.options && Array.isArray(q.options)) {
          q.options.forEach((opt: string, optIdx: number) => {
            formatted += `   ${String.fromCharCode(65 + optIdx)}. ${opt}\n`;
          });
        }
        formatted += "\n";
      });
      return formatted;
    }

    if (data.response) {
      return typeof data.response === "string" 
        ? data.response 
        : JSON.stringify(data.response, null, 2);
    }

    if (data.message) {
      return data.message;
    }

    if (data.content) {
      return data.content;
    }

    // Default: prettify JSON
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return String(jsonResponse);
  }
}

/**
 * Checks if a string is valid JSON
 */
function isJsonString(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
