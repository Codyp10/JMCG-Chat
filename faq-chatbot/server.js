// FINAL server.js
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleAuth } from 'google-auth-library'; // <-- NEW IMPORT

dotenv.config();

// This function starts the server after setting up the new authentication
async function startServer() {
    // --- NEW AUTHENTICATION SETUP ---
    // This automatically finds and uses your new google-credentials.json secret file
    const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    const authClient = await auth.getClient();

    // --- INITIALIZATION ---
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Initialize clients using the new auth method
    const genAI = new GoogleGenerativeAI({ authClient }); // <-- Use the new authClient
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // --- MAIN CHATBOT LOGIC ---
    app.post('/api/chat', async (req, res) => {
        try {
            const { message } = req.body;
            const embeddingResult = await embeddingModel.embedContent(message);
            const queryResponse = await pineconeIndex.query({
                vector: embeddingResult.embedding.values,
                topK: 3,
                includeMetadata: true,
            });
            const context = queryResponse.matches.map(match => match.metadata.text).join("\n\n---\n\n");
            const prompt = `
                You are a helpful customer support chatbot named GEO.
                Use the following context from the company's FAQ to answer the user's question.
                Your answer must be based *only* on the provided context.
                If the context does not contain the answer, you must say: "I'm sorry, I don't have information on that topic."
                Do not make up answers or use external knowledge.
                CONTEXT:
                ${context}
                USER'S QUESTION:
                ${message}
            `;
            const chatResult = await chatModel.generateContent(prompt);
            const responseText = await chatResult.response.text();
            res.json({ response: responseText });
        } catch (error) {
            console.error("Chat endpoint failed:", error); 
            res.status(500).json({ error: 'The server failed to process the request.' });
        }
    });

    // --- START THE SERVER ---
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
    });
}

// Run the server setup
startServer().catch(console.error);