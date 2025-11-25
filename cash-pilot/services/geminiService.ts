import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateFinancialAdvice = async (state: AppState): Promise<string> => {
  const client = getClient();
  if (!client) return "API Key not configured. Please add your Gemini API Key.";

  // Prepare a summary to avoid sending too much token data
  const summary = {
    totalBalance: state.accounts.reduce((acc, curr) => acc + curr.balance, 0),
    transactionCount: state.transactions.length,
    recentTransactions: state.transactions.slice(0, 20),
    activeLoans: state.loans.filter(l => l.status === 'ACTIVE').map(l => ({
      type: l.type,
      counterparty: l.counterparty,
      amount: l.principal,
      due: l.dueDate
    })),
    currency: state.settings.currency
  };

  const prompt = `
    You are a financial advisor for the app "Cash Pilot".
    Analyze the following user financial summary JSON and provide 3 brief, actionable insights or warnings.
    Focus on spending habits, loan risks (overdue or high interest), and saving opportunities.
    Keep it friendly and encouraging.
    
    Data:
    ${JSON.stringify(summary, null, 2)}
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate insights at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error analyzing your data.";
  }
};