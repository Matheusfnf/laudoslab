const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function run() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = "Hello! Are you there?";
        const result = await model.generateContent(prompt);
        console.log(result.response.text());
    } catch (e) {
        console.error("FATAL ERROR", e);
    }
}

run();
