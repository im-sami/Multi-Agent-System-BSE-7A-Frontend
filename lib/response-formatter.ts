/**
 * Response Formatter - Uses server-side API to format agent responses
 * Calls /api/format which uses Gemini gemma-3-4b-it model
 */

/**
 * Formats any response into readable, well-structured text
 * @param response - The response to format (string, JSON, or object)
 * @param context - Optional context hint (unused, kept for compatibility)
 * @returns Formatted, readable response
 */
export async function formatResponseToChat(
  response: any,
  context?: string
): Promise<string> {
  try {
    // Convert response to string for processing
    let contentString: string;
    
    if (typeof response === "string") {
      contentString = response;
    } else {
      contentString = JSON.stringify(response, null, 2);
    }

    // If it's a simple, short string that's already readable, return it
    if (typeof response === "string" && response.length < 100 && !response.includes("{") && !response.includes("[")) {
      return response;
    }

    // Call the server-side formatting API
    const apiResponse = await fetch("/api/format", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: contentString }),
    });

    if (!apiResponse.ok) {
      console.error("Format API error:", apiResponse.status);
      return basicFormat(contentString);
    }

    const data = await apiResponse.json();
    return data.formatted || basicFormat(contentString);
  } catch (error) {
    console.error("Error formatting response:", error);
    return basicFormat(typeof response === "string" ? response : JSON.stringify(response, null, 2));
  }
}

/**
 * Basic formatting fallback
 */
function basicFormat(content: string): string {
  try {
    const data = JSON.parse(content);
    
    if (data.response) {
      return typeof data.response === "string" ? data.response : JSON.stringify(data.response, null, 2);
    }
    if (data.message) return data.message;
    if (data.content) return data.content;
    if (data.result) {
      return typeof data.result === "string" ? data.result : JSON.stringify(data.result, null, 2);
    }
    if (data.error) {
      return `Error: ${data.error.message || data.error}`;
    }
    
    return content;
  } catch {
    return content;
  }
}
