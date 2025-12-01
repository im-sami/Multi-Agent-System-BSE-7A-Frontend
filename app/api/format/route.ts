import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemma-3-4b-it:generateContent";

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ formatted: "" });
    }

    // If no API key, return content as-is
    if (!GEMINI_API_KEY) {
      console.warn("No Gemini API key found for formatting");
      return NextResponse.json({ formatted: basicFormat(content) });
    }

    // Create strict formatting prompt
    const prompt = `You are a response formatter. Your ONLY job is to format the following content to be readable and well-structured for display in a chat interface.

CRITICAL RULES:
1. DO NOT change, add, remove, or modify ANY information or data
2. DO NOT add your own commentary, explanations, or opinions
3. DO NOT summarize or paraphrase - keep ALL original content intact
4. DO NOT add greetings, sign-offs, or extra text
5. ONLY improve formatting: use markdown headers, bullet points, bold, spacing
6. For quizzes/questions: format clearly with numbered questions and lettered options (A, B, C, D)
7. For activities: show each activity with its details clearly organized
8. Remove JSON syntax (braces, quotes, colons) and present as clean readable text
9. Preserve all data values, answers, and technical details exactly as given

Content to format:
${content}

Clean formatted output:`;

    // Call Gemini API
    const apiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("Gemini API error:", apiResponse.status, errorText);
      return NextResponse.json({ formatted: basicFormat(content) });
    }

    const data = await apiResponse.json();

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const formattedText = data.candidates[0].content.parts[0].text.trim();
      return NextResponse.json({ formatted: formattedText });
    }

    return NextResponse.json({ formatted: basicFormat(content) });
  } catch (error) {
    console.error("Format API error:", error);
    return NextResponse.json({ formatted: String(error) }, { status: 500 });
  }
}

function basicFormat(content: string): string {
  try {
    const data = typeof content === "string" ? JSON.parse(content) : content;
    
    if (data.response) {
      return typeof data.response === "string" ? data.response : JSON.stringify(data.response, null, 2);
    }
    if (data.message) return data.message;
    if (data.content) return data.content;
    if (data.result) {
      return typeof data.result === "string" ? data.result : JSON.stringify(data.result, null, 2);
    }
    
    return typeof content === "string" ? content : JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
}
