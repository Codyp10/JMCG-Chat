// server.js
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
const chatModel = genAI.getGenerativeModel({ model: "gemini-pro" });

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
        console.error("Error in /api/chat:", error);
        res.status(500).json({ error: 'Failed to get AI response.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});