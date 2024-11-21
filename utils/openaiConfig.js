import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const extractOrderDetailsFromNotes = async (notes) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a helper that extracts order details from delivery notes. Extract the following information:
                    1. Driver tip amount (as a number)
                    2. Order subtotal (as a number)
                    3. Cleaned notes (original notes with tip and subtotal information removed)
                    
                    Respond in JSON format:
                    {
                        "driverTip": number | null,
                        "subtotal": number | null,
                        "cleanedNotes": "string"
                    }`
                },
                {
                    role: "user",
                    content: `Extract order details from these notes: "${notes}"`
                }
            ],
            temperature: 0,
            response_format: { type: "json_object" }
        });

        const response = JSON.parse(completion.choices[0].message.content);
        
        // Ensure the response has all required fields
        return {
            driverTip: response.driverTip || null,
            subtotal: response.subtotal || null,
            cleanedNotes: response.cleanedNotes?.trim() || notes
        };
    } catch (error) {
        console.error('Error extracting order details from notes:', error);
        return {
            driverTip: null,
            subtotal: null,
            cleanedNotes: notes
        };
    }
};
