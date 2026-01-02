import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { changes, commitType, context, gitDiff } = await request.json();

    if (!changes && !gitDiff) {
      return NextResponse.json(
        { error: "Either changes description or git diff is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "API key not configured. Please set GEMINI_API_KEY in your environment variables.",
        },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    });

    const systemPrompt = `You are an expert at writing clear, concise, and professional Git commit messages following conventional commit standards.

When analyzing git diffs:
1. Focus on the actual code changes and their purpose
2. Identify added/removed/modified files
3. Understand the context of the changes
4. Determine the most appropriate commit type

Generate commit messages that:
1. Follow the format: type(scope): subject
2. Use imperative mood ("add" not "added" or "adds")
3. Keep subject line under 72 characters
4. Are clear and descriptive
5. Include a body with more details if needed
6. Accurately reflect the actual changes in the code

Common types: feat, fix, docs, style, refactor, test, chore, perf, ci, build

For scope, use the affected module, component, or area of the codebase.

Return ONLY a JSON object with this structure:
{
  "commitMessage": "the main commit message",
  "body": "optional detailed explanation (can be empty string)",
  "alternatives": ["alternative 1", "alternative 2", "alternative 3"]
}

Do not include any markdown formatting, code blocks, or additional text. Return only the raw JSON object.`;

    let userPrompt = "";

    if (gitDiff) {
      userPrompt = `Analyze this git diff and generate appropriate commit messages:

\`\`\`diff
${gitDiff}
\`\`\`

${changes ? `Additional description: ${changes}` : ""}
${commitType ? `Preferred type: ${commitType}` : ""}
${context ? `Additional context: ${context}` : ""}

Based on the actual code changes in the diff, provide one main commit message and 3 alternatives.`;
    } else {
      userPrompt = `Generate commit messages for these changes:

Changes: ${changes}
${commitType ? `Preferred type: ${commitType}` : ""}
${context ? `Additional context: ${context}` : ""}

Provide one main commit message and 3 alternatives.`;
    }

    const fullPrompt = `${systemPrompt}

${userPrompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse the JSON response
    // Remove markdown code blocks if present
    let cleanedText = responseText.trim();
    cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not find JSON in response:", responseText);
      throw new Error("Could not parse response from AI");
    }

    const parsedResult = JSON.parse(jsonMatch[0]);

    // Validate the structure
    if (
      !parsedResult.commitMessage ||
      !Array.isArray(parsedResult.alternatives)
    ) {
      throw new Error("Invalid response structure from AI");
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("Error generating commit message:", error);

    // Provide more specific error messages
    if (error.message?.includes("API key")) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your GEMINI_API_KEY." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate commit message" },
      { status: 500 }
    );
  }
}
