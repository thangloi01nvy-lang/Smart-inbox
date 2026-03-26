import { GoogleGenAI, Type } from "@google/genai";

// Lazy initialization of the Gemini AI client
let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
  if (aiInstance) return aiInstance;

  const key = process.env.GEMINI_API_KEY;
  
  if (!key) {
    throw new Error("Mã API Gemini chưa được cấu hình.");
  }

  aiInstance = new GoogleGenAI({ apiKey: key });
  return aiInstance;
};

export interface StudentAnalysis {
  name: string;
  comment: string;
  currentScore: number;
  targetScore: number;
  estimatedDaysToTarget: number;
}

export interface AnalysisResult {
  id?: string;
  date?: string;
  students: StudentAnalysis[];
  transcript: string;
  summary: string;
  audioUrl?: string;
  storagePath?: string;
}

export async function analyzeMedia(
  base64Data: string,
  mimeType: string,
  contextClass: string
): Promise<AnalysisResult> {
  const ai = getAiClient();
  const prompt = `
    You are an AI assistant for a teacher. Analyze the provided media (audio or image).
    The context is a class named "${contextClass}".
    
    Tasks:
    1. Identify any students mentioned or present in the content (e.g., "Minh", "Lan").
    2. For each student identified, provide a brief, constructive comment on their performance (e.g., pronunciation, grammar, vocabulary, or homework quality).
       IMPORTANT: Ensure each student appears only ONCE in the students array. If a student is mentioned multiple times, aggregate all feedback into their single comment field.
    3. Estimate their current score (0-100), their target score (usually 100), and predict the number of days (estimatedDaysToTarget) they will need to reach their target based on current performance.
    4. Provide a full transcript of the audio, or a detailed description of the image content.
    5. Provide a short overall summary.
    
    IMPORTANT: You must return the result strictly as a JSON object matching the requested schema.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        {
          text: prompt,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          students: {
            type: Type.ARRAY,
            description: "List of students identified and their feedback",
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Name of the student",
                },
                comment: {
                  type: Type.STRING,
                  description: "Constructive feedback for the student",
                },
                currentScore: {
                  type: Type.INTEGER,
                  description: "Estimated current score (0-100)",
                },
                targetScore: {
                  type: Type.INTEGER,
                  description: "Target score (usually 100)",
                },
                estimatedDaysToTarget: {
                  type: Type.INTEGER,
                  description: "Predicted number of days to reach the target score",
                },
              },
              required: ["name", "comment", "currentScore", "targetScore", "estimatedDaysToTarget"],
            },
          },
          transcript: {
            type: Type.STRING,
            description: "Full transcript of the audio, or detailed description of the image",
          },
          summary: {
            type: Type.STRING,
            description: "Short overall summary of the session",
          },
        },
        required: ["students", "transcript", "summary"],
      },
    },
  });

  let text = "";
  try {
    text = response.text;
  } catch (e: any) {
    console.error("Error getting response text:", e);
    throw new Error("Phản hồi từ AI bị chặn hoặc không có nội dung: " + e.message);
  }

  if (!text) {
    throw new Error("No response from Gemini");
  }

  // Remove markdown code blocks if present
  text = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  try {
    return JSON.parse(text) as AnalysisResult;
  } catch (e: any) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Lỗi phân tích dữ liệu từ AI: " + e.message);
  }
}

export async function analyzeText(
  text: string,
  contextClass: string
): Promise<AnalysisResult> {
  const ai = getAiClient();
  const prompt = `
    You are an AI assistant for a teacher. Analyze the provided text note from the teacher.
    The context is a class named "${contextClass}".
    
    Tasks:
    1. Identify any students mentioned or present in the content (e.g., "Minh", "Lan").
    2. For each student identified, provide a brief, constructive comment on their performance (e.g., pronunciation, grammar, vocabulary, or homework quality).
       IMPORTANT: Ensure each student appears only ONCE in the students array. If a student is mentioned multiple times, aggregate all feedback into their single comment field.
    3. Estimate their current score (0-100), their target score (usually 100), and predict the number of days (estimatedDaysToTarget) they will need to reach their target based on current performance.
    4. Provide the original text as the transcript.
    5. Provide a short overall summary.
    
    IMPORTANT: You must return the result strictly as a JSON object matching the requested schema.
    
    Teacher's Note:
    "${text}"
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          students: {
            type: Type.ARRAY,
            description: "List of students identified and their feedback",
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Name of the student",
                },
                comment: {
                  type: Type.STRING,
                  description: "Constructive feedback for the student",
                },
                currentScore: {
                  type: Type.INTEGER,
                  description: "Estimated current score (0-100)",
                },
                targetScore: {
                  type: Type.INTEGER,
                  description: "Target score (usually 100)",
                },
                estimatedDaysToTarget: {
                  type: Type.INTEGER,
                  description: "Predicted number of days to reach the target score",
                },
              },
              required: ["name", "comment", "currentScore", "targetScore", "estimatedDaysToTarget"],
            },
          },
          transcript: {
            type: Type.STRING,
            description: "Full transcript of the audio, or detailed description of the image",
          },
          summary: {
            type: Type.STRING,
            description: "Short overall summary of the session",
          },
        },
        required: ["students", "transcript", "summary"],
      },
    },
  });

  let responseText = "";
  try {
    responseText = response.text;
  } catch (e: any) {
    console.error("Error getting response text:", e);
    throw new Error("Phản hồi từ AI bị chặn hoặc không có nội dung: " + e.message);
  }

  if (!responseText) {
    throw new Error("No response from Gemini");
  }

  // Remove markdown code blocks if present
  responseText = responseText.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  try {
    return JSON.parse(responseText) as AnalysisResult;
  } catch (e: any) {
    console.error("Failed to parse JSON:", responseText);
    throw new Error("Lỗi phân tích dữ liệu từ AI: " + e.message);
  }
}
