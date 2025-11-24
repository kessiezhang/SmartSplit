import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReceiptData, ReceiptItem } from '../types';

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const receiptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    storeName: { type: Type.STRING, description: "Name of the merchant or restaurant" },
    date: { type: Type.STRING, description: "Date of transaction found on receipt" },
    items: {
      type: Type.ARRAY,
      description: "List of purchased items with individual prices",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Short description of the item" },
          price: { type: Type.NUMBER, description: "Price of the item (unit price * quantity)" },
          quantity: { type: Type.NUMBER, description: "Quantity of the item usually 1" },
        },
        required: ["name", "price", "quantity"],
      },
    },
    subtotal: { type: Type.NUMBER, description: "Subtotal before tax" },
    tax: { type: Type.NUMBER, description: "Tax amount" },
    total: { type: Type.NUMBER, description: "Grand total" },
  },
  required: ["items", "total"],
};

export const parseReceiptImage = async (base64Image: string): Promise<ReceiptData> => {
  const ai = getClient();
  
  // Clean base64 string if it has the data prefix
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: "Analyze this receipt. Extract all line items, the tax amount, and the total. If subtotal is missing, calculate it from items." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
        systemInstruction: "You are a precise receipt OCR assistant. Accurately extract item names and prices. Ignore credit card slip details like 'Auth Code'. Ensure numeric values are floats."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);

    // Post-processing to ensure IDs
    const itemsWithIds: ReceiptItem[] = (data.items || []).map((item: any) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      quantity: item.quantity || 1
    }));

    return {
      storeName: data.storeName || "Unknown Store",
      date: data.date || new Date().toLocaleDateString(),
      items: itemsWithIds,
      subtotal: data.subtotal || itemsWithIds.reduce((acc: number, item: ReceiptItem) => acc + item.price, 0),
      tax: data.tax || 0,
      total: data.total || 0,
    };
  } catch (error) {
    console.error("Gemini Receipt Parse Error:", error);
    throw new Error("Failed to parse receipt. Please try again or ensure the image is clear.");
  }
};