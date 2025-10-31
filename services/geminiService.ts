
import { GoogleGenAI } from "@google/genai";
import type { Move } from 'chess.js';
import type { MoveClassification } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("Gemini API key not found. Explanations will not work. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getMoveExplanation = async (
  fen: string,
  move: Move,
  classification: MoveClassification,
  bestMove?: Move,
  evaluation?: number
): Promise<string> => {

  if (!API_KEY) {
    return "Gemini API key not configured. Cannot generate explanations.";
  }
  
  const model = ai.models['gemini-2.5-flash'];
  
  const turn = move.color === 'w' ? 'White' : 'Black';

  const prompt = `
    You are a friendly and insightful chess coach.
    Analyze the following chess move and explain it in 1-2 concise sentences for a beginner to intermediate player.

    **Position (FEN):** ${fen}
    **Player:** ${turn}
    **Move Made:** ${move.san}
    **Move Classification:** ${classification}
    ${bestMove ? `**Engine's Best Move:** ${bestMove.san}` : ''}
    ${evaluation !== undefined ? `**Position Evaluation (before move):** ${evaluation / 100}` : ''}

    Explain why the move is classified as "${classification}". If it's a mistake or blunder, briefly explain the consequence and why the engine's suggested move is better. Keep the tone encouraging.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
        topP: 0.95,
        topK: 64
      }
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate explanation from Gemini API.");
  }
};
