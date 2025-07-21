# JMCG-Chat

AI-powered FAQ chatbot with Pinecone vector search integration for grounded, accurate responses.

## Features

- **Vector Search**: Uses Pinecone vector database to find relevant FAQ content
- **AI Embedding**: Leverages Gemini's embedding model to understand user queries
- **Contextual Responses**: Provides accurate answers grounded in your FAQ data
- **Modern UI**: Clean, responsive chat interface with typewriter animations

## Setup Instructions

### Prerequisites

1. **Gemini API Key**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Pinecone Account**: Sign up at [Pinecone](https://www.pinecone.io/) and create an API key

### Pinecone Setup

1. **Create Pinecone Account**
   - Visit [Pinecone](https://www.pinecone.io/) and sign up
   - Navigate to API Keys section and create a new API key

2. **Create Pinecone Index**
   - In your Pinecone dashboard, create a new index with these settings:
     - **Index Name**: `faq-chatbot`
     - **Dimensions**: `768` (for Gemini embedding-001 model)
     - **Metric**: `cosine`
     - **Environment**: `us-east-1` (or your preferred region)

3. **Environment Variables**
   - Copy `.env.example` to `.env` in the `faq-chatbot` directory
   - Fill in your API keys and configuration:

```bash
# Copy the example file
cp faq-chatbot/.env.example faq-chatbot/.env

# Edit the .env file with your credentials
nano faq-chatbot/.env
```

Required environment variables:
- `GEMINI_API_KEY`: Your Google Gemini API key
- `PINECONE_API_KEY`: Your Pinecone API key  
- `PINECONE_INDEX`: Index name (default: "faq-chatbot")
- `PINECONE_ENVIRONMENT`: Pinecone environment (default: "us-east-1")
- `PORT`: Server port (optional, defaults to 3000)

### Installation & Usage

1. **Install Dependencies**
```bash
cd faq-chatbot
npm install
```

2. **Ingest FAQ Data** (First time setup)
```bash
npm run ingest
```

3. **Start the Server**
```bash
npm start
```

4. **Access the Chatbot**
   - Open `index.html` in your browser, or
   - Visit `http://localhost:3000` if serving the HTML file

### Data Ingestion

The chatbot reads FAQ data from `faq.txt`. To update the knowledge base:

1. Edit `faq.txt` with your questions and answers
2. Run the ingestion script: `npm run ingest`
3. Restart the server

## API Endpoints

### POST `/api/chat`

Send a chat message and receive an AI response.

**Request:**
```json
{
  "message": "What does GEO mean?"
}
```

**Response:**
```json
{
  "response": "GEO stands for Generative Engine Optimization..."
}
```

## Architecture

1. **User Input**: Frontend captures user's question
2. **Embedding**: Backend uses Gemini to create embedding vector from the question
3. **Vector Search**: Query Pinecone index to find most relevant FAQ entries
4. **Context Assembly**: Combine relevant FAQ content into context
5. **AI Generation**: Send context + question to Gemini for final answer
6. **Response**: Return grounded, accurate response to frontend

## Technology Stack

- **Backend**: Node.js, Express
- **AI Models**: Google Gemini (embedding-001, gemini-1.5-flash)
- **Vector Database**: Pinecone
- **Frontend**: Vanilla HTML/CSS/JavaScript with Tailwind CSS