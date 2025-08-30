# TED/TEDx Talks Bot

An AI-powered conversational bot that helps users discover, search, and learn from TED and TEDx talks. The bot uses Elasticsearch for semantic search and OpenAI's GPT models for natural language understanding and response generation.

## Features

- **Semantic Search**: Find TED/TEDx talks using natural language queries
- **Author Search**: Search for talks by specific speakers
- **Category Search**: Browse talks by category
- **AI-Powered Recommendations**: Get personalized talk recommendations
- **Random Discovery**: Discover inspiring talks randomly
- **Statistics**: View collection statistics and insights
- **Vector Search**: Advanced semantic search using embeddings

## Architecture

- **Backend**: AWS Lambda with Node.js 18
- **Search Engine**: Elasticsearch with vector search capabilities
- **AI**: OpenAI GPT-4o-mini for natural language processing
- **Embeddings**: OpenAI text-embedding-3-small for semantic search

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `ES_ENDPOINT`: Elasticsearch endpoint (default: https://es.algofy.ai:9200)
- `ES_INDEX_NAME`: Elasticsearch index names (default: ted_talks,tedx)
- `ES_API_KEY`: Elasticsearch API key
- `EMBEDDING_MODEL`: OpenAI embedding model (default: text-embedding-3-small)

## API Endpoints

The bot supports different types of queries:

### 1. General Search
```json
{
  "message": "talks about artificial intelligence",
  "type": "search"
}
```

### 2. Author Search
```json
{
  "message": "Ken Robinson",
  "type": "author"
}
```

### 3. Category Search
```json
{
  "message": "Technology",
  "type": "category"
}
```

### 4. Recommendations
```json
{
  "message": "I'm interested in psychology and creativity",
  "type": "recommendations"
}
```

### 5. Random Talks
```json
{
  "message": "show me random talks",
  "type": "random"
}
```

### 6. Statistics
```json
{
  "message": "show me statistics",
  "type": "stats"
}
```

## Response Format

All responses follow this structure:

```json
{
  "response": "AI-generated response about the talks",
  "talks": [
    {
      "title": "Talk Title",
      "author": "Speaker Name",
      "url": "YouTube URL",
      "duration": 1200,
      "view_count": 1000000,
      "tags": ["tag1", "tag2"],
      "score": 0.95
    }
  ],
  "type": "search",
  "query": "original query"
}
```

## Data Structure

The Elasticsearch index contains the following fields:

- `video_id`: YouTube video ID
- `title`: Talk title
- `content`: Full transcript/content
- `author`: Speaker name
- `category`: Talk category
- `tags`: Array of relevant tags
- `created_at`: Creation date
- `url`: YouTube URL
- `my_vector`: 1536-dimensional embedding vector
- `content_length`: Character count
- `duration`: Video duration in seconds
- `view_count`: View count
- `extracted_at`: Extraction timestamp

## Deployment

### Prerequisites

1. AWS CLI configured
2. AWS SAM CLI installed
3. Node.js 18+
4. OpenAI API key
5. Elasticsearch access

### Deploy to AWS

1. Install dependencies:
```bash
npm install
```

2. Build the application:
```bash
sam build
```

3. Deploy:
```bash
sam deploy --guided
```

4. Set environment variables during deployment or update them in the AWS Lambda console.

## Local Testing

You can test the bot locally using the provided test events:

```bash
sam local invoke TEDBotFunction -e events/event.json
```

## Data Indexing

The TED/TEDx data has been indexed to Elasticsearch with the following specifications:

- **Index Names**: `ted_talks` and `tedx`
- **Total Documents**: ~4,468 TED/TEDx talks combined
  - **TED Talks**: ~2,882 documents (main TED platform)
  - **TEDx Talks**: ~1,586 documents (TEDx events)
- **Vector Dimensions**: 1536 (using text-embedding-3-small)
- **Search Types**: Text search, vector search, author search, category search across both indexes

## Usage Examples

### Example 1: Search for AI talks
```json
{
  "message": "What are some interesting talks about artificial intelligence and its impact on society?",
  "type": "search"
}
```

### Example 2: Find talks by a specific author
```json
{
  "message": "Simon Sinek",
  "type": "author"
}
```

### Example 3: Get recommendations
```json
{
  "message": "I'm interested in leadership, innovation, and personal development",
  "type": "recommendations"
}
```

### Example 4: Discover random talks
```json
{
  "message": "show me some random inspiring talks",
  "type": "random"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License
