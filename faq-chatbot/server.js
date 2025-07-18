// --- TEMPORARY TEST CODE ---
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

// --- PASTE YOUR KEYS DIRECTLY HERE FOR THE TEST ---
const GEMINI_API_KEY_TEST = 'AIzaSyCDQKlS-WTWvgPmb8Se-eb0zmXp4LAH_E4';
const PINECONE_API_KEY_TEST = 'pcsk_gzaqE_DSTvEU7hhzpfxVg27p7AMj6Z51HNPeKJCePQpjh99xn6aPWqmUqDTN2kVJVX5VL';
const PINECONE_INDEX_TEST = 'faq-chatbot';

// --- INITIALIZATION ---
const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY_TEST);
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY_TEST });

const pineconeIndex = pinecone.index(PINECONE_INDEX_TEST);
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