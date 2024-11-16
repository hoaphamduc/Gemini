const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

// Chat endpoint (home page)
app.get("/", (req, res) => {
    res.render("chat");
});

async function fetchAIResponse(genAI, message, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent([message]);
            return result.response.text();
        } catch (error) {
            if (error.status === 503 && i < retries - 1) {
                console.log("Model overloaded. Retrying...");
                await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
            } else {
                throw error; // Re-throw other errors or final failure
            }
        }
    }
}

app.post("/chat", async (req, res) => {
    const userMessage = req.body.message;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const aiResponse = await fetchAIResponse(genAI, userMessage);
        res.json({ success: true, response: aiResponse });
    } catch (error) {
        res.json({ success: false, error: error.message || "An error occurred. Please try again later." });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Chat app running at http://localhost:${port}`);
});
