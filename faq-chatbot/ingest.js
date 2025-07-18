// ingest.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

async function ingestData() {
    console.log('Starting data ingestion...');

    const fileContent = readFileSync('./faq.txt', 'utf-8');
    const qaPairs = fileContent.split(/\n\s*\n/).filter(p => p.trim());

    console.log(`Found ${qaPairs.length} Q&A pairs. Creating embeddings...`);

    const vectors = [];
    for (let i = 0; i < qaPairs.length; i++) {
        const pair = qaPairs[i];
        const content = pair.replace(/^Question: /m, '').replace(/^Answer: /m, '\n');
        const result = await embeddingModel.embedContent(content);
        vectors.push({
            id: `faq-${i}`,
            values: result.embedding.values,
            metadata: { text: pair },
        });
        console.log(`Embedded vector ${i + 1}/${qaPairs.length}`);
    }

    console.log('Uploading vectors to Pinecone...');
    await pineconeIndex.upsert(vectors);
    console.log('✅ Ingestion complete!');
}

ingestData().catch(error => console.error('Ingestion failed:', error));