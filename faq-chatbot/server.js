import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

dotenv.config();

// --- INITIALIZATION ---
const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(); // Uses service account or API key from environment
const pinecone = new Pinecone(); // Uses API key from environment
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


// --- MAIN CHATBOT LOGIC WITH DETAILED LOGGING ---
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        console.log(`--- NEW REQUEST ---`);
        console.log(`Received message: "${message}"`);

        console.log('Step 1: Attempting to create embedding with Gemini...');
        const embeddingResult = await embeddingModel.embedContent(message);
        const vector = embeddingResult.embedding.values;
        console.log('Step 1 SUCCESS: Embedding created.');

        console.log('Step 2: Attempting to query Pinecone...');
        const queryResponse = await pineconeIndex.query({
            vector: vector,
            topK: 3,
            includeMetadata: true,
        });
        console.log(`Step 2 SUCCESS: Pinecone query returned ${queryResponse.matches.length} matches.`);

        if (queryResponse.matches.length === 0) {
            console.log('CRITICAL: No relevant documents found in Pinecone. The search failed.');
        }

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

        console.log('Step 3: Sending final prompt to Gemini...');
        const chatResult = await chatModel.generateContent(prompt);
        const responseText = await chatResult.response.text();
        console.log('Step 3 SUCCESS: Final response received from Gemini.');
        
        res.json({ response: responseText });

    } catch (error) {
        console.error("---!!!! CHATBOT FAILED AT A CRITICAL STEP !!!! ---");
        console.error(error); 
        res.status(500).json({ error: 'The server failed to process the request.' });
    }
});


// --- START THE SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});