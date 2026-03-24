import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateProgressReport(studentName: string, performance: string, language: 'en' | 'ur') {
  const prompt = `Generate a monthly progress report for a student named ${studentName}. 
  Performance details: ${performance}. 
  Language: ${language === 'ur' ? 'Urdu' : 'English'}.
  Format: Professional school report card style.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
}

export async function generateSocialMediaPost(event: string, language: 'en' | 'ur') {
  const prompt = `Create a social media post for ${event} for a school named "The Sepals School System". 
  Language: ${language === 'ur' ? 'Urdu' : 'English'}.
  Include a professional caption and suggestions for an image background.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
}

export async function generateManagementReport(stats: any, language: 'en' | 'ur') {
  const prompt = `Generate a comprehensive monthly school management report based on these stats: ${JSON.stringify(stats)}. 
  Language: ${language === 'ur' ? 'Urdu' : 'English'}.
  Include analysis of attendance, fee collection, and expenses.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
}
