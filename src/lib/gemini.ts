import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface SpellingError {
  original: string;
  corrected: string;
  context: string;
}

export interface GraderResult {
  transcription: string;
  correctedText: string;
  spellingErrors: SpellingError[];
  feedback: string;
}

export async function gradeHandwriting(base64Image: string, mimeType: string): Promise<GraderResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: "You are an expert English teacher. The input image is a student's handwritten assignment. Please perform OCR carefully, focusing on stroke patterns. If a word is unclear, use the context of the sentence to infer the most likely English word. Return the result in JSON format with the exact transcription, a fully corrected version, a list of spelling errors found in the handwriting, and some general feedback.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: {
            type: Type.STRING,
            description: "The exact transcribed text, preserving original spelling where possible, but using context for unclear words.",
          },
          correctedText: {
            type: Type.STRING,
            description: "The fully corrected version of the text with proper spelling and grammar.",
          },
          spellingErrors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING, description: "The misspelled word as written." },
                corrected: { type: Type.STRING, description: "The correct spelling." },
                context: { type: Type.STRING, description: "The sentence or phrase where the error occurred." },
              },
            },
            description: "A list of spelling errors found in the handwriting.",
          },
          feedback: {
            type: Type.STRING,
            description: "General feedback on the handwriting legibility, spelling, and grammar.",
          },
        },
        required: ["transcription", "correctedText", "spellingErrors", "feedback"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(text) as GraderResult;
}
