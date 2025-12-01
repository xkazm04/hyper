import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize the Gemini client
const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

/**
 * Fetch an image URL and convert to base64
 */
async function urlToBase64(url: string): Promise<{ data: string; mimeType: string }> {
  // Handle base64 data URLs
  if (url.startsWith("data:")) {
    const matches = url.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      return { mimeType: matches[1], data: matches[2] };
    }
    throw new Error("Invalid data URL format");
  }

  // Fetch the image
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const contentType = response.headers.get("content-type") || "image/png";

  return { data: base64, mimeType: contentType };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sceneImageUrl, characterImageUrl, characterName, prompt } = body;

    // Validate inputs
    if (!sceneImageUrl || !characterImageUrl) {
      return NextResponse.json(
        { error: "Both scene and character image URLs are required" },
        { status: 400 }
      );
    }

    // Convert URLs to base64
    const [sceneImage, characterImage] = await Promise.all([
      urlToBase64(sceneImageUrl),
      urlToBase64(characterImageUrl),
    ]);

    // Build the prompt for character insertion
    const insertionPrompt = prompt || `Insert the character${characterName ? ` "${characterName}"` : ""} from the second image naturally into the scene from the first image. Maintain the art style and lighting of the original scene. Position the character appropriately within the scene composition. Keep the character's appearance exactly as shown in the reference image.`;

    // Build the content array for Gemini
    const contents = [
      { text: insertionPrompt },
      {
        inlineData: {
          mimeType: sceneImage.mimeType,
          data: sceneImage.data,
        },
      },
      {
        inlineData: {
          mimeType: characterImage.mimeType,
          data: characterImage.data,
        },
      },
    ];

    // Initialize Gemini client
    const ai = getGeminiClient();

    // Call Gemini API with image generation
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: contents,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // Extract the generated image from response
    let generatedImageBase64: string | null = null;
    let responseText: string | null = null;

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          responseText = part.text;
        } else if (part.inlineData?.data) {
          generatedImageBase64 = part.inlineData.data;
        }
      }
    }

    if (!generatedImageBase64) {
      console.error("No image generated in Gemini response:", response);
      return NextResponse.json(
        { error: "No image was generated. Try adjusting your prompt or images." },
        { status: 500 }
      );
    }

    // Return base64 image with data URL prefix
    return NextResponse.json({
      success: true,
      imageUrl: `data:image/png;base64,${generatedImageBase64}`,
      text: responseText,
    });
  } catch (error) {
    console.error("Gemini API Error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("GEMINI_API_KEY")) {
        return NextResponse.json(
          { error: "Gemini API is not configured" },
          { status: 503 }
        );
      }
      if (error.message.includes("SAFETY")) {
        return NextResponse.json(
          { error: "Content was blocked by safety filters. Try different images." },
          { status: 400 }
        );
      }
      if (error.message.includes("quota") || error.message.includes("rate")) {
        return NextResponse.json(
          { error: "API rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to insert character. Please try again." },
      { status: 500 }
    );
  }
}
