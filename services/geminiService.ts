import { GoogleGenAI, Type } from "@google/genai";
import { Expense, BudgetSettings } from "../types";

// Always initialize with process.env.API_KEY directly using a named parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFinances = async (
  expenses: Expense[],
  settings: BudgetSettings,
  currentDate: string
) => {
  // Safe access to environment variable
  if (!process.env.API_KEY) {
      console.warn("Gemini API Key is missing. Skipping analysis.");
      return {
        summary: "智能服务未配置。",
        advice: "API Key 缺失，请检查环境变量。",
        sentiment: "neutral"
      };
  }

  try {
    // Filter for current month's expenses
    const currentMonth = currentDate.substring(0, 7); // YYYY-MM
    const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
    
    // Ensure we use the latest fixed budget sum, or sum up the list if available
    const fixedTotal = settings.fixedBudget;
    const fixedItemsList = (settings.recurringFixed || []).map(i => `${i.name}: ${i.amount}`).join(', ');

    const prompt = `
      Current Date: ${currentDate}
      Monthly Budget Settings:
      - Total Income: ${settings.totalBudget}
      - Planned Fixed Costs Total: ${fixedTotal}
      - Planned Fixed Items: ${fixedItemsList || 'None specified'}
      - Savings Goal: ${settings.savingsGoal}
      
      Recent Expenses (Last 10 items):
      ${JSON.stringify(monthlyExpenses.slice(-10))}

      Total Flexible Spent this month: ${monthlyExpenses.filter(e => e.type === 'FLEXIBLE').reduce((a, b) => a + b.amount, 0)}

      Task: Provide a concise, minimalist financial daily summary.
      1. Analyze if the user is saving money or overspending based on the dynamic daily budget logic.
      2. Provide 1 sentence of specific advice or encouragement.
      3. Determine sentiment (positive/neutral/negative).
    `;

    // Use 'gemini-3-flash-preview' for basic text summarization tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            advice: { type: Type.STRING },
            sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative'] }
          },
          required: ['summary', 'advice', 'sentiment'],
          propertyOrdering: ["summary", "advice", "sentiment"]
        }
      }
    });

    // Access the .text property directly (not a method)
    const resultText = response.text;
    if (resultText) {
      return JSON.parse(resultText.trim());
    }
    throw new Error("No response from AI");

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      summary: "无法连接智能分析服务。",
      advice: "请继续保持记账习惯。",
      sentiment: "neutral"
    };
  }
};